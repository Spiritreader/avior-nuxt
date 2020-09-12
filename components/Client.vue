<template>
  <v-card
    :loading="client.Encoder && (client.Encoder.Active || client.Mover.Active || client.FileWalker.Active)"
    class="ma-2"
  >
    <!-- Begin Progress Bar -->
    <template style="min-height: 4px;" v-slot:progress>
      <v-progress-linear
        v-if="client.Encoder.OfSlices > 0"
        v-model="client.Encoder.Progress"
        :buffer-value="bufferValue"
        :v-show="!determineIndeterminate()"
        height="8"
        stream
      ></v-progress-linear>
      <v-progress-linear
        v-else
        v-model="client.Encoder.Progress"
        :buffer-value="bufferValue"
        :v-show="!determineIndeterminate()"
        height="8"
        striped
        stream
      ></v-progress-linear>
    </template>
    <!-- End Progress Bar -->
    <!-- Begin Card Main -->
    <v-card-text>
      <!-- Begin Card Header -->
      <div class="display-1 text-h4 d-flex">
        <div class="mr-auto">
          {{client.HostName}}
          <v-icon class="pb-1" v-if="client.Paused">mdi-sleep</v-icon>
          <v-icon class="pb-1" v-else-if="activeProcess.process === 'offline'">mdi-lan-disconnect</v-icon>
          <v-icon class="pb-1" v-else-if="activeProcess.process === 'idle'">mdi-timer-outline</v-icon>
        </div>
        <!-- Begin Card Buttons -->
        <div v-if="isOnline()">
          <v-btn
            v-if="!client.Paused"
            class="mb-2"
            :loading="pauseMachine"
            :disabled="pauseMachine"
            large
            icon
            color="blue"
            @click="sendPauseCommand()"
          >
            <v-icon>mdi-pause-circle-outline</v-icon>
          </v-btn>
          <v-btn
            v-else
            class="mb-2"
            :loading="resumeMachine"
            :disabled="resumeMachine"
            large
            icon
            color="green"
            @click="sendResumeCommand()"
          >
            <v-icon>mdi-play-circle-outline</v-icon>
          </v-btn>
          <!-- Begin Shutdown Dialog -->
          <v-dialog v-if="isOnline()" v-model="shutdownConfirm" max-width="500">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mb-2"
                :loading="shutdownMachine"
                :disabled="shutdownMachine"
                large
                icon
                color="red"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-power</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-title>Shut down service</v-card-title>
              <v-card-text>
                Do you really want to shut down {{ client.HostName }}'s service? This action is irreversible with the web-gui.
                You'll have to restart it physically on the client machine.
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="darken-1" text @click="shutdownConfirm = false">Cancel</v-btn>
                <v-btn
                  color="red darken-1"
                  text
                  @click="shutdownConfirm = false; sendShutdownCommand();"
                >Hit me</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <!-- End Shutdown Dialog -->
        </div>
        <!-- End Card Buttons -->
      </div>
      <!-- End Card Header -->
      <!-- Begin Card Info -->
      <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>
      <p
        class="body-1 ma-0"
        v-bind:class="{ 'status-active': isActive(), 'status-idle': !isActive(), 'status-offline': !isOnline() }"
      >
        Status: {{ activeProcess.text }}
        <span
          v-if="client.Encoder && client.Encoder.Active && client.Encoder.OfSlices !== 0"
        >Estimating</span>
      </p>
      <p v-if="client.InFile" class="body-2">{{ client.InFile }}</p>
      <!-- End Card Info -->
      <!-- Begin Card Content -->
      <v-container
        class="d-flex align-center flex-wrap-reverse flex-sm-nowrap flex-lg-nowrap flex-md-nowrap flex-lg-nowrap flex-xl-nowrap"
      >
        <div class="ma-2 file-info">
          <!-- Begin Dense Card Content -->
          <v-list v-if="activeProcessInfoLength < 5" dense>
            <v-list-item v-for="(value, key) in activeProcessInfo" :key="key">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>{{ key }}</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ value }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
          <!-- End Dense Card Content -->
          <!-- Begin Encoder Card Content -->
          <v-list v-else-if="activeProcess.process === 'encoder' && isActive()" dense>
            <v-list-item v-if="remaining && remaining !== '00:00:00'">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>Remaining</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ remaining }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
            <v-list-item v-if="client.Encoder.Speed >= 0">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>Speed</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ client.Encoder.Speed }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
            <v-list-item v-if="client.Encoder.Slice && client.Encoder.OfSlices !== 0">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>Slice</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ client.Encoder.Slice }}/{{ client.Encoder.OfSlices }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
            <v-list-item v-if="client.Encoder.Fps >= 0">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>FPS</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ client.Encoder.Fps }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
          <!-- End Encoder Card Content -->
        </div>
        <!-- Begin Progress Circle -->
        <div
          v-if="isActive() && activeProcess.process !== 'working'"
          class="justify-end d-flex mx-auto mx-sm-0 ml-sm-auto'"
        >
          <v-progress-circular
            transition="slide-x-transition"
            class="text-h5"
            :rotate="determineIndeterminate() ? 0 : -90"
            :size="175"
            :width="21"
            :value="activeProcessProgress"
            :color="'yellow darken-3'"
            :indeterminate="determineIndeterminate()"
          >
            <span v-if="!determineIndeterminate()">{{ activeProcessProgress }}%</span>
          </v-progress-circular>
        </div>
        <!-- End Progress Circle -->
      </v-container>
      <!-- End Card Content -->
    </v-card-text>
    <!-- End Card Main -->
    <!-- Begin Card Actions -->
    <v-card-actions>
      <v-btn v-if="activeProcessInfoLength >= 5" icon @click="showProcessInfo = !showProcessInfo">
        <v-icon>mdi-format-list-bulleted</v-icon>
      </v-btn>
      <v-btn
        v-if="client.EncoderLineOut && !client.EncoderLineOut.includes('null')"
        icon
        @click="showEncoderLog = !showEncoderLog"
      >
        <v-icon>mdi-console</v-icon>
      </v-btn>
      <v-btn-toggle
        v-if="isOnline()"
        v-model="toggle_exclusive"
        class="ml-auto"
        dense
        borderless
        exclusive
      >
        <v-btn icon @click="getMainLog()">
          <v-icon>mdi-text-box-outline</v-icon>
        </v-btn>
        <v-btn icon @click="getErrorLog()">
          <v-icon>mdi-text-box-remove-outline</v-icon>
        </v-btn>
        <v-btn icon @click="getProcessedLog()">
          <v-icon>mdi-text-box-plus-outline</v-icon>
        </v-btn>
        <v-btn icon @click="getSkippedLog()">
          <v-icon>mdi-text-box-minus-outline</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-card-actions>
    <!-- End Card Actions -->
    <!-- Begin Extended Info -->
    <v-expand-transition v-if="activeProcessInfoLength >= 5">
      <div v-show="showProcessInfo">
        <v-card-text>
          <v-list dense>
            <v-list-item v-for="(value, key) in activeProcessInfo" :key="key">
              <v-row>
                <v-col class="pa-0" md="2" sm="4" xs="6">
                  <v-list-item-content>{{ key }}</v-list-item-content>
                </v-col>
                <v-col class="pa-0" md="10" sm="8" xs="6">
                  <v-list-item-content>{{ value }}</v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
    </v-expand-transition>
    <!-- End Extended Info -->
    <!-- Begin Encoder Log -->
    <v-expand-transition v-if="client.EncoderLineOut && !client.EncoderLineOut.includes('null')">
      <div v-show="showEncoderLog">
        <v-virtual-scroll
          :items="client.EncoderLineOut"
          :item-height="20"
          height="300"
          class="mb-2"
        >
          <template v-slot="{ item }">
            <div>
              <v-list-item class="encoder-line-out my-2">
                <v-list-item-content class="pa-0 pr-2 virtual-scroller-content-wrapper">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </v-expand-transition>
    <!-- Begin Encoder Log -->
    <!-- Begin Main Log -->
    <v-expand-transition>
      <div v-show="showMainLog">
        <v-card-title class="mb-0 pb-0">Main Log</v-card-title>
        <v-virtual-scroll :items="mainLog" :item-height="20" height="300" class="mb-2">
          <template v-slot="{ item }">
            <div>
              <v-list-item class="encoder-line-out my-2">
                <v-list-item-content class="pa-0 pr-2 virtual-scroller-content-wrapper">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </v-expand-transition>
    <!-- End Main Log-->
    <!-- Begin Error Log -->
    <v-expand-transition>
      <div v-show="showErrorLog">
        <v-card-title class="mb-0 pb-0">Error Log</v-card-title>

        <v-virtual-scroll :items="errorLog" :item-height="20" height="300" class="mb-2">
          <template v-slot="{ item }">
            <div>
              <v-list-item class="encoder-line-out my-2">
                <v-list-item-content class="pa-0 pr-2 virtual-scroller-content-wrapper">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </v-expand-transition>
    <!-- End Error Log-->
    <!-- Begin Processed Log -->
    <v-expand-transition>
      <div v-show="showProcessedLog">
        <v-card-title class="mb-0 pb-0">Processed Log</v-card-title>
        <v-virtual-scroll :items="processedLog" :item-height="20" height="300" class="mb-2">
          <template v-slot="{ item }">
            <div>
              <v-list-item class="encoder-line-out my-2">
                <v-list-item-content class="pa-0 pr-2 virtual-scroller-content-wrapper">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </v-expand-transition>
    <!-- End Processed Log-->
    <!-- Begin Skipped Log -->
    <v-expand-transition>
      <div v-show="showSkippedLog">
        <v-card-title class="mb-0 pb-0">Skipped Log</v-card-title>
        <v-virtual-scroll :items="skippedLog" :item-height="20" height="300" class="mb-2">
          <template v-slot="{ item }">
            <div>
              <v-list-item class="encoder-line-out my-2">
                <v-list-item-content class="pa-0 pr-2 virtual-scroller-content-wrapper">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
    </v-expand-transition>
    <!-- End Skipped Log -->
  </v-card>
