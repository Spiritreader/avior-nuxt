<template>
  <v-card class="mx-auto" max-width="344">
    <v-card-text>
      <div>Client</div>
      <p class="display-1 text--primary">{{name}}</p>
      <p
        v-bind:class="{ 'display-1': status != 'Idle' || status != 'Paused', 'text--primary': !!name }"
      >Status: {{status}}</p>
      <div class="text--primary">
        well meaning and kindly.
        <br />"a benevolent smile"
      </div>
      <v-progress-circular
      :rotate="-90"
      :size="100"
      :width="15"
      :value="progress"
      color="primary"
    >
      {{ progress}}
    </v-progress-circular>
    </v-card-text>
    <v-card-actions>
      <v-btn text color="deep-purple accent-4">Edit</v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>

        <v-card-text>
          <v-list subheader three-line>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>FPS</v-list-item-title>
                <v-list-item-subtitle>{{fps}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Remaining</v-list-item-title>
                <v-list-item-subtitle>{{remaining}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Bitrate</v-list-item-title>
                <v-list-item-subtitle>{{bitrate}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Replacement Reason</v-list-item-title>
                <v-list-item-subtitle>{{replacementReason}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Output</v-list-item-title>
                <v-list-item-subtitle>{{outPath}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>
<script>
export default {
  computed: {
    totalProgress() {
      if (ofSlices == 0) {
        return progress;
      }
      return slice / ofSlices * progress;
    }
  },
  props: {
    name: String,
    status: String,
    fps: Number,
    remaining: Number,
    progress: Number,
    bitrate: String,
    replacementReason: String,
    outPath: String,
    slice: Number,
  },
};
</script>