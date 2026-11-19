import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import TaskPriorityModal from '@/components/tasks/TaskPriorityModal.vue'
import { useModalStore } from '@/stores/modalStore'
import { useTaskPriorityStore } from '@/stores/taskPriorityStore'

vi.mock('@/stores/modalStore', () => ({
  useModalStore: vi.fn(),
}))

vi.mock('@/stores/taskPriorityStore', () => ({
  useTaskPriorityStore: vi.fn(),
}))

describe('TaskPriorityModal.vue', () => {
  let modalStore
  let taskPriorityStore
  let wrappers = []

  beforeEach(() => {
    modalStore = reactive({
      taskPriorityModalOpen: true,
      editingTaskPriority: null,
      openAddTaskPriority: vi.fn(() => {
        modalStore.editingTaskPriority = null
      }),
      openEditTaskPriority: vi.fn((priority) => {
        modalStore.editingTaskPriority = priority
      }),
      closeTaskPriorityModal: vi.fn(),
    })

    taskPriorityStore = reactive({
      taskPriorities: [
        { id: 1, task_priority: 'Important', weigth: 1 },
        { id: 2, task_priority: 'Normale', weigth: 2 },
      ],
      lastErrorMessage: '',
      loadTaskPriorities: vi.fn().mockResolvedValue(),
      addTaskPriority: vi.fn().mockResolvedValue(true),
      updateTaskPriority: vi.fn().mockResolvedValue(true),
      deleteTaskPriority: vi.fn().mockResolvedValue(true),
    })

    useModalStore.mockReturnValue(modalStore)
    useTaskPriorityStore.mockReturnValue(taskPriorityStore)
  })

  function createWrapper() {
    const wrapper = mount(TaskPriorityModal, {
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    return wrapper
  }

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  test('devrait afficher les priorités existantes et permettre d’en ajouter une', async () => {
    createWrapper()
    await nextTick()

    const modal = document.body.querySelector('#taskPriorityModal')
    expect(modal).not.toBeNull()
    expect(modal.textContent).toContain('Important')
    expect(modal.textContent).toContain('Normale')

    const nameInput = modal.querySelector('#priorityName')
    const weigthInput = modal.querySelector('#priorityWeigth')
    nameInput.value = 'Libre'
    nameInput.dispatchEvent(new Event('input'))
    weigthInput.value = '3'
    weigthInput.dispatchEvent(new Event('input'))
    await nextTick()

    const form = modal.querySelector('form')
    form.dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskPriorityStore.addTaskPriority).toHaveBeenCalledWith({
      task_priority: 'Libre',
      weigth: 3,
    })
  })

  test('devrait afficher un avertissement si la suppression échoue parce que la priorité est utilisée', async () => {
    taskPriorityStore.deleteTaskPriority.mockImplementation(async () => {
      taskPriorityStore.lastErrorMessage =
        'Impossible de supprimer cette priorité car elle est utilisée par au moins une occurrence de tâche.'
      return false
    })

    createWrapper()
    await nextTick()

    const deleteButtons = document.body.querySelectorAll('#taskPriorityModal .btn-sm.btn-danger')
    expect(deleteButtons.length).toBeGreaterThan(0)

    deleteButtons[0].click()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const warningAlert = document.body.querySelector('#priorityWarningAlert')
    expect(warningAlert).not.toBeNull()
    expect(warningAlert.textContent).toContain(
      'Impossible de supprimer cette priorité car elle est utilisée par au moins une occurrence de tâche.'
    )
  })
})
