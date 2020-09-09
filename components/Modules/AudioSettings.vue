<template>
  <div>
    Accuracy
    <v-btn icon color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p
            class="px-4 pt-4 mb-0 pb-0"
          >Determines how lenient or strict the encoder should be with the audio format detection.</p>
          <v-list>
            <v-list-item>
              <v-list-item-icon class="pr-0 mr-1">
                <v-icon>mdi-circle-small</v-icon>
              </v-list-item-icon>low will detect audio if tuner log includes a reference
            </v-list-item>
            <v-list-item>
              <v-list-item-icon class="pr-0 mr-1">
                <v-icon>mdi-circle-small</v-icon>
              </v-list-item-icon>med will detect audio if tuner log includes a reference and the metadata log has a tag
            </v-list-item>
            <v-list-item>
              <v-list-item-icon class="pr-0 mr-1">
                <v-icon>mdi-circle-small</v-icon>
              </v-list-item-icon>high will detect audio if tuner log exclusively lists it
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider
      v-model="selectedFormat"
      :tick-labels="steps"
      :max="2"
      ticks="always"
      tick-size="4"
      step="1"
      color="red darken-3"
    >
      <template v-slot:thumb-label="props">
        <v-icon dark>{{ accIcon(props.value) }}</v-icon>
      </template>
    </v-slider>
  </div>
</template>

<script>
export default {
  methods: {
    accIcon(value) {
      if (value == 0) {
        return "mdi-circle-outline";
      } else if (value == 1) {
        return "mdi-circle-slice-4";
      } else if (value == 2) {
        return "mdi-circle-slice-8";
      }
    },
  },
  mounted() {
    this.settingsInternal = this.settings;
    this.selectedFormat = this.steps.indexOf(this.settingsInternal.Accuracy);
  },
  data: () => ({
    expand: false,
    selectedFormat: 0,
    settingsInternal: {},
    steps: ["low", "med", "high"],
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