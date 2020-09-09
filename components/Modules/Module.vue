<template>
  <v-card color="#181818">
    <v-card-title class="mb-0 pb-0">{{ name }}</v-card-title>
    <div class="px-4 pb-4">
      <v-checkbox label="Enabled" v-model="moduleInternal.Enabled"></v-checkbox>
      <v-text-field
        label="Priority"
        v-model="module.Priority"
        placeholder="Enter Priority"
        hide-details
        outlined
      ></v-text-field>
    </div>
  </v-card>
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
    module: Object,
    name: String,
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