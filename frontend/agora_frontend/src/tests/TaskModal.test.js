import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import TaskModal from '@/components/tasks/TaskModal.vue'
import { useModalStore } from '@/stores/modalStore'
import { useTaskStore } from '@/stores/taskStore'
import { useTaskPriorityStore } from '@/stores/taskPriorityStore'

vi.mock('@/stores/modalStore', () => ({
  useModalStore: vi.fn(),
}))

vi.mock('@/stores/taskStore', () => ({
  useTaskStore: vi.fn(),
}))

vi.mock('@/stores/taskPriorityStore', () => ({
  useTaskPriorityStore: vi.fn(),
}))

vi.mock('@/utils/dom-manipulation', () => ({
  switchIsButtonActiveById: vi.fn(),
}))

describe('TaskModal.vue', () => {
  let modalStore
  let taskStore
  let taskPriorityStore
  let wrappers = []

  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url')
    globalThis.URL.revokeObjectURL = vi.fn()
    globalThis.alert = vi.fn()

    modalStore = reactive({
      taskModalOpen: true,
      editingTask: null,
      closeTaskModal: vi.fn(),
    })

    taskStore = reactive({
      tasks: [{ id: 1, title: 'Tâche existante', room: 'Salle 101' }],
      addTask: vi.fn().mockResolvedValue(true),
      updateTask: vi.fn().mockResolvedValue(true),
    })

    taskPriorityStore = reactive({
      taskPriorities: [
        { id: 1, task_priority: 'Important', weigth: 1 },
        { id: 2, task_priority: 'Normale', weigth: 2 },
        { id: 3, task_priority: 'Libre', weigth: 3 },
      ],
      loadTaskPriorities: vi.fn().mockResolvedValue(),
    })

    useModalStore.mockReturnValue(modalStore)
    useTaskStore.mockReturnValue(taskStore)
    useTaskPriorityStore.mockReturnValue(taskPriorityStore)
  })

  function createWrapper() {
    const wrapper = mount(TaskModal, { attachTo: document.body })
    wrappers.push(wrapper)
    return wrapper
  }

  afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  test('masque automatiquement la section des occurrences lorsque la priorité globale au poids le plus faible est sélectionnée', async () => {
    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    expect(modal.querySelector('#occurrencesSection')).not.toBeNull()

    const prioritySelect = modal.querySelector('#taskPriority')
    prioritySelect.value = '3'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    expect(modal.querySelector('#occurrencesSection')).toBeNull()

    prioritySelect.value = '2'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    expect(modal.querySelector('#occurrencesSection')).not.toBeNull()
  })

  test('utilise la priorité globale comme valeur par défaut des occurrences lorsqu’elle n’est pas la plus faible', async () => {
    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    const globalPrioritySelect = modal.querySelector('#taskPriority')

    // Sélectionne 'Normale' (id: 2) comme priorité globale
    globalPrioritySelect.value = '2'
    globalPrioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    // Ajoute une occurrence -> sa valeur par défaut doit être la priorité globale (2)
    modal.querySelector('#addOccurrenceBtn').click()
    await nextTick()

    const occPrioritySelect = modal.querySelector('.occurrence-priority-select')
    expect(occPrioritySelect).not.toBeNull()
    expect(Number(occPrioritySelect.value)).toBe(2)

    // Change la priorité globale vers 'Important' (id: 1) -> met à jour l'occurrence qui utilisait la valeur par défaut
    globalPrioritySelect.value = '1'
    globalPrioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    expect(Number(occPrioritySelect.value)).toBe(1)
  })

  test('identifie dynamiquement la priorité la plus faible selon le poids sans coder en dur le nom libre', async () => {
    taskPriorityStore.taskPriorities = [
      { id: 10, task_priority: 'Libre', weigth: 1 },
      { id: 20, task_priority: ' Différée ', weigth: 99 },
    ]

    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    const prioritySelect = modal.querySelector('#taskPriority')

    // 'Libre' a maintenant un poids de 1 (plus haute priorité) -> section visible
    prioritySelect.value = '10'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()
    expect(modal.querySelector('#occurrencesSection')).not.toBeNull()

    // 'Différée' a le poids 99 (priorité la plus faible) -> section masquée
    prioritySelect.value = '20'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()
    expect(modal.querySelector('#occurrencesSection')).toBeNull()
  })

  test('nettoie les occurrences saisies lors du passage à la priorité la plus faible et soumet sans occurrences', async () => {
    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    const titleInput = modal.querySelector('#title')
    const roomInput = modal.querySelector('#room')
    titleInput.value = 'Tâche flexible'
    titleInput.dispatchEvent(new Event('input'))
    roomInput.value = 'Local 102'
    roomInput.dispatchEvent(new Event('input'))

    // Ajoute une occurrence sous la priorité Important
    modal.querySelector('#addOccurrenceBtn').click()
    await nextTick()
    expect(modal.querySelectorAll('.occurrence-card')).toHaveLength(1)

    // Bascule vers Libre (poids le plus faible)
    const prioritySelect = modal.querySelector('#taskPriority')
    prioritySelect.value = '3'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    expect(modal.querySelector('#occurrencesSection')).toBeNull()

    // Revient vers Normale -> l'ancienne occurrence a été nettoyée
    prioritySelect.value = '2'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()
    expect(modal.querySelectorAll('.occurrence-card')).toHaveLength(0)

    // Rebascule vers Libre et soumet le formulaire
    prioritySelect.value = '3'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    modal.querySelector('form').dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskStore.addTask).toHaveBeenCalledTimes(1)
    expect(taskStore.addTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Tâche flexible',
        room: 'Local 102',
        taskPriorityId: 3,
        occurrences: [],
      })
    )
  })

  test('permet d’ajouter des aperçus PDF (fichier et URL) et des liens externes lors de la création ou modification', async () => {
    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')

    const titleInput = modal.querySelector('#title')
    const roomInput = modal.querySelector('#room')
    titleInput.value = 'Tâche documentée'
    titleInput.dispatchEvent(new Event('input'))
    roomInput.value = 'Salle 204'
    roomInput.dispatchEvent(new Event('input'))

    // Sélectionne Libre pour ne pas exiger d'occurrence
    const prioritySelect = modal.querySelector('#taskPriority')
    prioritySelect.value = '3'
    prioritySelect.dispatchEvent(new Event('change'))
    await nextTick()

    // Ajoute un fichier PDF
    const pdfInput = modal.querySelector('#pdfInput')
    const pdfFile = new File(['%PDF-1.4'], 'guide.pdf', { type: 'application/pdf' })
    Object.defineProperty(pdfInput, 'files', { value: [pdfFile], configurable: true })
    pdfInput.dispatchEvent(new Event('change'))
    await nextTick()

    // Ajoute un PDF intégré par URL
    const embeddedUrlInput = modal.querySelector('#embeddedPdfUrlInput')
    embeddedUrlInput.value = 'https://example.com/proc.pdf'
    embeddedUrlInput.dispatchEvent(new Event('input'))
    modal.querySelector('#addEmbeddedPdfBtn').click()
    await nextTick()

    expect(modal.querySelectorAll('.pdf-item')).toHaveLength(2)
    expect(modal.querySelectorAll('.pdf-preview-frame')).toHaveLength(2)

    // Ajoute deux liens externes
    const addLinkBtn = modal.querySelector('#addExternalLinkBtn')
    addLinkBtn.click()
    addLinkBtn.click()
    await nextTick()

    const linkCards = modal.querySelectorAll('.external-link-card')
    expect(linkCards).toHaveLength(2)

    const title1 = linkCards[0].querySelector('.external-link-title')
    const url1 = linkCards[0].querySelector('.external-link-url')
    title1.value = 'Référence A'
    title1.dispatchEvent(new Event('input'))
    url1.value = 'https://example.com/ref-a'
    url1.dispatchEvent(new Event('input'))

    const url2 = linkCards[1].querySelector('.external-link-url')
    url2.value = 'https://example.com/ref-b'
    url2.dispatchEvent(new Event('input'))
    await nextTick()

    modal.querySelector('form').dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskStore.addTask).toHaveBeenCalledTimes(1)
    const submittedPayload = taskStore.addTask.mock.calls[0][0]
    expect(submittedPayload.documents).toHaveLength(2)
    expect(submittedPayload.externalLinks).toEqual([
      { title: 'Référence A', url: 'https://example.com/ref-a' },
      { title: 'https://example.com/ref-b', url: 'https://example.com/ref-b' },
    ])
  })

  test('valide le formulaire (occurrences requises pour priorité normale et URL externe valide)', async () => {
    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    const titleInput = modal.querySelector('#title')
    const roomInput = modal.querySelector('#room')
    titleInput.value = 'Tâche validation'
    titleInput.dispatchEvent(new Event('input'))
    roomInput.value = 'Local 101'
    roomInput.dispatchEvent(new Event('input'))

    // Priorité Important (poids 1) sans occurrence -> invalide
    modal.querySelector('form').dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskStore.addTask).not.toHaveBeenCalled()
    expect(modal.querySelector('#occurrencesError')).not.toBeNull()

    // Ajoute une occurrence mais avec un lien externe invalide
    modal.querySelector('#addOccurrenceBtn').click()
    modal.querySelector('#addExternalLinkBtn').click()
    await nextTick()

    const badUrlInput = modal.querySelector('.external-link-url')
    badUrlInput.value = 'url-invalide'
    badUrlInput.dispatchEvent(new Event('input'))
    await nextTick()

    modal.querySelector('form').dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskStore.addTask).not.toHaveBeenCalled()
    expect(badUrlInput.classList.contains('is-invalid')).toBe(true)
  })

  test('charge et modifie correctement une tâche existante avec ses documents et liens', async () => {
    modalStore.editingTask = {
      id: 42,
      title: 'Tâche existante',
      room: 'Local 404',
      description: 'Desc',
      taskPriorityId: 1,
      occurrences: [
        { id: 5, journee: 'lundi', heureDebut: '08:00', heureFin: '09:00', taskPriorityId: 1 },
      ],
      sous_taches: [],
      images: [],
      documents: [{ id: 9, filename: 'existant.pdf', path: 'https://example.com/existant.pdf' }],
      externalLinks: [{ id: 7, title: 'Doc existant', url: 'https://example.com/doc' }],
    }

    createWrapper()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const modal = document.body.querySelector('#taskModal')
    expect(modal.querySelectorAll('.pdf-item')).toHaveLength(1)
    expect(modal.querySelectorAll('.external-link-card')).toHaveLength(1)

    // Supprime le document PDF existant
    modal.querySelector('.remove-pdf-btn').click()
    await nextTick()
    expect(modal.querySelectorAll('.pdf-item')).toHaveLength(0)

    modal.querySelector('form').dispatchEvent(new Event('submit'))
    await nextTick()

    expect(taskStore.updateTask).toHaveBeenCalledTimes(1)
    expect(taskStore.updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        documents: [],
        externalLinks: [{ title: 'Doc existant', url: 'https://example.com/doc' }],
      })
    )
  })
})
