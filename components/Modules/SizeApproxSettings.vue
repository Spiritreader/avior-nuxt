<template>
  <div>
    <div>
      File Size Difference %
      <v-btn icon color="primary" @click="expand = !expand">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
      <v-expand-transition>
        <v-card v-show="expand" class="mx-1 mb-2">
          <div>
            <p
              class="px-4 pt-4 mb-0 pb-4"
            >If the estimated file size is {{settingsInternal.Difference}}% smaller than the duplicate, a file is eligible for replacement</p>
          </div>
        </v-card>
      </v-expand-transition>
      <v-slider
        color="red darken-3"
        v-model="settingsInternal.Difference"
        class="align-center"
        :max="max"
        :min="min"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            v-model="settingsInternal.Difference"
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
    <div>
      Fraction %
      <v-btn icon color="primary" @click="expand2 = !expand2">
        <v-icon>mdi-help-circle-outline</v-icon>
      </v-btn>
      <v-expand-transition>
        <v-card v-show="expand2" class="mx-1 mb-2">
          <div>
            <p class="px-4 pt-4 mb-0 pb-4">
              How much of the new file should be encoded for the estimation.
              More is better, but takes more
              <v-icon>mdi-clock-time-four-outline</v-icon>to process
            </p>
          </div>
        </v-card>
      </v-expand-transition>
      <v-slider
        color="red darken-3"
        v-model="settingsInternal.Fraction"
        class="align-center"
        :max="max"
        :min="min"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            v-model="settingsInternal.Fraction"
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
    <div>
      <div class="mt-4 d-flex">
        <v-text-field
          label="Sample Count"
          type="number"
          min="0"
          v-model.number="settingsInternal.SampleCount"
          placeholder="Days"
          hide-details
          outlined
        ></v-text-field>
        <v-btn
          icon
          class="mt-3 mb-2"
          style="width: 60px"
          color="primary"
          @click="expand3 = !expand3"
        >
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-btn>
      </div>
      <v-expand-transition>
        <v-card v-show="expand3" class="mx-1 mt-4 mb-2">
          <div>
            <p class="px-4 pt-4 pb-3">
              This sets the amount of slices that are encoded. More slices generally mean a more uniform representation of the estimated bitrate,
              but if the configured fraction is too small, approximation may become inaccurate.
            </p>
          </div>
        </v-card>
      </v-expand-transition>
    </div>
  </div>
</template>

<script>
export default {
  methods: {},
  mounted() {},
  data() {
    return {
      min: 0,
      max: 100,
      expand: false,
      expand2: false,
      expand3: false,
      settingsInternal: this.settings,
    };
  },
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    settingsInternal: {
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