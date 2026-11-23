
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import EmployeView from '@/views/EmployeView.vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { useModalStore } from '@/stores/modalStore.js'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/stores/taskStore.js', () => ({
  useTaskStore: vi.fn(),
}))

vi.mock('@/stores/modalStore.js', () => ({
  useModalStore: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

function createAssignedTask() {
  return {
    id: 11,
    tacheAFaireId: 101,
    title: 'Inspection sécurité',
    room: 'Piscine',
    description: 'Vérifier les installations selon le PDF.',
    heureDebut: '08:00',
    heureFin: '09:00',
    isCompleted: false,
    commentaire: '',
    sousTaches: [
      {
        id: 1,
        titre: 'Vérifier filtres',
        isCompleted: false,
        commentaire: '',
      },
    ],
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
}

function mockSubmissionValidation(store) {
  store.validateSubmission.mockImplementation(() => {
    for (const task of store.myTasks) {
      if (!task.isCompleted && !task.commentaire?.trim()) {
        return {
          valid: false,
          message: 'Chaque tâche non terminée doit avoir un commentaire.',
        }
      }

      for (const sub of task.sousTaches ?? []) {
        if (!sub.isCompleted && !sub.commentaire?.trim()) {
          return {
            valid: false,
            message: 'Chaque sous-tâche non terminée doit avoir un commentaire.',
          }
        }
      }
    }

    return { valid: true, message: '' }
  })
}

describe('EmployeView.vue', () => {
  let taskStore
  let modalStore
  let assignedTask
  let wrappers = []

  beforeEach(() => {
    assignedTask = createAssignedTask()

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
      dailyComment: '',
      tasks: [assignedTask],
      myTasks: [assignedTask],
      myTasksLoaded: true,
      isDaySubmitted: false,

      validateSubmission: vi.fn().mockReturnValue({
        valid: true,
        message: '',
      }),

      submitDay: vi.fn().mockResolvedValue({
        success: true,
        message: '',
      }),

      loadTasks: vi.fn().mockResolvedValue(),
      loadMyTasks: vi.fn().mockResolvedValue(),
      loadEmployeeInterface: vi.fn().mockResolvedValue(),

      getTaskById: vi.fn().mockResolvedValue(assignedTask),
      saveProgress: vi.fn().mockResolvedValue(true),
    })

    useTaskStore.mockReturnValue(taskStore)
    useModalStore.mockReturnValue(modalStore)

    useAuthStore.mockReturnValue({
      getEmail: vi.fn(() => 'employe@example.com'),
    })

    window.print = vi.fn()
  })

  function createWrapper() {
    const wrapper = mount(EmployeView, {
      attachTo: document.body,
    })

    wrappers.push(wrapper)
    return wrapper
  }

  async function waitForPrint() {
    await vi.waitFor(() => {
      expect(window.print).toHaveBeenCalled()
    }, { timeout: 1500 })
  }

  afterEach(() => {
    wrappers.forEach(wrapper => wrapper.unmount())
    wrappers = []

    document.body.innerHTML = ''

    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('affiche les tâches assignées et les informations de l’employé', async () => {
    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.text()).toContain('employe@example.com')
    expect(wrapper.text()).toContain('Inspection sécurité')
    expect(wrapper.text()).toContain('08:00')
    expect(wrapper.text()).toContain('09:00')
    expect(wrapper.text()).toContain('Piscine')

    expect(taskStore.loadTasks).toHaveBeenCalled()
    expect(taskStore.loadEmployeeInterface).toHaveBeenCalled()
  })

  test('affiche un message lorsqu’aucune tâche n’est assignée', async () => {
    taskStore.myTasks = []

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.text()).toContain(
      'Aucune tâche ne vous est assignée.'
    )

    expect(wrapper.find('form').exists()).toBe(false)
  })


  test('ouvre TaskDescriptionModal avec les informations de la tâche', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const detailsBtn = wrapper.find('.task-details-btn')

    expect(detailsBtn.exists()).toBe(true)

    await detailsBtn.trigger('click')
    await Promise.resolve()
    await nextTick()

    expect(taskStore.getTaskById).toHaveBeenCalledWith(11)

    expect(modalStore.openTaskDescription).toHaveBeenCalledTimes(1)

    expect(modalStore.observableTask.title).toBe(
      'Inspection sécurité'
    )

    expect(modalStore.observableTask.documents).toEqual(
      assignedTask.documents
    )

    expect(modalStore.observableTask.externalLinks).toEqual(
      assignedTask.externalLinks
    )
  })


  test('permet d’ouvrir et de fermer le commentaire d’une tâche', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const commentBtn = wrapper.find('button.btn-link')

    expect(commentBtn.text()).toContain('Commenter')
    expect(wrapper.find('#comment-101').exists()).toBe(false)

    await commentBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('#comment-101').exists()).toBe(true)
    expect(commentBtn.text()).toContain('Masquer')

    await commentBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('#comment-101').exists()).toBe(false)
  })

  test('permet d’ouvrir et de fermer le commentaire d’une sous-tâche', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const getSubCommentButton = () =>
      wrapper.find('.ms-4.mt-2 button')

    expect(wrapper.find('#sub-comment-101-1').exists()).toBe(false)

    await getSubCommentButton().trigger('click')
    await nextTick()

    expect(wrapper.find('#sub-comment-101-1').exists()).toBe(true)

    await getSubCommentButton().trigger('click')
    await nextTick()

    expect(wrapper.find('#sub-comment-101-1').exists()).toBe(false)
  })

  test('ouvre automatiquement les commentaires des sous-tâches qui en possèdent déjà un', async () => {
    assignedTask.sousTaches[0].commentaire = 'Filtre à remplacer'

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#sub-comment-101-1').exists()).toBe(true)
  })


  test('sauvegarde automatiquement les modifications des tâches et sous-tâches', async () => {
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

  test('affiche le bouton d’impression lorsqu’il existe des tâches', async () => {
    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('button.btn-primary.mb-3').exists()).toBe(true)
  })

  test('masque le bouton d’impression lorsqu’il n’existe aucune tâche', async () => {
    taskStore.myTasks = []

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('button.btn-primary.mb-3').exists()).toBe(false)
  })

  test('affiche les détails des tâches pendant la préparation de l’impression', async () => {
    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('.task-details').exists()).toBe(false)

    await wrapper.find('button.btn-primary.mb-3').trigger('click')
    await nextTick()
    await waitForPrint()

    expect(wrapper.find('.task-details').exists()).toBe(true)
  })

  test('ouvre la boîte de dialogue d’impression', async () => {
    const wrapper = createWrapper()
    await nextTick()

    await wrapper.find('button.btn-primary.mb-3').trigger('click')

    await vi.waitFor(() => {
      expect(window.print).toHaveBeenCalledTimes(1)
    }, { timeout: 1500 })
  })

  test('affiche les commentaires des tâches et sous-tâches pendant l’impression', async () => {
    const wrapper = createWrapper()
    await nextTick()

    await wrapper.find('button.btn-primary.mb-3').trigger('click')
    await nextTick()

    expect(wrapper.find('#comment-101').exists()).toBe(true)
    expect(wrapper.find('#sub-comment-101-1').exists()).toBe(true)
  })

  test('restaure l’interface après la fin de l’impression', async () => {
    const wrapper = createWrapper()
    await nextTick()

    await wrapper.find('button.btn-primary.mb-3').trigger('click')
    await nextTick()

    expect(wrapper.find('#comment-101').exists()).toBe(true)

    window.dispatchEvent(new Event('afterprint'))
    await nextTick()

    expect(wrapper.find('#comment-101').exists()).toBe(false)
    expect(wrapper.find('.task-details').exists()).toBe(false)
  })

  test('enregistre le commentaire de fin de journée lors de la soumission', async () => {
    const wrapper = createWrapper()
    await nextTick()

    const commentaire = 'Lorem ipsum dolor sit amet'

    await wrapper.find('#dailyComment').setValue(commentaire)

    expect(taskStore.dailyComment).toBe(commentaire)

    await wrapper.find('#btn-soumettre').trigger('click')
    await nextTick()

    expect(taskStore.submitDay).toHaveBeenCalledTimes(1)
    expect(taskStore.dailyComment).toBe(commentaire)
  })

  test('désactive Soumettre si une tâche non terminée ne possède aucun commentaire', async () => {
    assignedTask.isCompleted = false
    assignedTask.commentaire = ''
    assignedTask.sousTaches[0].isCompleted = true

    mockSubmissionValidation(taskStore)

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#btn-soumettre').element.disabled).toBe(true)
  })

  test('désactive Soumettre si une sous-tâche non terminée ne possède aucun commentaire', async () => {
    assignedTask.isCompleted = true
    assignedTask.sousTaches[0].isCompleted = false
    assignedTask.sousTaches[0].commentaire = ''

    mockSubmissionValidation(taskStore)

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#btn-soumettre').element.disabled).toBe(true)
  })

  test('autorise Soumettre si une tâche non terminée possède un commentaire', async () => {
    assignedTask.isCompleted = false
    assignedTask.commentaire = 'Inspection reportée'
    assignedTask.sousTaches[0].isCompleted = true

    mockSubmissionValidation(taskStore)

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#btn-soumettre').element.disabled).toBe(false)
  })

  test('autorise Soumettre lorsque toutes les tâches et sous-tâches sont terminées', async () => {
    assignedTask.isCompleted = true
    assignedTask.sousTaches[0].isCompleted = true

    mockSubmissionValidation(taskStore)

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#btn-soumettre').element.disabled).toBe(false)
  })

  test('masque le bouton Soumettre lorsque la journée est déjà soumise', async () => {
    taskStore.isDaySubmitted = true

    const wrapper = createWrapper()
    await nextTick()

    expect(wrapper.find('#btn-soumettre').exists()).toBe(false)

    expect(
      wrapper.find('#msg-soumission-reussie').exists()
    ).toBe(true)
  })
})
