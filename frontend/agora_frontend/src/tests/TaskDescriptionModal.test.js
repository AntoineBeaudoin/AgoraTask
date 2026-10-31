import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import TaskDescriptionModal from '@/components/tasks/TaskDescriptionModal.vue'
import { useModalStore } from '@/stores/modalStore'

// Simulation du magasin modalStore
vi.mock('@/stores/modalStore', () => ({
    useModalStore: vi.fn()
}))

describe('TaskDescriptionModal.vue', () => {
    let modalStore
    let wrappers = []

    const mockTask = {
        title: 'Nettoyer la salle',
        room: 'Salle 101',
        description: 'Nettoyage complet de la salle.',

        images: [
            {
                id: 1,
                name: 'image1.jpg',
                preview: 'preview.jpg',
                path: 'image1.jpg'
            },
            {
                id: 2,
                name: 'image2.jpg',
                preview: null,
                path: 'image2.jpg'
            }
        ],

        occurrences: [
            {
                journee: 'vendredi',
                priorite: 3,
                heureDebut: '09:00',
                heureFin: '10:00',
                isRequired: true
            },
            {
                journee: 'lundi',
                priorite: 1,
                heureDebut: '08:00',
                heureFin: '09:00',
                isRequired: false
            },
            {
                journee: 'mercredi',
                priorite: 2,
                heureDebut: '10:00',
                heureFin: '11:00',
                isRequired: true
            }
        ],

        sous_taches: [
            {
                titre: 'Vider les poubelles',
                description: 'Vider toutes les poubelles.'
            },
            {
                titre: '',
                description: ''
            }
        ]
    }

    beforeEach(() => {
        // Création d'un magasin réactif
        modalStore = reactive({
            taskDescriptionModalOpen: true,
            observableTask: mockTask,
            closeTaskModal: vi.fn()
        })

        useModalStore.mockReturnValue(modalStore)
    })

    // Création du composant
    function createWrapper() {
        const wrapper = mount(TaskDescriptionModal, {
            attachTo: document.body
        })

        wrappers.push(wrapper)

        return wrapper
    }

    // Nettoyage après chaque test
    afterEach(() => {
        wrappers.forEach(wrapper => wrapper.unmount())

        wrappers = []

        document.body.innerHTML = ''
        vi.clearAllMocks()
    })

    test('devrait afficher la fenêtre modale lorsqu’elle est ouverte', async () => {
        createWrapper()
        await nextTick()

        expect(document.body.querySelector('#taskModal')).not.toBeNull()
    })

    test('devrait afficher les informations de la tâche', async () => {
        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        expect(modal.textContent).toContain('Nettoyer la salle')
        expect(modal.textContent).toContain('Salle 101')
        expect(modal.textContent).toContain('Nettoyage complet de la salle.')
    })

    test('devrait afficher les images de la tâche', async () => {
        createWrapper()
        await nextTick()

        const images = document.body.querySelectorAll('#taskModal .imgIconDisplay')

        expect(images).toHaveLength(2)
        expect(images[0].getAttribute('src')).toBe('preview.jpg')
        expect(images[1].getAttribute('src')).toBe('image2.jpg')
        expect(images[0].getAttribute('alt')).toBe('image1.jpg')
    })

    test('devrait afficher les occurrences triées par jour par défaut', async () => {
        createWrapper()
        await nextTick()

        const cartes = document.body.querySelectorAll('#taskModal .row > .card.card-body')

        expect(cartes).toHaveLength(3)

        expect(cartes[0].textContent).toContain('Lundi')
        expect(cartes[1].textContent).toContain('Mercredi')
        expect(cartes[2].textContent).toContain('Vendredi')
    })

    test('devrait trier les occurrences par priorité', async () => {
        createWrapper()
        await nextTick()

        // Les boutons sont téléportés dans document.body
        const boutons = document.body.querySelectorAll('#taskModal .btn-outline-primary')

        expect(boutons).toHaveLength(2)

        boutons[0].click()
        await nextTick()

        const cartes = document.body.querySelectorAll(
            '#taskModal .row > .card.card-body'
        )

        expect(cartes[0].textContent).toContain('Priorité: 1')
        expect(cartes[1].textContent).toContain('Priorité: 2')
        expect(cartes[2].textContent).toContain('Priorité: 3')
    })

    test('devrait trier les occurrences par jour', async () => {
        createWrapper()
        await nextTick()

        const boutons = document.body.querySelectorAll('#taskModal .btn-outline-primary')

        expect(boutons).toHaveLength(2)

        boutons[1].click()
        await nextTick()

        const cartes = document.body.querySelectorAll('#taskModal .row > .card.card-body')

        expect(cartes[0].textContent).toContain('Lundi')
        expect(cartes[1].textContent).toContain('Mercredi')
        expect(cartes[2].textContent).toContain('Vendredi')
    })

    test('devrait afficher les cases à cocher des occurrences obligatoires', async () => {
        createWrapper()
        await nextTick()

        const cases = document.body.querySelectorAll('#taskModal .row > .card.card-body input[type="checkbox"]')

        expect(cases).toHaveLength(3)

        // Les occurrences sont initialement triées par jour
        expect(cases[0].checked).toBe(false)
        expect(cases[1].checked).toBe(true)
        expect(cases[2].checked).toBe(true)

        cases.forEach(c => {
            expect(c.disabled).toBe(true)
        })
    })

    test('devrait afficher les sous-tâches', async () => {
        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        expect(modal.textContent).toContain('Sous-tâches')
        expect(modal.textContent).toContain('Vider les poubelles')
        expect(modal.textContent).toContain('Vider toutes les poubelles.')
        expect(modal.textContent).toContain('Sans titre')
        expect(modal.textContent).toContain('Aucune description')
    })

    test('devrait fermer la fenêtre modale lors du clic sur le bouton de fermeture', async () => {
        createWrapper()
        await nextTick()

        const boutonFermer = document.body.querySelector('#taskModal .btn-close')

        expect(boutonFermer).not.toBeNull()

        boutonFermer.click()

        expect(modalStore.closeTaskModal).toHaveBeenCalledTimes(1)
    })

    test('devrait fermer la fenêtre modale lors du clic sur l’arrière-plan', async () => {
        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        modal.click()

        expect(modalStore.closeTaskModal).toHaveBeenCalledTimes(1)
    })

    test('ne devrait pas fermer la fenêtre modale lors du clic sur son contenu', async () => {
        createWrapper()
        await nextTick()

        const contenu = document.body.querySelector('#taskModal .modal-content')

        contenu.click()

        expect(modalStore.closeTaskModal).not.toHaveBeenCalled()
    })

    test('devrait afficher les messages appropriés lorsqu’il n’y a aucune occurrence, image ou sous-tâche', async () => {
        modalStore.observableTask = {
            ...mockTask,
            occurrences: [],
            sous_taches: [],
            images: []
        }

        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        expect(modal.textContent).toContain('Aucun horaire défini.')

        expect(modal.textContent).toContain('Aucune sous-tâche définie.')

        expect(
            modal.querySelector('.imgIconDisplay')
        ).toBeNull()
    })

    test('devrait afficher les valeurs par défaut lorsque les informations d’une occurrence sont manquantes', async () => {
        modalStore.observableTask = {
            ...mockTask,
            occurrences: [
                {
                    journee: '',
                    priorite: null,
                    heureDebut: '',
                    heureFin: '',
                    isRequired: false
                }
            ]
        }

        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        expect(modal.textContent).toContain('Non définie')
    })

    test('devrait afficher les valeurs par défaut lorsque les informations des sous-tâches sont manquantes', async () => {
        modalStore.observableTask = {
            ...mockTask,
            sous_taches: [
                {
                    titre: '',
                    description: ''
                }
            ]
        }

        createWrapper()
        await nextTick()

        const modal = document.body.querySelector('#taskModal')

        expect(modal.textContent).toContain('Sans titre')
        expect(modal.textContent).toContain(
            'Aucune description'
        )
    })
})
