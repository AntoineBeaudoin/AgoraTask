import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { apiFetch } from '../utils/api.js'
import Assignments from '../views/Assignments.vue'

vi.mock('../utils/api.js', () => ({ apiFetch: vi.fn() }))

const avant = {
  id: 20,
  journee: 'lundi',
  heureDebut: '08:00:00',
  heureFin: '09:00:00',
  taskPriorityId: 3,
}
const autreJour = {
  id: 21,
  journee: 'mercredi',
  heureDebut: '10:00:00',
  heureFin: '11:00:00',
  taskPriorityId: 3,
}
const recouvrement = {
  id: 24,
  journee: null,
  heureDebut: '08:30:00',
  heureFin: '09:30:00',
  taskPriorityId: 3,
}
const libre = {
  id: 25,
  journee: 'vendredi',
  heureDebut: '15:00:00',
  heureFin: '16:00:00',
  taskPriorityId: 3,
}

const choix = {
  employes: [
    {
      id: 1,
      prenom: 'Clara',
      nom: 'Côté',
      role: 'personnel_de_terrain',
      poste: { nom: 'Entretien' },
    },
    { id: 2, prenom: 'Naomi', nom: 'Tremblay', role: 'personnel_de_terrain' },
    { id: 3, prenom: 'Julien', nom: 'Morel', role: 'administrateur' },
  ],
  taches: [
    {
      id: 10,
      title: 'Préparer la salle',
      taskPriorityId: 3,
      occurrences: [avant, autreJour, recouvrement, libre],
    },
    { id: 11, title: 'Nettoyer les vestiaires', taskPriorityId: 3, occurrences: [libre] },
  ],
  priorites: [{ id: 3, task_priority: 'Normale' }],
}

function affectation(id, taskId, horaire, isAutomatic = false) {
  return {
    id,
    taskId,
    occurrenceId: horaire.id,
    isAutomatic,
    isCompleted: false,
    task: { id: taskId, title: taskId === 10 ? 'Préparer la salle' : 'Nettoyer les vestiaires' },
    occurrence: { ...horaire, priority: { task_priority: 'Normale' } },
    subTasks: [],
  }
}

let lignes
let indexId
const wrappers = []

beforeEach(() => {
  vi.resetAllMocks()
  indexId = 400
  lignes = [
    {
      id: 50,
      accountId: 1,
      account: { id: 1, prenom: 'Clara', nom: 'Côté', poste: { nom: 'Entretien' } },
      tasks: [
        affectation(101, 10, avant, true),
        affectation(102, 10, autreJour),
        affectation(103, 11, libre),
      ],
    },
    {
      id: 51,
      accountId: 2,
      account: { id: 2, prenom: 'Naomi', nom: 'Tremblay' },
      tasks: [affectation(201, 11, libre)],
    },
  ]
  apiFetch.mockImplementation(async (url, params = {}) => {
    if (url.startsWith('/assign?'))
      return { data: structuredClone(lignes.filter((jour) => jour.tasks.length > 0)) }
    if (url.startsWith('/assign/options?')) return { data: structuredClone(choix) }
    if (url === '/assign/manual') {
      const corps = JSON.parse(params.body)
      const jour = lignes.find((item) => item.accountId === corps.accountId)
      const task = choix.taches.find((item) => item.id === corps.taskId)
      const occurrence = task.occurrences.find((item) => item.id === corps.occurrenceId)
      const cree = affectation(++indexId, corps.taskId, occurrence)
      jour.tasks.push(cree)
      return { data: { id: cree.id } }
    }
    if (url === '/assign/occurrences') {
      const corps = JSON.parse(params.body)
      return { data: { id: ++indexId, tacheId: corps.taskId, ...corps, journee: null } }
    }
    if (params.method === 'DELETE' && url.startsWith('/assign/tasks/')) {
      const id = Number(url.split('/').pop())
      for (const jour of lignes) jour.tasks = jour.tasks.filter((item) => item.id !== id)
      return { data: { id } }
    }
    if (params.method === 'PATCH' && url.includes('/occurrence')) return { data: {} }
    if (url === '/assign/automatic') return { data: { creees: 2, supprimees: 2, ignorees: 0 } }
    throw new Error(`Requête inattendue : ${url}`)
  })
})

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
})

