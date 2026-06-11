import { ref } from 'vue'

const current = ref(null)
let pushed = false

// A history entry per open detail view, so the phone's back gesture closes
// the overlay instead of leaving the app.
window.addEventListener('popstate', () => {
  current.value = null
  pushed = false
})

export function useDetail() {
  return {
    current,
    open: (match) => {
      current.value = match
      history.pushState({ detail: true }, '')
      pushed = true
    },
    close: () => {
      if (pushed) history.back()
      else current.value = null
    },
  }
}
