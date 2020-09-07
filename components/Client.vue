<template>
  <v-card class="ma-2" width="800">
    <v-card-text>
      <p class="display-1 text-h4">
        {{client.HostName}}
        <v-icon class="pb-1" v-if="activeProcess.text == 'Paused'">mdi-sleep</v-icon>
        <v-icon class="pb-1" v-else-if="activeProcess.text == 'Offline'">mdi-flash-circle</v-icon>
        <v-icon class="pb-1" v-else-if="activeProcess.text == 'Idle'">mdi-timer-outline</v-icon>
      </p>
      <v-container>
        <v-row align="center">
          <v-col class="d-flex flex-column" justify="end">
            <p
              class="body-1"
              v-bind:class="{ 'active': isActive(), 'idle': !isActive() }"
            >Status: {{ activeProcess.text }}</p>
            <p class="body-1" v-if="remaining">Remaining: {{ remaining }}</p>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-progress-circular
              class="text-h5"
              :rotate="-90"
              :size="150"
              :width="20"
              :value="getActiveProcessProgress"
              :color="getActiveProcessProgress == 100 ? '#32cd32' : getActiveProcessProgress == 0 ? '#DCDCDC' : 'red darken-3'"
            >{{ getActiveProcessProgress }}</v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions v-if="Object.keys(getActiveProcessInfo).length !== 0">
      <v-btn icon @click="show = !show">
        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>

        <v-card-text>
          <v-simple-table dense> 
            <template v-slot:default>
              <tbody>
                <tr v-for="(value, key) in getActiveProcessInfo" :key="key">
                  <td>{{ key }}</td>
                  <td class="text-wrap">{{ value }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>
<script>
const ENCODER = "encoder",
  FILEWALKER = "filewalker",
  MOVER = "mover",
  PAUSED = "paused",
  IDLE = "idle",
  OFFLINE = "offline",
  INACTIVE = [OFFLINE, PAUSED, IDLE];
export default {
  mounted() {},
  computed: {
    getActiveProcessProgress: function () {
      const activeProcess = this.getActiveProcess().process;
      switch (activeProcess) {
        case ENCODER:
          return this.getEncoderProgress();
        case FILEWALKER:
          return this.getFileWalkerProgress();
        case MOVER:
          return this.getMoverProgress();
        case PAUSED:
          return 0;
        case OFFLINE:
          return 0;
        case IDLE:
          return 0;
      }
    },
    activeProcess: function () {
      return this.getActiveProcess();
    },
    getActiveProcessInfo: function () {
      const activeProcess = this.getActiveProcess().process;
      switch (activeProcess) {
        case ENCODER:
          return this.getEncoderInfo();
        case FILEWALKER:
          return this.getFileWalkerInfo();
        case MOVER:
          return this.getMoverInfo();
        case PAUSED:
          return {};
        case OFFLINE:
          return {};
        case IDLE:
          return {};
      }
    },
  },
  fetch() {},
  data() {
    return {
      show: false,
      remaining: null,
    };
  },
  methods: {
    isActive: function () {
      let curProcess = this.activeProcess.process;
      return !INACTIVE.includes(curProcess);
    },
    setStatusColor: function () {},
    getActiveProcess: function () {
      const client = this.client;
      if (client.Status) {
        return { process: OFFLINE, text: "Offline" };
      } else if (client.Encoder.Active) {
        return { process: ENCODER, text: "Encoder" };
      } else if (client.FileWalker.Active) {
        return { process: FILEWALKER, text: "Luke File Walker" };
      } else if (client.Mover.Active) {
        return { process: MOVER, text: "Mover" };
      } else if (client.Paused) {
        return { process: PAUSED, text: "Paused" };
      } else {
        return { process: IDLE, text: "Idle" };
      }
    },
    getDurationFromDate: function (date) {
      return `${date
        .getUTCHours()
        .toString()
        .padStart(2, "0")}:${date
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
    },
    getEncoderInfo: function () {
      let client = this.filterObject(this.client.Encoder, ["Active"]);
      let duration = new Date(client.Duration.replace("0001", "2000"));
      let position = new Date(client.Position.replace("0001", "2000"));
      let remaining = new Date(client.Remaining / 1000 / 1000);
      client.Duration = this.getDurationFromDate(duration);
      client.Position = this.getDurationFromDate(position);
      client.Remaining = this.getDurationFromDate(remaining);
      client.Progress = client.Progress.toFixed(2);
      this.remaining = client.Remaining;
      return client;
    },
    getFileWalkerInfo: function () {
      let client = this.filterObject(this.client.FileWalker, ["Active"]);
      this.remaining = null;
      return client;
    },
    getMoverInfo: function () {
      let client = this.filterObject(this.client.Mover, ["Active"]);
      client.Progress = client.Progress.toFixed(2);
      this.remaining = null;
      return client;
    },
    getEncoderProgress: function () {
      const encoder = this.client.Encoder;
      if (encoder.OfSlices == 0) {
        return encoder.Progress.toFixed(2);
      }
      return (
        ((encoder.Slice - 1) / encoder.OfSlices +
          encoder.Progress / 100 / encoder.OfSlices) *
        100
      ).toFixed(2);
    },
    getFileWalkerProgress: function () {
      const fw = this.client.FileWalker;
      return ((fw.Position / fw.LibSize) * 100).toFixed(2);
    },
    getMoverProgress: function () {
      return this.client.Mover.Progress.toFixed(2);
    },
    filterObject: function (originalObj, filter) {
      return Object.keys(originalObj)
        .filter((key) => !filter.includes(key))
        .reduce((obj, key) => {
          obj[key] = originalObj[key];
          return obj;
        }, {});
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

.offline {
  color: red;
}
</style>