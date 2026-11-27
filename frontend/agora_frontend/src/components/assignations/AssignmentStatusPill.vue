<template>
  <span class="status-pill" :class="complete ? 'done' : 'pending'">
    {{ complete ? libelleTermine : libelleAttente }}
  </span>
</template>

<script setup>
defineProps({
  complete: { type: Boolean, default: false },
  libelleTermine: { type: String, default: 'Terminé' },
  libelleAttente: { type: String, default: 'À compléter' },
})
</script>

<style scoped>
.status-pill { display: inline-block; white-space: nowrap; border-radius: 22px; padding: 6px 10px; font-size: .73rem; font-weight: 600; }
.status-pill.pending { background: #fff1c7; color: #7f5900; }
.status-pill.done { background: #dff4e7; color: #137746; }
</style>
