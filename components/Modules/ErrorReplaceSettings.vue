<template>
  <div>
    <div class="d-flex">
      <v-text-field
        label="Threshold"
        type="number"
        min="0"
        v-model.number="settingsInternal.Threshold"
        placeholder="Errors"
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
          <p class="px-4 pt-4">
            The minimum amount of errors the duplicate file is allowed to have before errors are matched with the new file.
          </p>
          <p class="px-4 pb-3">
            Once the threshold is crossed, if the new file has less errors, it will be considered eligible for replacement.
          </p>
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