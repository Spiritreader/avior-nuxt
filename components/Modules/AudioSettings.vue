<template>
  <div>Setting</div>
</template>

<script>
export default {
  methods: {},
  mounted() {
    this.moduleInternal = this.module;
  },
  data: () => ({
    moduleInternal: {},
  }),
  props: {
    accuracy: String
  },
};
</script>

<style lang="scss">
.priority-tb {
  max-width: 120px;
}
.maxout {
  width: 100%;
}
</style>>