<template>
  <section class="summary-strip" aria-label="Résumé des assignations">
    <div class="summary-item"><span>Employés assignés</span><strong>{{ nombreEmployes }}</strong></div>
    <div class="summary-item"><span>Tâches de la journée</span><strong>{{ nombreTaches }}</strong></div>
    <div class="summary-item"><span>Tâches terminées</span><strong>{{ nombreTerminees }} <small>/ {{ nombreTaches }}</small></strong></div>
    <div class="summary-item summary-date"><span>Journée consultée</span><strong>{{ dateLongue }}</strong></div>
  </section>
</template>

<script setup>
defineProps({
  nombreEmployes: { type: Number, required: true },
  nombreTaches: { type: Number, required: true },
  nombreTerminees: { type: Number, required: true },
  dateLongue: { type: String, required: true },
})
</script>

<style scoped>
.summary-strip { background: white; border: 1px solid #e0e3e6; border-radius: 12px; padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 22px; }
.summary-item { display: flex; flex-direction: column; gap: 3px; min-width: 120px; }
.summary-item span { color: #77808c; font-size: .78rem; }
.summary-item strong { font-size: 1.45rem; }
.summary-item small { color: #77808c; font-size: .9rem; }
.summary-date { margin-left: auto; }
.summary-date strong { font-size: 1.1rem; }
@media (max-width: 580px) { .summary-date { margin-left: 0; } }
</style>