async function monter() {
  const wrapper = mount(Assignments)
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
async function ouvrirManuel(wrapper) {
  await wrapper.get('.header-actions .btn-dark-action').trigger('click')
  await flushPromises()
}
async function choisirManuel(wrapper, horaireId) {
  await ouvrirManuel(wrapper)
  await wrapper.get('#employeManuel').setValue('1')
  await wrapper.findAll('input[name="tacheManuelle"]')[0].setValue('10')
  await wrapper.get('#occurrenceManuelle').setValue(String(horaireId))
}

describe('Assignments.vue : API entièrement simulée', () => {
  test('charge la journée au montage', async () => {
    await monter()
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/assign\?date=\d{4}-\d{2}-\d{2}$/),
      { method: 'GET' },
    )
  })

  test('recherche instantanément les employés sans requête', async () => {
    const wrapper = await monter()
    const appels = apiFetch.mock.calls.length
    await wrapper.get('#rechercheEmploye').setValue('cote')
    expect(wrapper.findAll('.employee-row')).toHaveLength(1)
    expect(apiFetch).toHaveBeenCalledTimes(appels)
  })

  test('affiche le poste d’un employé', async () => {
    const wrapper = await monter()
    expect(wrapper.findAll('.employee-row')[0].text()).toContain('Poste : Entretien')
  })

  test('signale une affectation automatique dans la liste', async () => {
    const wrapper = await monter()
    expect(wrapper.findAll('.employee-row')[0].find('.auto-marker').exists()).toBe(true)
    expect(wrapper.findAll('.employee-row')[1].find('.auto-marker').exists()).toBe(false)
  })

  test('une tâche à la fois et navigation sans appel API', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    const appels = apiFetch.mock.calls.length
    await wrapper.get('[aria-label="Tâche suivante"]').trigger('click')
    expect(wrapper.get('.task-navigation').text()).toContain('2 / 3')
    expect(apiFetch).toHaveBeenCalledTimes(appels)
  })

  test('affiche visiblement l’horaire et la priorité, sans jour de semaine', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    expect(wrapper.get('.schedule-main').text()).toContain('08:00 – 09:00')
    expect(wrapper.get('.schedule-priority').text()).toContain('Normale')
    expect(wrapper.get('.task-card').text()).not.toMatch(/lundi|mercredi|vendredi|n°\s*20/i)
  })

  test('le formulaire n’affiche que les employés de terrain', async () => {
    const wrapper = await monter()
    await ouvrirManuel(wrapper)
    expect(wrapper.get('#employeManuel').text()).toContain('Clara Côté')
    expect(wrapper.get('#employeManuel').text()).not.toContain('Julien Morel')
  })

  test('le manuel propose tous les horaires, quelle que soit leur journée', async () => {
    const wrapper = await monter()
    await ouvrirManuel(wrapper)
    await wrapper.findAll('input[name="tacheManuelle"]')[0].setValue('10')
    const choixHoraires = wrapper.get('#occurrenceManuelle').findAll('option')
    expect(choixHoraires.map((item) => item.element.value)).toEqual(['', '20', '21', '24', '25'])
    expect(wrapper.get('#occurrenceManuelle').text()).not.toMatch(
      /lundi|mercredi|vendredi|n°\s*\d+/i,
    )
  })

  test('rejette avant POST une tâche déjà présente à un horaire chevauchant', async () => {
    const wrapper = await monter()
    await choisirManuel(wrapper, 24)
    await wrapper.get('.manual-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('#titreChevauchement').text()).toContain('Horaire déjà utilisé')
    expect(apiFetch.mock.calls.some(([url]) => url === '/assign/manual')).toBe(false)
  })

  test('accepte la même tâche à un horaire distinct et augmente le compteur', async () => {
    const wrapper = await monter()
    await choisirManuel(wrapper, 25)
    await wrapper.get('.manual-form').trigger('submit')
    await flushPromises()
    expect(apiFetch.mock.calls.find(([url]) => url === '/assign/manual')).toBeTruthy()
    expect(wrapper.findAll('.employee-row')[0].text()).toContain('4 tâche(s)')
  })

  test('un nouvel horaire manuel n’envoie aucun champ de jour au serveur', async () => {
    const wrapper = await monter()
    await ouvrirManuel(wrapper)
    await wrapper.findAll('input[name="tacheManuelle"]')[0].setValue('10')
    await wrapper.get('.field-heading .link-button').trigger('click')
    await wrapper.get('.new-occurrence input[type="time"]').setValue('16:00')
    await wrapper.findAll('.new-occurrence input[type="time"]')[1].setValue('17:00')
    await wrapper.get('.new-occurrence button').trigger('click')
    await flushPromises()
    const corps = JSON.parse(
      apiFetch.mock.calls.find(([url]) => url === '/assign/occurrences')[1].body,
    )
    expect(corps).not.toHaveProperty('journee')
    expect(corps).toMatchObject({ heureDebut: '16:00', heureFin: '17:00' })
  })

  test('le changement d’horaire propose les horaires des autres jours', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    await wrapper.get('.occurrence-toolbar .link-button').trigger('click')
    await flushPromises()
    const select = wrapper.get('.occurrence-editor select')
    expect(select.findAll('option').map((item) => item.element.value)).toContain('25')
  })

  test('le changement d’horaire permet la création d’un horaire inédit', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    await wrapper.get('.occurrence-toolbar .link-button').trigger('click')
    await flushPromises()
    await wrapper.get('.create-schedule-trigger').trigger('click')
    await wrapper.get('.schedule-modification-form input[type="time"]').setValue('16:00')
    await wrapper.findAll('.schedule-modification-form input[type="time"]')[1].setValue('17:00')
    await wrapper.get('.schedule-modification-form button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.occurrence-editor select').element.value).toBe('401')
  })

  test('refuse de changer vers un horaire chevauchant une autre assignation de la même tâche', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    await wrapper.get('.occurrence-toolbar .link-button').trigger('click')
    await flushPromises()
    await wrapper.get('.occurrence-editor select').setValue('24')
    await wrapper.get('.occurrence-editor .btn-green').trigger('click')
    await flushPromises()
    expect(wrapper.find('#titreChevauchement').exists()).toBe(true)
    expect(
      apiFetch.mock.calls.some(
        ([url]) => url.includes('/occurrence') && url.startsWith('/assign/tasks/'),
      ),
    ).toBe(false)
  })

  test('deux assignations de la même tâche restent deux cartes distinctes', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    expect(wrapper.get('.task-navigation').text()).toContain('1 / 3')
    expect(wrapper.get('.schedule-main').text()).toContain('08:00 – 09:00')
    await wrapper.get('[aria-label="Tâche suivante"]').trigger('click')
    expect(wrapper.get('.task-card h3').text()).toBe('Préparer la salle')
    expect(wrapper.get('.schedule-main').text()).toContain('10:00 – 11:00')
  })

  test('la suppression retire la bonne ligne et diminue les compteurs de tâches', async () => {
    const wrapper = await monter()
    await wrapper.findAll('.employee-row')[0].trigger('click')
    await wrapper.get('.task-delete-bar button').trigger('click')
    expect(apiFetch.mock.calls.some(([url, args]) => args.method === 'DELETE')).toBe(false)
    await wrapper.get('.confirm-card .btn-delete').trigger('click')
    await flushPromises()
    expect(apiFetch).toHaveBeenCalledWith('/assign/tasks/101', { method: 'DELETE' })
    expect(wrapper.findAll('.employee-row')[0].text()).toContain('2 tâche(s)')
  })

  test('la régénération automatique reste soumise à confirmation', async () => {
    const wrapper = await monter()
    await wrapper.get('.header-actions .btn-green').trigger('click')
    expect(apiFetch.mock.calls.some(([url]) => url === '/assign/automatic')).toBe(false)
    await wrapper.get('.confirm-card .btn-green').trigger('click')
    await flushPromises()
    expect(apiFetch).toHaveBeenCalledWith(
      '/assign/automatic',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
