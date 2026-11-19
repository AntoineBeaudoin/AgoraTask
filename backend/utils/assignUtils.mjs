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

// Injection des dépendances : les modèles peuvent être remplacés par des mocks Vitest.
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

  async function creerAssignation({
    accountId,
    date,
    taskId,
    occurrenceId,
    sousTaches,
    comment = null,
    isAutomatic,
    transaction,
  }) {
    const [workDay] = await work_day.findOrCreate({
      where: { accountId, date },
      defaults: { isSubmitted: false },
      transaction,
    });

    // Une tâche, au maximum, par employé et par jour dans cette page.
    const existante = await work_day_task.findOne({
      where: { workDayId: workDay.id, taskId },
      transaction,
    });
    if (existante) {
      if (!isAutomatic) {
        throw new AssignError(
          409,
          "Cette tâche est déjà assignée à cet employé pour cette date.",
        );
      }
      return null; // Une affectation manuelle existante est conservée.
    }

    const affectation = await work_day_task.create(
      {
        workDayId: workDay.id,
        taskId,
        occurrenceId,
        comment,
        isCompleted: false,
        isAutomatic,
      },
      { transaction },
    );

    if (sousTaches.length > 0) {
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
    const workDays = await work_day.findAll({
      where: { date },
      attributes: ["id"],
      transaction,
    });
    const workDayIds = workDays.map(({ id }) => id);
    if (!workDayIds.length) return 0;

    const affectations = await work_day_task.findAll({
      where: { workDayId: { [Op.in]: workDayIds }, isAutomatic: true },
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
          attributes: ["id", "prenom", "nom", "role"],
        },
        {
          model: work_day_task,
          as: "tasks",
          required: true,
          include: [
            { model: Task, as: "task" },
            { model: occurrence_de_tache, as: "occurrence" },
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
    const journee = jourDeSemaine(date);
    const [employes, taches, priorites] = await Promise.all([
      Compte.findAll({
        where: { IsArchived: false },
        attributes: ["id", "prenom", "nom", "role", "posteId"],
      }),
      Task.findAll({
        where: { archived: false },
        include: [
          {
            model: occurrence_de_tache,
            as: "occurrences",
            required: false,
            where: { [Op.or]: [{ journee }, { journee: null }] },
          },
        ],
      }),
      task_priority.findAll(),
    ]);
    return { employes, taches, priorites };
  }

  async function assignerAutomatiquement(date) {
    const journee = jourDeSemaine(date);
    return bd.transaction(async (transaction) => {
      // La régénération détruit uniquement les affectations automatiques de cette date.
      const supprimees = await supprimerAnciennesAssignationsAutomatiques(
        date,
        transaction,
      );
      const employes = await Compte.findAll({
        where: { IsArchived: false, posteId: { [Op.ne]: null } },
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
                    where: { journee },
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
          // Une occurrence sans jour n'est jamais utilisée automatiquement.
          const occurrencesDuJour = (tache.occurrences ?? []).filter(
            (occ) => occ.journee === journee,
          );
          const occurrence = choisirOccurrence(occurrencesDuJour);
          if (!occurrence) continue;

          const creee = await creerAssignation({
            accountId: employe.id,
            date,
            taskId: tache.id,
            occurrenceId: occurrence.id,
            sousTaches: tache.sous_taches ?? [],
            isAutomatic: true,
            transaction,
          });
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
    const journee = jourDeSemaine(date);
    if (!accountId || !taskId || !occurrenceId) {
      throw new AssignError(
        400,
        "Employé, tâche et occurrence sont obligatoires.",
      );
    }

    return bd.transaction(async (transaction) => {
      const [employe, tache, occurrence] = await Promise.all([
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
      if (!employe || !tache || !occurrence) {
        throw new AssignError(404, "Employé, tâche ou occurrence introuvable.");
      }
      if (occurrence.journee !== null && occurrence.journee !== journee) {
        throw new AssignError(
          400,
          "L'occurrence ne correspond pas au jour choisi.",
        );
      }

      const sousTaches = await sous_tache.findAll({
        where: { tacheId: taskId },
        transaction,
      });
      return creerAssignation({
        accountId,
        date,
        taskId,
        occurrenceId,
        sousTaches,
        comment,
        isAutomatic: false,
        transaction,
      });
    });
  }

  async function creerOccurrence({
    taskId,
    heureDebut = null,
    heureFin = null,
    journee = null,
    isRequired = true,
    taskPriorityId,
  }) {
    if (!taskId) throw new AssignError(400, "La tâche est obligatoire.");
    if (journee !== null && !JOURS.includes(journee)) {
      throw new AssignError(400, "Jour de semaine invalide.");
    }
    const tache = await Task.findOne({
      where: { id: taskId, archived: false },
    });
    if (!tache) throw new AssignError(404, "Tâche introuvable.");
    const priorite = taskPriorityId ?? tache.taskPriorityId;
    if (!priorite)
      throw new AssignError(
        400,
        "Une priorité est nécessaire pour créer l'occurrence.",
      );
    return occurrence_de_tache.create({
      tacheId: taskId,
      heureDebut,
      heureFin,
      journee,
      isRequired,
      taskPriorityId: priorite,
    });
  }

  async function changerOccurrence(workDayTaskId, occurrenceId) {
    if (!workDayTaskId || !occurrenceId) {
      throw new AssignError(400, "Assignation et occurrence obligatoires.");
    }
    return bd.transaction(async (transaction) => {
      const affectation = await work_day_task.findByPk(workDayTaskId, {
        transaction,
      });
      if (!affectation) throw new AssignError(404, "Assignation introuvable.");
      const [jour, occurrence] = await Promise.all([
        work_day.findByPk(affectation.workDayId, { transaction }),
        occurrence_de_tache.findOne({
          where: { id: occurrenceId, tacheId: affectation.taskId },
          transaction,
        }),
      ]);
      if (!jour || !occurrence)
        throw new AssignError(404, "Journée ou occurrence introuvable.");
      if (
        occurrence.journee !== null &&
        occurrence.journee !== jourDeSemaine(jour.date)
      ) {
        throw new AssignError(
          400,
          "L'occurrence ne correspond pas au jour de l'assignation.",
        );
      }
      await affectation.update({ occurrenceId }, { transaction });
      return affectation;
    });
  }

  return {
    listerJournee,
    listerChoix,
    assignerAutomatiquement,
    assignerManuellement,
    creerOccurrence,
    changerOccurrence,
  };
}
