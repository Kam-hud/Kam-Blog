<script setup>
defineProps({
  tags: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="tag-chips">
    <button
      v-for="tag in tags"
      :key="tag"
      type="button"
      class="chip"
      :class="{ 'chip--active': tag === modelValue }"
      :aria-pressed="tag === modelValue"
      @click="$emit('update:modelValue', tag === modelValue ? '' : tag)"
    >
      {{ tag }}
    </button>
  </div>
</template>

<style scoped>
.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  font-family: var(--font-display);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

.chip--active {
  border-color: var(--accent-2);
  background: color-mix(in srgb, var(--accent-2) 14%, var(--surface));
  color: var(--accent-2);
}
</style>
