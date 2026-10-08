<script setup>
import { site } from '../config'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <p class="footer__copy">© {{ year }} {{ site.name }}</p>
      <a class="footer__link" :href="site.github" target="_blank" rel="noopener">GitHub ↗</a>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  padding: var(--space-5) 0;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.footer__copy {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.footer__link {
  font-size: 14px;
}

@media (max-width: 480px) {
  .footer__inner {
    justify-content: center;
  }
}
</style>
