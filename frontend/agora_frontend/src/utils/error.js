import router from '../router'
import useErrorStore from '../stores/Error.js'

export function launchError(errorCode, errorMessage) {
  const errorStore = useErrorStore()

  errorStore.setError(errorCode, errorMessage)

  router.push({
    name: 'error',
  })
}