</template>
<script>
const ENCODER = "encoder",
  FILEWALKER = "filewalker",
  MOVER = "mover",
  PAUSED = "paused",
  IDLE = "idle",
  OFFLINE = "offline",
  WORKING = "working",
  INACTIVE = [OFFLINE, PAUSED, IDLE];
export default {
  data: () => ({
    toggle_exclusive: [],
    showMainLog: false,
    showErrorLog: false,
    showProcessedLog: false,
    showSkippedLog: false,
    mainLog: [],
    errorLog: [],
    processedLog: [],
    skippedLog: [],
    encoderInterpolation: 0,
    interpolationHandle: null,
    showProcessInfo: false,
    showEncoderLog: false,
    remaining: null,
    pauseMachine: false,
    resumeMachine: false,
    shutdownMachine: false,
    shutdownConfirm: false,
    errorMessage: null,
    errorMessageTimeout: null,
    testData: `asdf\nasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdfnasdfkjasdf\nasdf;jkafz\nasd;lfkja\nasfdljk\noij\npijo\nijpo\noij\nlio;h\nuigy\nuygoh\nhuio\nhiuo\nuiho\nhuoi\nohui\nihuo\niuohi\njihiou\njihuio\njiuhoi\njiuioh\njiuiho\njiuhio\njiouh\njiouiho\njiuho\njiuhoi\njhi\nij`,
  }),
  props: {
    client: Object,
  },
  computed: {
    bufferValue: function () {
      if (this.client.Encoder.Active) {
        return 100;
      } else if (this.client.FileWalker.Active) {
        return this.getFileWalkerProgress();
      } else if (this.client.Mover.Active) {
        return this.getMoverProgress();
      }
    },
    activeProcessInfoLength: function () {
      return Object.keys(this.activeProcessInfo).length;
    },
    activeProcessProgress: function () {
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
        case WORKING:
          return 0;
      }
    },
    activeProcess: function () {
      return this.getActiveProcess();
    },
    activeProcessInfo: function () {
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
        case WORKING:
          return {};
      }
    },
    progressColor: function () {
      const perc = this.activeProcessProgress;
      let r = 0,
        g = 0,
        b = 0;
      if (perc < 33) {
        r = 243;
        g = Math.round(33 + 1.3 * perc);
        b = Math.round(33 + 6.36 * perc);
      } else if (perc < 66) {
        r = Math.round(328 - 2.57 * perc);
        g = 72;
        b = 243;
      } else {
        r = Math.round(400 - 3.67 * perc);
        g = Math.round(-79.4 + 2.3 * perc);
        b = 243;
      }
      const h = r * 0x10000 + g * 0x100 + b * 0x1;
      return "#" + ("000000" + h.toString(16)).slice(-6);
    },
  },
  methods: {
    getMainLog: async function () {
      this.showErrorLog = false;
      this.showProcessedLog = false;
      this.showSkippedLog = false;
      if (!this.showMainLog) {
        const log = await this.$http.$get(this.client.Ip + "/logs/main/");
        this.mainLog = log.split("\n");
      }
      this.showMainLog = !this.showMainLog;
    },
    getErrorLog: async function () {
      this.showMainLog = false;
      this.showProcessedLog = false;
      this.showSkippedLog = false;
      if (!this.showErrorLog) {
        const log = await this.$http.$get(this.client.Ip + "/logs/err/");
        this.errorLog = log.split("\n");
      }
      this.showErrorLog = !this.showErrorLog;
    },
    getProcessedLog: async function () {
      this.showMainLog = false;
      this.showErrorLog = false;
      this.showSkippedLog = false;
      if (!this.showProcessedLog) {
        const log = await this.$http.$get(this.client.Ip + "/logs/processed/");
        this.processedLog = log.split("\n");
      }
      this.showProcessedLog = !this.showProcessedLog;
    },
    getSkippedLog: async function () {
      this.showMainLog = false;
      this.showProcessedLog = false;
      this.showProcessedLog = false;
      if (!this.showSkippedLog) {
        const log = await this.$http.$get(this.client.Ip + "/logs/skipped/");
        this.skippedLog = log.split("\n");
      }
      this.showSkippedLog = !this.showSkippedLog;
    },
    determineIndeterminate: function () {
      return (
        (this.client.Encoder.Active && this.client.Encoder.Remaining === 0) ||
        (this.client.FileWalker.Active &&
          this.client.FileWalker.LibSize === 0) ||
        this.client.InFile == ""
      );
    },
    isActive: function () {
      let curProcess = this.getActiveProcess().process;
      return !INACTIVE.includes(curProcess);
    },
    isOnline: function () {
      return this.getActiveProcess().process !== OFFLINE;
    },
    sendResumeCommand: async function () {
      this.resumeMachine = true;
      setTimeout(() => {
        this.resumeMachine = false;
      }, 1000);
      const url = this.client.Ip + "/resume";
      try {
        const response = await fetch(url, {
          method: "PUT",
        });
      } catch (err) {
        this.setErrorMessage(err, "resume");
      }
    },
    timeout(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    sendPauseCommand: async function () {
      this.pauseMachine = true;
      setTimeout(() => {
        this.pauseMachine = false;
      }, 1000);
      const url = this.client.Ip + "/pause";
      try {
        const response = await fetch(url, {
          method: "PUT",
        });
        if (response == "paused") {
          try {
            //todo: BUGGED!!!!! reponse never comes
            const refreshResponse = await this.$http.$get(url);
            if (
              !(
                refreshResponse.Encoder.Active ||
                refreshResponse.FileWalker.Active ||
                refreshResponse.Mover.Active
              )
            ) {
              this.setClientPaused();
            }
          } catch (err) {
            this.setErrorMessage(err, "pause");
            this.pauseMachine = false;
          }
        }
      } catch (err) {
        this.setErrorMessage(err, "pause");
        this.pauseMachine = false;
      }
    },
    sendShutdownCommand: async function () {
      this.shutdownMachine = true;
      const url = this.client.Ip + "/shutdown";
      try {
        const response = await fetch(url, {
          method: "PUT",
        });
      } catch (err) {
        this.setErrorMessage(err, "shut down");
      }
      this.shutdownMachine = false;
    },
    setClientPaused: function () {
      this.client.Paused = true;
      this.client.Encoder.Active = false;
      this.client.FileWalker.Active = false;
      this.client.Mover.Active = false;
    },
    setErrorMessage: function (err, mode) {
      clearTimeout(this.errorMessageTimeout);
      this.errorMessage = `Could not ${mode} ${this.client.HostName}.`;
      this.errorMessageTimeout = setTimeout(
        function () {
          this.errorMessage = null;
        }.bind(this),
        5000
      );
    },
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
      } else if (client.InFile !== "") {
        return { process: WORKING, text: "Working" };
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
      let client = Object.assign({}, this.client.Encoder);
      let duration = new Date(client.Duration.replace("0001", "2000"));
      let position = new Date(client.Position.replace("0001", "2000"));
      let remaining = new Date(client.Remaining / 1000 / 1000);
      client.Duration = this.getDurationFromDate(duration);
      client.Position = this.getDurationFromDate(position);
      client.Remaining = this.getDurationFromDate(remaining);
      this.remaining = client.Remaining;
      client = this.filterObject(client, [
        "Active",
        "Remaining",
        "Speed",
        "Slice",
        "OfSlices",
        "Fps",
        "Progress",
      ]);
      return client;
    },
    getFileWalkerInfo: function () {
      let client = this.filterObject(this.client.FileWalker, [
        "Active",
        "Progress",
      ]);
      this.remaining = null;
      return client;
    },
    getMoverInfo: function () {
      let client = this.filterObject(this.client.Mover, ["Active", "Progress"]);
      this.remaining = null;
      return client;
    },
    getEncoderProgress: function () {
      let encoder = this.client.Encoder;
      let progress = 0;
      if (encoder.OfSlices == 0) {
        progress = encoder.Progress.toFixed(2);
      } else {
        progress = (
          ((encoder.Slice - 1) / encoder.OfSlices +
            encoder.Progress / 100 / encoder.OfSlices) *
          100
        ).toFixed(2);
      }
      return progress;
    },
    getFileWalkerProgress: function () {
      const fw = this.client.FileWalker;
      if (fw.LibSize == 0) {
        return 0;
      }
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
};
</script>

<style lang="scss">
.status-active {
  color: rgb(76, 175, 80);
}

.status-idle {
  color: gainsboro;
}

.status-offline {
  color: rgb(244, 67, 54);
}

.error-message {
  color: rgb(244, 67, 54);
}

.progress,
.file-info {
  width: 100%;
}

.encoder-line-out {
  min-height: 0;
}

.text-no-truncate {
  overflow: auto;
  text-overflow: initial;
}

.virtual-scroller-content {
  text-overflow: initial;
  flex: none;
  overflow: auto;
}

.virtual-scroller-content-wrapper {
  flex: none;
  overflow: auto;
}
</style>