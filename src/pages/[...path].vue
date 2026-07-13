<template>
  <div>
    <h1>{{ pageNotFound }}</h1>
    <RouterLink to="/">Home page</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const pageNotFound = ref("404 Not Found");
</script>

<style scoped>
h1 {
  font-size: 20px;
}
</style>
