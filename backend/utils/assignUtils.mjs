export class AssignError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export function jourDeSemaine(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AssignError(400, "La date doit être au format AAAA-MM-JJ.");
  }
  const valeur = new Date(`${date}T12:00:00Z`);
  if (
    Number.isNaN(valeur.getTime()) ||
    valeur.toISOString().slice(0, 10) !== date
  ) {
    throw new AssignError(400, "La date est invalide.");
  }
  return JOURS[valeur.getUTCDay()];
}

function secondesDepuisMinuit(heure) {
  if (
    typeof heure !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(heure)
  )
    return null;
  const [h, m, s = "0"] = heure.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function plageHoraire(horaire) {
  const debut = secondesDepuisMinuit(horaire?.heureDebut);
  const fin = secondesDepuisMinuit(horaire?.heureFin);
  if (debut === null || fin === null || fin <= debut) {
    throw new AssignError(
      400,
      "Horaire invalide : indiquez un début et une fin, avec la fin après le début.",
    );
  }
  return { debut, fin };
}

// Deux plages adjacentes (fin de l'une = début de l'autre) ne se chevauchent pas.
export function horairesSeChevauchent(a, b) {
  const x = plageHoraire(a);
  const y = plageHoraire(b);
  return x.debut < y.fin && y.debut < x.fin;
}

export function choisirOccurrence(occurrences) {
  return (
    [...occurrences].sort(
      (a, b) =>
        String(a.heureDebut ?? "23:59:59").localeCompare(
          String(b.heureDebut ?? "23:59:59"),
        ) || Number(a.id) - Number(b.id),
    )[0] ?? null
  );
}

// Priorité au jour correspondant ; sinon le premier horaire disponible et complet.
export function horairesParPriorite(occurrences, jour) {
  return [...occurrences]
    .filter((horaire) => {
      try {
        plageHoraire(horaire);
        return true;
      } catch {
        return false;
      }
    })
    .sort(
      (a, b) =>
        Number(b.journee === jour) - Number(a.journee === jour) ||
        String(a.heureDebut).localeCompare(String(b.heureDebut)) ||
        Number(a.id) - Number(b.id),
    );
}

export function creerAssignService({ models, bd, Op }) {
  const {
    Compte,
    Poste,
    Task,
    occurrence_de_tache,
    sous_tache,
    task_priority,
    work_day,
    work_day_task,
    work_day_sub_task,
  } = models;

  async function verrouillerJour(jour, transaction) {
    // Le verrou de ligne sérialise deux assignations concurrentes pour le même employé/jour.
    if (transaction?.LOCK?.UPDATE) {
      await work_day.findByPk(jour.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
    }
  }

  async function trouverConflit(
    jourId,
    taskId,
    horaire,
    transaction,
    idExclu = null,
  ) {
    plageHoraire(horaire);
    const dejaAssignees = await work_day_task.findAll({
      where: { workDayId: jourId, taskId },
      include: [{ model: occurrence_de_tache, as: "occurrence" }],
      transaction,
    });
    for (const affectation of dejaAssignees) {
      if (idExclu !== null && Number(affectation.id) === Number(idExclu))
        continue;
      // Si l'ancien horaire est incomplet, on ne peut garantir l'absence de chevauchement.
      if (!affectation.occurrence) return affectation;
      try {
        if (horairesSeChevauchent(horaire, affectation.occurrence))
          return affectation;
      } catch {
        return affectation;
      }
    }
    return null;
  }

  async function creerAssignation({
    accountId,
    date,
    taskId,
    horaire,
    sousTaches,
    comment = null,
    isAutomatic,
    transaction,
  }) {
    const [jour] = await work_day.findOrCreate({
      where: { accountId, date },
      defaults: { isSubmitted: false },
      transaction,
    });
    await verrouillerJour(jour, transaction);
    const conflit = await trouverConflit(jour.id, taskId, horaire, transaction);
    if (conflit) {
      if (isAutomatic) return null;
      throw new AssignError(
        409,
        "Cette tâche existe déjà à cet horaire pour cet employé.",
      );
    }
    const affectation = await work_day_task.create(
      {
        workDayId: jour.id,
        taskId,
        occurrenceId: horaire.id,
        comment,
        isCompleted: false,
        isAutomatic,
      },
      { transaction },
    );
    if (sousTaches.length) {
      await work_day_sub_task.bulkCreate(
        sousTaches.map(({ id }) => ({
          workDayTaskId: affectation.id,
          subTaskId: id,
          isCompleted: false,
        })),
        { transaction },
      );
    }
    return affectation;
  }

  async function supprimerAnciennesAssignationsAutomatiques(date, transaction) {
    const jours = await work_day.findAll({
      where: { date },
      attributes: ["id"],
      transaction,
    });
    const idsJours = jours.map(({ id }) => id);
    if (!idsJours.length) return 0;
    const affectations = await work_day_task.findAll({
      where: { workDayId: { [Op.in]: idsJours }, isAutomatic: true },
      attributes: ["id"],
      transaction,
    });
    const ids = affectations.map(({ id }) => id);
    if (!ids.length) return 0;
    await work_day_sub_task.destroy({
      where: { workDayTaskId: { [Op.in]: ids } },
      transaction,
    });
    await work_day_task.destroy({
      where: { id: { [Op.in]: ids }, isAutomatic: true },
      transaction,
    });
    return ids.length;
  }

  async function listerJournee(date) {
    jourDeSemaine(date);
    return work_day.findAll({
      where: { date },
      include: [
        {
          model: Compte,
          as: "account",
          attributes: ["id", "prenom", "nom", "role", "posteId"],
          include: [
            {
              model: Poste,
              as: "poste",
              attributes: ["id", "nom"],
              required: false,
            },
          ],
        },
        {
          model: work_day_task,
          as: "tasks",
          required: true,
          include: [
            { model: Task, as: "task" },
            {
              model: occurrence_de_tache,
              as: "occurrence",
              include: [{ model: task_priority, as: "priority" }],
            },
            {
              model: work_day_sub_task,
              as: "subTasks",
              include: [{ model: sous_tache, as: "subTask" }],
            },
          ],
        },
      ],
      order: [["accountId", "ASC"]],
    });
  }

  async function listerChoix(date) {
    jourDeSemaine(date);
    const [employes, taches, priorites] = await Promise.all([
      Compte.findAll({
        where: { IsArchived: false, role: "personnel_de_terrain" },
        attributes: ["id", "prenom", "nom", "role", "posteId"],
        include: [
          {
            model: Poste,
            as: "poste",
            attributes: ["id", "nom"],
            required: false,
          },
        ],
      }),
      Task.findAll({
        where: { archived: false },
        include: [
          {
            model: occurrence_de_tache,
            as: "occurrences",
            required: false,
            include: [{ model: task_priority, as: "priority" }],
          },
        ],
      }),
      task_priority.findAll(),
    ]);
    return { employes, taches, priorites };
  }

  async function assignerAutomatiquement(date) {
    const jour = jourDeSemaine(date);
    return bd.transaction(async (transaction) => {
      const supprimees = await supprimerAnciennesAssignationsAutomatiques(
        date,
        transaction,
      );
      const employes = await Compte.findAll({
        where: {
          IsArchived: false,
          role: "personnel_de_terrain",
          posteId: { [Op.ne]: null },
        },
        include: [
          {
            model: Poste,
            as: "poste",
            required: true,
            where: { archived: false },
            include: [
              {
                model: Task,
                as: "tasks",
                required: false,
                where: { archived: false },
                through: { attributes: [] },
                include: [
                  {
                    model: occurrence_de_tache,
                    as: "occurrences",
                    required: false,
                  },
                  { model: sous_tache, as: "sous_taches", required: false },
                ],
              },
            ],
          },
        ],
        transaction,
      });
      let creees = 0;
      let ignorees = 0;
      for (const employe of employes) {
        for (const tache of employe.poste?.tasks ?? []) {
          const horaires = horairesParPriorite(tache.occurrences ?? [], jour);
          if (!horaires.length) {
            ignorees++;
            continue;
          }
          let creee = null;
          for (const horaire of horaires) {
            creee = await creerAssignation({
              accountId: employe.id,
              date,
              taskId: tache.id,
              horaire,
              sousTaches: tache.sous_taches ?? [],
              isAutomatic: true,
              transaction,
            });
            if (creee) break;
          }
          if (creee) creees++;
          else ignorees++;
        }
      }
      return { supprimees, creees, ignorees };
    });
  }

  async function assignerManuellement({
    date,
    accountId,
    taskId,
    occurrenceId,
    comment = null,
  }) {
    jourDeSemaine(date);
    if (!accountId || !taskId || !occurrenceId) {
      throw new AssignError(
        400,
        "Employé, tâche et horaire sont obligatoires.",
      );
    }
    return bd.transaction(async (transaction) => {
      const [employe, tache, horaire] = await Promise.all([
        Compte.findOne({
          where: { id: accountId, IsArchived: false },
          transaction,
        }),
        Task.findOne({ where: { id: taskId, archived: false }, transaction }),
        occurrence_de_tache.findOne({
          where: { id: occurrenceId, tacheId: taskId },
          transaction,
        }),
      ]);
      if (!employe || !tache || !horaire) {
        throw new AssignError(404, "Employé, tâche ou horaire introuvable.");
      }
      if (employe.role !== "personnel_de_terrain") {
        throw new AssignError(
          403,
          "Seul un employé de terrain peut recevoir une tâche.",
        );
      }
      plageHoraire(horaire);
      const sousTaches = await sous_tache.findAll({
        where: { tacheId: taskId },
        transaction,
      });
      return creerAssignation({
        accountId,
        date,
        taskId,
        horaire,
        sousTaches,
        comment,
        isAutomatic: false,
        transaction,
      });
    });
  }

  async function creerOccurrence({
    taskId,
    heureDebut,
    heureFin,
    isRequired = true,
    taskPriorityId,
  }) {
    if (!taskId) throw new AssignError(400, "La tâche est obligatoire.");
    plageHoraire({ heureDebut, heureFin });
    const tache = await Task.findOne({
      where: { id: taskId, archived: false },
    });
    if (!tache) throw new AssignError(404, "Tâche introuvable.");
    const priorite = taskPriorityId ?? tache.taskPriorityId;
    if (!priorite)
      throw new AssignError(
        400,
        "Une priorité est nécessaire pour créer cet horaire.",
      );
    return occurrence_de_tache.create({
      tacheId: taskId,
      heureDebut,
      heureFin,
      journee: null,
      isRequired,
      taskPriorityId: priorite,
    });
  }

  async function changerOccurrence(workDayTaskId, occurrenceId) {
    if (!workDayTaskId || !occurrenceId)
      throw new AssignError(400, "Assignation et horaire obligatoires.");
    return bd.transaction(async (transaction) => {
      const affectation = await work_day_task.findByPk(workDayTaskId, {
        transaction,
      });
      if (!affectation) throw new AssignError(404, "Assignation introuvable.");
      const [jour, horaire] = await Promise.all([
        work_day.findByPk(affectation.workDayId, { transaction }),
        occurrence_de_tache.findOne({
          where: { id: occurrenceId, tacheId: affectation.taskId },
          transaction,
        }),
      ]);
      if (!jour || !horaire)
        throw new AssignError(404, "Journée ou horaire introuvable.");
      await verrouillerJour(jour, transaction);
      const conflit = await trouverConflit(
        jour.id,
        affectation.taskId,
        horaire,
        transaction,
        affectation.id,
      );
      if (conflit)
        throw new AssignError(
          409,
          "Cette tâche existe déjà à cet horaire pour cet employé.",
        );
      await affectation.update({ occurrenceId }, { transaction });
      return affectation;
    });
  }

  async function supprimerAssignation(workDayTaskId) {
    if (!workDayTaskId)
      throw new AssignError(400, "Une assignation est obligatoire.");
    return bd.transaction(async (transaction) => {
      const affectation = await work_day_task.findByPk(workDayTaskId, {
        transaction,
      });
      if (!affectation) throw new AssignError(404, "Assignation introuvable.");
      await work_day_sub_task.destroy({
        where: { workDayTaskId: affectation.id },
        transaction,
      });
      await work_day_task.destroy({
        where: { id: affectation.id },
        transaction,
      });
      return { id: affectation.id };
    });
  }

  return {
    listerJournee,
    listerChoix,
    assignerAutomatiquement,
    assignerManuellement,
    creerOccurrence,
    changerOccurrence,
    supprimerAssignation,
  };
}
