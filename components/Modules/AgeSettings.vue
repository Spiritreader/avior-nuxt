<template>
  <div>
    <div class="d-flex">
      <v-text-field
        label="Maximum Age"
        type="number"
        min="0"
        v-model.number="settingsInternal.MaxAge"
        placeholder="Days"
        hide-details
        outlined
      ></v-text-field>
      <v-btn icon class="mb-2 ml-2 mt-3" color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2 mt-4">
        <div>
          <p class="px-4 pt-4 pb-3">Maximum duplicate file age in days before it is no longer protected from replacement</p>
        </div>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script>
export default {
  methods: {},
  mounted() {},
  data() {
    return {
      expand: false,
      settingsInternal: this.settings,
    };
  },
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    selectedFormat: {
      handler: function () {
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