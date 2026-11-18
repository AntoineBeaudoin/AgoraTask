<template>
  <div v-if="links && links.length > 0" class="task-external-links-section mb-3">
    <h3 class="fs-5 mb-2 text-primary">Liens externes</h3>
    <ul class="list-group">
      <li v-for="(link, index) in links" :key="link.id || `${link.url}-${index}`"
        class="list-group-item d-flex justify-content-between align-items-center">
        <a :href="getLinkUrl(link)" target="_blank" rel="noopener noreferrer"
          class="external-doc-link text-decoration-none fw-semibold text-break">
          {{ getLinkTitle(link) }}
        </a>
        <span class="badge bg-light text-secondary border ms-2">Nouvel onglet ↗</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  links: {
    type: Array,
    default: () => [],
  },
});

function getLinkUrl(link) {
  if (typeof link === 'string') return link;
  return link?.url || '';
}

function getLinkTitle(link) {
  if (typeof link === 'string') return link;
  return link?.title || link?.url || 'Lien externe';
}
</script>
