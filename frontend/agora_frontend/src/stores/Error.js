import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  const hasError = ref(false)
  const Message = ref('')
  const code = ref('')

  function setError(errorCode, errorMessage) {
    hasError.value = true
    code.value = errorCode
    Message.value = errorMessage
  }

  function clearError() {
    hasError.value = false
    code.value = ''
    Message.value = ''
  }

  return {
    hasError,
    Message,
    code,

    setError,
    clearError,
  }
})

// export default useErrorStore
