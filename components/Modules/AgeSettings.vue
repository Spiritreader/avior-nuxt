<template>
  <div>
    Accuracy
    <v-btn icon class="ma-2" color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p
            class="px-4 pt-4 pb-3"
          >Maximum duplicate file age in days before it is no longer protected from replacement</p>
        </div>
      </v-card>
    </v-expand-transition>
    <v-text-field
      label="Maximum Age"
      v-model="settingsInternal.MaxAge"
      placeholder="Days"
      hide-details
      outlined
    ></v-text-field>
  </div>
</template>

<script>
export default {
  methods: {},
  mounted() {
    this.settingsInternal = this.settings;
  },
  data: () => ({
    expand: false,
    settingsInternal: {},
  }),
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    selectedFormat: {
      handler: function () {
        let value = this.selectedFormat;
        this.settingsInternal.Accuracy = this.steps[value];
        this.$emit("newdata", {
          Name: this.name,
          Settings: this.settingsInternal,
        });
      },
    },
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