<script setup lang="ts">
import type { HighlightCodeProps } from './interface'
import hljs from 'highlight.js/lib/core'
import typescriptLang from 'highlight.js/lib/languages/typescript'
import { addUnit } from 'nice-fns'
import 'highlight.js/styles/atom-one-dark.css'

defineOptions({
  name: 'HighlightCode',
})

const props = withDefaults(defineProps<HighlightCodeProps>(), {
  language: 'ts',
  always: true,
  minHeight: 100,
})

hljs.registerLanguage('ts', typescriptLang)

const code = hljs.highlight(props.code, { language: props.language }).value
</script>

<template>
  <div
    class="highlight-code hljs"
    :style="{
      height: addUnit(height),
      minHeight: addUnit(minHeight),
      maxHeight: addUnit(maxHeight),
      overflowY: 'auto',
    }"
  >
    <pre><code class="language" :data-language="language" v-html="code" /></pre>
  </div>
</template>

<style scoped>
.highlight-code {
  > pre {
    display: flex;
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 16px;

    > .language {
      white-space: pre-wrap;
    }
  }
}
</style>
