<template>
  <v-card class="ma-2" width="500">
    <v-card-text>
      <p class="display-1 text-h4">{{client.Name}}</p>
      <v-container>
        <v-row align="center">
          <v-col class="d-flex" justify="left">
            <div
              v-bind:class="{ 'active': isActive(), 'idle': !isActive() }"
            >Status: {{ activeProcess }}</div>
          </v-col>
          <v-col>
            <v-progress-circular
              :rotate="-90"
              :size="100"
              :width="15"
              :value="totalProgress"
              :color="totalProgress == 100 ? '#32cd32' : totalProgress == 0 ? '#DCDCDC' : '#87CEEB'"
            >{{ totalProgress }}</v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-btn icon @click="show = !show">
        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>

        <v-card-text>
          <v-list subheader two-line>
            <v-list-item v-for="(value, key) in clientsCleaned" :key="key">
              <v-list-item-content>
                <v-list-item-title>{{ key }}</v-list-item-title>
                <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
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
  mounted() {
    this.prepareClientFields();
  },
  computed: {
    totalProgress: function () {
      const encoder = this.client.Encoder;
      if (encoder.OfSlices == 0) {
        return encoder.Progress;
      }
      return Math.round(
        ((encoder.Slice - 1) / encoder.OfSlices +
          encoder.Progress / 100 / encoder.OfSlices) *
          100
      );
    },
    activeProcess: function () {
      const client = this.client;
      if (client.Encoder.Active) {
        return "Encoder";
      } else if (client.FileWalker.Active) {
        return "File Walker";
      } else if (client.Mover.Active) {
        return "Mover";
      } else if (client.Paused) {
        return "Paused";
      } else {
        return "Idle";
      }
    },
  },
  data() {
    return {
      show: false,
      clientsCleaned: {},
    };
  },
  methods: {
    isActive: function () {
      const client = this.client;
      let curProcess;
      if (client.Encoder.Active) {
        curProcess = "Encoder";
      } else if (client.FileWalker.Active) {
        curProcess = "File Walker";
      } else if (client.Mover.Active) {
        curProcess = "Mover";
      } else if (client.Paused) {
        curProcess = "Paused";
      } else {
        curProcess = "Idle";
      }
      return curProcess !== "Idle" && curProcess !== "Paused";
    },
    prepareClientFields: function () {
      const filter = ["Active"];
      this.clientsCleaned = Object.keys(this.client.Encoder)
        .filter((key) => !filter.includes(key))
        .reduce((obj, key) => {
          obj[key] = this.client.Encoder[key];
          return obj;
        }, {});
      this.clientsCleaned.Duration = 
    },
  },
  props: {
    client: Object,
  },
};
</script>

<style lang="scss">
.active {
  color: limegreen;
}

.idle {
  color: gainsboro;
}
</style>