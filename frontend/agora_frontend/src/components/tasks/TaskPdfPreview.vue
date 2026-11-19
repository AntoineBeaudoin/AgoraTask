<template>
  <div v-if="documents && documents.length > 0" class="task-pdf-preview-section mb-3">
    <h3 class="fs-5 mb-2 text-primary">Documents PDF</h3>
    <div
      v-for="(doc, index) in documents"
      :key="doc.id || `${doc.filename || doc.name}-${index}`"
      class="card mb-3 border shadow-sm pdf-preview-card"
    >
      <div class="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
        <span class="fw-semibold text-truncate">{{ getDocLabel(doc) }}</span>
        <div class="d-flex align-items-center gap-1">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary pdf-zoom-out"
            title="Réduire le zoom"
            @click="adjustZoom(index, -25)"
          >
            -
          </button>
          <span class="badge bg-secondary pdf-zoom-level">{{ getZoom(index) }}%</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary pdf-zoom-in"
            title="Augmenter le zoom"
            @click="adjustZoom(index, 25)"
          >
            +
          </button>
          <a
            :href="getRawUrl(doc)"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-outline-secondary ms-2 pdf-open-tab"
          >
            Ouvrir ↗
          </a>
        </div>
      </div>
      <div class="p-0 overflow-auto">
        <iframe
          class="pdf-preview-frame w-100 border-0 d-block"
          :src="getViewerUrl(doc, index)"
          :title="getDocLabel(doc)"
          :style="{ height: `${getFrameHeight(index)}px` }"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

defineProps({
  documents: {
    type: Array,
    default: () => [],
  },
});

const zoomLevels = reactive({});

function getZoom(index) {
  return zoomLevels[index] ?? 100;
}

function adjustZoom(index, delta) {
  const next = Math.min(200, Math.max(50, getZoom(index) + delta));
  zoomLevels[index] = next;
}

function getFrameHeight(index) {
  return Math.round((400 * getZoom(index)) / 100);
}

function getDocLabel(doc) {
  return doc?.filename || doc?.name || 'Document PDF';
}

function getRawUrl(doc) {
  return doc?.preview || doc?.path || doc?.url || '';
}

function getViewerUrl(doc, index) {
  const baseUrl = getRawUrl(doc);
  if (!baseUrl || baseUrl.startsWith('blob:')) {
    return baseUrl;
  }
  const cleanUrl = baseUrl.split('#')[0];
  return `${cleanUrl}#zoom=${getZoom(index)}`;
}
</script>
