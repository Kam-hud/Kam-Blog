<script setup>
// 正文渲染出口。html 来自构建时收集的本地 Markdown，内容是作者自己写的，非外部输入。
defineProps({
  html: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="prose" v-html="html"></div>
</template>
