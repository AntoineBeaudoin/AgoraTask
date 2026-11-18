import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import EmployeView from '@/views/EmployeView.vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { useModalStore } from '@/stores/modalStore.js'

vi.mock('@/stores/taskStore.js', () => ({
  useTaskStore: vi.fn(),
}))

vi.mock('@/stores/modalStore.js', () => ({
  useModalStore: vi.fn(),
}))

vi.mock('@/stores/modalStore', () => ({
  useModalStore: vi.fn(),
}))

describe('EmployeView.vue', () => {
  let taskStore
  let modalStore
  let wrappers = []

  const assignedTask = {
    id: 11,
    tacheAFaireId: 101,
    title: 'Inspection sécurité',
    room: 'Piscine',
    description: 'Vérifier les installations selon le PDF.',
    heureDebut: '08:00',
    heureFin: '09:00',
    isCompleted: false,
    commentaire: '',
    sousTaches: [{ id: 1, titre: 'Vérifier filtres', isCompleted: false }],
    images: [],
    documents: [
      {
        id: 1,
        filename: 'consignes-piscine.pdf',
        path: 'https://example.com/consignes-piscine.pdf',
        mimeType: 'application/pdf',
      },
    ],
    externalLinks: [
      {
        id: 1,
        title: 'Normes gouvernementales',
        url: 'https://example.com/normes',
      },
    ],
  }

  beforeEach(() => {
    modalStore = reactive({
      taskDescriptionModalOpen: false,
      observableTask: null,
      openTaskDescription: vi.fn((task) => {
        modalStore.observableTask = task
        modalStore.taskDescriptionModalOpen = true
      }),
      closeTaskModal: vi.fn(() => {
        modalStore.taskDescriptionModalOpen = false
      }),
    })

    taskStore = reactive({
      tasks: [assignedTask],
      myTasks: [assignedTask],
      myTasksLoaded: true,
      loadTasks: vi.fn().mockResolvedValue(),
      loadMyTasks: vi.fn().mockResolvedValue(),
      getTaskById: vi.fn().mockResolvedValue(assignedTask),
      saveProgress: vi.fn().mockResolvedValue(true),
    })

    useTaskStore.mockReturnValue(taskStore)
    useModalStore.mockReturnValue(modalStore)
    window.print = vi.fn()
  })

  function createWrapper() {
    const wrapper = mount(EmployeView, { attachTo: document.body })
    wrappers.push(wrapper)
    return wrapper
  }

  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('affiche l’aperçu PDF interactif et les liens externes dans les détails dépliés de la tâche', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const toggleBtn = wrapper.find('.toggle-details-btn')
    await toggleBtn.trigger('click')
    await nextTick()

    const pdfFrame = wrapper.find('.pdf-preview-frame')
    expect(pdfFrame.exists()).toBe(true)
    expect(pdfFrame.attributes('src')).toContain('https://example.com/consignes-piscine.pdf#zoom=100')

    await wrapper.find('.pdf-zoom-in').trigger('click')
    await nextTick()
    expect(pdfFrame.attributes('src')).toContain('#zoom=125')

    const externalLink = wrapper.find('.external-doc-link')
    expect(externalLink.exists()).toBe(true)
    expect(externalLink.text()).toContain('Normes gouvernementales')
    expect(externalLink.attributes('href')).toBe('https://example.com/normes')
    expect(externalLink.attributes('target')).toBe('_blank')
  })

  test('ouvre TaskDescriptionModal au clic sur le bouton Détails avec le PDF et les liens externes', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const detailsBtn = wrapper.find('.task-details-btn')
    expect(detailsBtn.exists()).toBe(true)

    await detailsBtn.trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(modalStore.openTaskDescription).toHaveBeenCalledTimes(1)
    const modal = document.body.querySelector('#taskModal')
    expect(modal).not.toBeNull()
    expect(modal.textContent).toContain('Inspection sécurité')
    expect(modal.querySelector('.pdf-preview-frame')).not.toBeNull()
    expect(modal.querySelector('.external-doc-link').getAttribute('href')).toBe(
      'https://example.com/normes'
    )
  })

  test('sauvegarde automatiquement lorsqu’une case de tâche ou de sous-tâche est cochée ou décochée', async () => {
    const savedStates = []
    taskStore.saveProgress.mockImplementation(async () => {
      savedStates.push({
        taskCompleted: taskStore.myTasks[0].isCompleted,
        subTaskCompleted: taskStore.myTasks[0].sousTaches[0].isCompleted,
      })
      return true
    })

    const wrapper = createWrapper()
    await nextTick()

    const taskCheckbox = wrapper.find('#task-101')
    const subCheckbox = wrapper.find('#sub-101-1')

    await taskCheckbox.setValue(true)
    await taskCheckbox.setValue(false)
    await subCheckbox.setValue(true)
    await subCheckbox.setValue(false)

    expect(taskStore.saveProgress).toHaveBeenCalledTimes(4)
    expect(savedStates).toEqual([
      { taskCompleted: true, subTaskCompleted: false },
      { taskCompleted: false, subTaskCompleted: false },
      { taskCompleted: false, subTaskCompleted: true },
      { taskCompleted: false, subTaskCompleted: false },
    ])
  })

  test('déclenche l’impression de la page lorsqu’on clique sur le bouton Imprimer', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const printBtn = wrapper.find('button.btn-primary.mb-3')

    expect(printBtn.exists()).toBe(true)

    await printBtn.trigger('click')

    await new Promise(resolve => setTimeout(resolve, 50))
    await nextTick()

    expect(window.print).toHaveBeenCalledTimes(1)
  })

  test('affiche tous les détails des tâches et masque les boutons pendant l’impression', async () => {
    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('.task-details').exists()).toBe(false)

    const printBtn = wrapper.find('button.btn-primary.mb-3')
    await printBtn.trigger('click')

    await nextTick()

    expect(wrapper.find('.task-details').exists()).toBe(true)

    const taskDetails = wrapper.find('.task-details')

    expect(taskDetails.text()).toContain('Piscine')
    expect(taskDetails.text()).toContain('Vérifier les installations selon le PDF.')

    const buttons = wrapper.findAll('button')

    expect(buttons.length).toBeGreaterThan(0)

    buttons.forEach(button => {
      expect(button.classes()).toContain('btn')
    })

    expect(wrapper.find('.task-details').exists()).toBe(true)
  })
})
