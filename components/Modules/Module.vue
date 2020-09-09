<template>
  <v-card color="#181818" class="pl-1">
    <v-card-title class="mb-0 pb-0">{{ name }}</v-card-title>
    <v-container>
      <v-checkbox label="Enabled" v-model="moduleInternal.Enabled"></v-checkbox>
      <v-text-field
        label="Priority"
        v-model="module.Priority"
        placeholder="Enter Priority"
        hide-details
        outlined
      ></v-text-field>
    </v-container>
    <v-container v-if="module.Settings" class="text-overline pb-0 mb-0">Settings</v-container>
    <v-container>
      <slot></slot>
    </v-container>
    <!--<v-container v-if="name == 'AudioModule'">
      <AudioSettings :settings="module.Settings"></AudioSettings>
    </v-container>-->
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