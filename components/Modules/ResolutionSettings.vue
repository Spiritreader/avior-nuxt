<template>
  <div>
    Resolution Difference %
    <v-btn icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-0 pb-4">
            This setting configures how large the difference between two files' resolutions in percent is allowed. This goes both
            ways. The new file is eligible if the resolution is {{ minResolution }}% higher, but will be rejected if it's
            {{ minResolution }}% lower.
          </p>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider color="red darken-3" v-model="minResolution" class="align-center" :max="max" :min="min" hide-details>
      <template v-slot:append>
        <v-text-field
          v-model="minResolution"
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
  mounted() {
    this.minResolution = this.settingsInternal.MinResolution;
  },
  data() {
    return {
      min: 0,
      max: 100,
      expand: false,
      minResolution: 0,
      settingsInternal: this.settings,
    };
  },
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    minResolution: {
      handler: function () {
        this.settingsInternal.MinResolution = this.minResolution;
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