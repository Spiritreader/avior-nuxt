<template>
  <div>
    Mode
    <v-btn icon class="ma-2" color="primary" @click="expand = !expand">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
    <v-expand-transition>
      <v-card v-show="expand" class="mx-1 mb-2">
        <div>
          <p class="px-4 pt-4 mb-0 pb-0">Log file matching criteria for include and exclude matches</p>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              include mode: allow if both or include matches
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              neutral mode: reject if both or exclude matches
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon class="pr-0 mr-1">mdi-circle-small</v-icon>
              </template>
              exclude mode: reject if exclude matches
            </v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-expand-transition>
    <v-slider v-model="selected" :ticks="stepTicks" :max="2" show-ticks="always" tick-size="4" step="1" color="red-darken-3">
      <template v-slot:thumb-label="props">
        <v-icon>{{ accIcon(props.value) }}</v-icon>
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
    this.selected = this.steps.indexOf(this.settingsInternal.Mode);
  },
  data() {
    return {
      expand: false,
      selected: 0,
      settingsInternal: this.settings,
      steps: ["include", "neutral", "exclude"],
    };
  },
  props: {
    settings: Object,
    name: String,
  },
  watch: {
    selected: {
      handler: function () {
        this.settingsInternal.Mode = this.steps[this.selected];
        this.$emit("newdata", {
          Name: this.name,
          Settings: this.settingsInternal,
        });
      },
    },
  },
  computed: {
    stepTicks() {
      return this.steps.reduce((acc, label, index) => {
        acc[index] = label;
        return acc;
      }, {});
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
</style>
