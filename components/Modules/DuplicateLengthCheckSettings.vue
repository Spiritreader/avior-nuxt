<template>
  <div>
    Length Difference %
    <v-btn icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div class="px-4 pt-4 mb-0 pb-1">
          <p
            
          >This setting configures how much the duplicate file and the replacement file are allowed to differ in length</p>
          <p class="pb-0 mb-1">Setting the threshold to a value greater than 0 allows the new file to be {{settingsInternal.threshold}}% shorter </p>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider
      color="red darken-3"
      v-model="threshold"
      class="align-center"
      :max="max"
      :min="min"
      hide-details
    >
      <template v-slot:append>
        <v-text-field
          v-model="threshold"
          class="mt-0 pt-0"
          hide-details
          single-line
          type="number"
          style="width: 60px"
        ></v-text-field>
      </template>
      <template v-slot:thumb-label>
        <v-icon dark>mdi-percent</v-icon>
      </template>
    </v-slider>
  </div>
</template>

<script>
export default {
  methods: {},
  data() {
    return {
      min: 0,
      max: 20,
      expand: false,
      threshold: this.settings.Threshold,
      settingsInternal: this.settings,
    };
  },
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    threshold: {
      handler: function () {
        this.settingsInternal.Threshold = this.threshold;
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