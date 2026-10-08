<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <span class="tag">{{ label }}</span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 12.5px;
  line-height: 1.5;
}
</style>
