import { reactive } from 'vue'

function loadMatches() {
  try {
    return new Set(JSON.parse(localStorage.getItem('wc2026.revealed') || '[]'))
  } catch {
    return new Set()
  }
}

// group -> match keys whose results were included when the group was
// revealed. New results re-lock the gate (see CONTEXT.md).
function loadGroups() {
  try {
    const v = JSON.parse(localStorage.getItem('wc2026.revealedGroups') || '{}')
    // Pre-re-lock format was an array of group names; treat those as
    // covering nothing so any existing results re-lock (spoiler-safe).
    if (Array.isArray(v)) return Object.fromEntries(v.map((g) => [g, []]))
    return v
  } catch {
    return {}
  }
}

// Match reveals are per-match and permanent, independent of the per-group
// standings gates.
const state = reactive({
  matches: loadMatches(),
  groups: loadGroups(),
})

function persist() {
  localStorage.setItem('wc2026.revealed', JSON.stringify([...state.matches]))
  localStorage.setItem('wc2026.revealedGroups', JSON.stringify(state.groups))
}

export function useReveals() {
  return {
    isRevealed: (key) => state.matches.has(key),
    reveal: (key) => {
      state.matches.add(key)
      persist()
    },
    // null = never revealed; otherwise the match keys covered by the reveal
    groupRevealedKeys: (group) => state.groups[group] ?? null,
    revealGroup: (group, keys) => {
      state.groups[group] = keys
      persist()
    },
  }
}
