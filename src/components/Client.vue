<template>
  <div>
    <v-skeleton-loader v-if="client.Refreshing" type="image" class="ma-2"></v-skeleton-loader>
    <v-card v-else :loading="isLoading" class="ma-2">
      <!-- Begin Progress Bar -->
      <!--
        Vuetify 2's VCard rendered the `progress` slot only while `loading` was
        truthy. Vuetify 4 renamed the slot to `loader` and its LoaderSlot always
        renders the slot content, passing `isActive` instead. Without the v-if
        the bars would show on idle cards, and an offline client (which has no
        Encoder object at all) would throw on `client.Encoder.OfSlices`.
        `isLoading` is the exact expression Vuetify 2 fed to `loading`.
      -->
      <template v-slot:loader>
        <template v-if="isLoading">
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
      </template>
      <!-- End Progress Bar -->
      <!-- Begin Card Main -->
      <v-card-text>
        <!-- Begin Card Header -->
        <div class="text-headline-large d-flex">
          <div class="mr-auto">
            {{ client.HostName }}
            <v-icon class="pb-1" size="24" v-if="isPauseError()">mdi-cancel</v-icon>
            <v-icon class="pb-1" size="24" v-else-if="client.Paused">mdi-sleep</v-icon>
            <v-icon class="pb-1" size="24" v-else-if="client.Sleeping">mdi-alarm-snooze</v-icon>
            <v-icon class="pb-1" size="24" v-else-if="activeProcess.process === 'offline'">mdi-lan-disconnect</v-icon>
            <v-icon class="pb-1" size="24" v-else-if="activeProcess.process === 'idle'">mdi-timer-play-outline</v-icon>
            <v-icon class="pb-1" size="24" v-else-if="isActive">mdi-movie-open-cog-outline</v-icon>
          </div>
          <!-- Begin Card Buttons -->
          <div v-if="isOnline()">
            <v-tooltip location="bottom" v-if="!client.Paused">
              <template v-slot:activator="{ props }">
                <v-btn variant="text"
                  class="mb-2"
                  :loading="pauseMachine"
                  :disabled="pauseMachine"
                  size="44"
                  icon
                  color="blue"
                  v-bind="props"
                  @click="sendPauseCommand()"
                >
                  <v-icon>mdi-pause-circle-outline</v-icon>
                </v-btn>
              </template>
              <span>Pause</span>
            </v-tooltip>

            <v-btn variant="text"
              v-else
              class="mb-2"
              :loading="resumeMachine"
              :disabled="resumeMachine"
              size="44"
              icon
              color="green"
              @click="sendResumeCommand()"
            >
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-play-circle-outline</v-icon>
                </template>
                <span>Resume</span>
              </v-tooltip>
            </v-btn>
            <!-- Begin Shutdown Dialog -->
            <v-dialog v-if="isOnline()" v-model="shutdownConfirm" max-width="500">
              <template v-slot:activator="{ props }">
                <v-btn variant="text" class="mb-2" :loading="shutdownMachine" :disabled="shutdownMachine" size="44" icon color="red" v-bind="props">
                  <v-tooltip location="bottom">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <v-icon v-bind="tooltipProps">mdi-power</v-icon>
                    </template>
                    <span>Shut Down</span>
                  </v-tooltip>
                </v-btn>
              </template>
              <v-card>
                <v-card-title>Shut down service</v-card-title>
                <v-card-text>
                  Do you really want to shut down {{ client.HostName }}'s service? This action is irreversible with the web-gui. You'll have
                  to restart it physically on the client machine.
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="darken-1" variant="text" @click="shutdownConfirm = false">Cancel</v-btn>
                  <v-btn
                    color="red-darken-1"
                    variant="text"
                    @click="
                      shutdownConfirm = false;
                      sendShutdownCommand();
                    "
                    >Hit me</v-btn
                  >
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
          class="text-body-large ma-0"
          v-bind:class="{
            'status-active': isActive(),
            'status-idle': !isActive(),
            'status-offline': !isOnline(),
            'status-pause-error': isPauseError(),
          }"
        >
          Status: {{ activeProcess.text }}
          <span v-if="client.Encoder && client.Encoder.Active && client.Encoder.OfSlices !== 0">Estimating</span>
        </p>
        <p v-if="client.InFile" class="text-body-medium">{{ client.InFile }}</p>
        <p v-if="isPauseError()" class="error-message">{{ pauseErrorText }}</p>
        <!-- End Card Info -->
        <!-- Begin Card Content -->
        <v-container
          class="d-flex align-center flex-wrap-reverse flex-sm-nowrap flex-lg-nowrap flex-md-nowrap flex-lg-nowrap flex-xl-nowrap"
        >
          <div class="ma-2 file-info">
            <!-- Begin Dense Card Content -->
            <!-- If the current process has less than 5 properties to display, display all the properties in the main card without a transition panel -->
            <v-list v-if="activeProcessInfoLength < 5" density="compact">
              <v-list-item v-for="(value, key) in activeProcessInfo" :key="key">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">{{ key }}</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ value }}</v-col>
                </v-row>
              </v-list-item>
            </v-list>
            <!-- End Dense Card Content -->
            <!-- Begin Encoder Card Content -->
            <v-list v-else-if="activeProcess.process === 'encoder' && isActive()" density="compact">
              <v-list-item v-if="remaining && remaining !== '00:00:00'">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">Remaining</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ remaining }}</v-col>
                </v-row>
              </v-list-item>
              <v-list-item v-if="client.Encoder.Speed >= 0">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">Speed</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ client.Encoder.Speed }}</v-col>
                </v-row>
              </v-list-item>
              <v-list-item v-if="client.Encoder.Slice && client.Encoder.OfSlices !== 0">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">Slice</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ client.Encoder.Slice }}/{{ client.Encoder.OfSlices }}</v-col>
                </v-row>
              </v-list-item>
              <v-list-item v-if="client.Encoder.Fps >= 0">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">FPS</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ client.Encoder.Fps }}</v-col>
                </v-row>
              </v-list-item>
            </v-list>
            <!-- End Encoder Card Content -->
          </div>
          <!-- Begin Progress Circle -->
          <div v-if="isActive() && activeProcess.process !== 'working'" class="justify-end d-flex mx-auto mx-sm-0 ml-sm-auto'">
            <!-- No `rotate` prop: Vuetify 2's arc started at 3 o'clock, so the original
                 passed -90 to move it to the top. Vuetify 4 already applies
                 rotate(calc(-90deg + Xdeg)) internally, so its default of 0 starts at
                 the top. Passing -90 again lands the arc at 9 o'clock. -->
            <v-progress-circular
              transition="slide-x-transition"
              class="text-headline-small"
              :size="175"
              :width="21"
              :model-value="activeProcessProgress"
              :color="'yellow-darken-3'"
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
        <v-tooltip location="top" v-if="activeProcessInfoLength >= 5">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" icon v-bind="props" @click="showProcessInfo = !showProcessInfo">
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
          <span>Process Info</span>
        </v-tooltip>

        <v-tooltip location="top" v-if="isOnline()">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" icon v-bind="props" @click="toggleEncoderLog">
              <v-icon>mdi-console</v-icon>
            </v-btn>
          </template>
          <span>Encoder Log</span>
        </v-tooltip>
        <!--
          Vuetify 4's VBtnToggle has no `borderless` or `exclusive` prop:
          single-selection is the default (`multiple` opts out of it) and the
          border is gone from the default styling. `dense` is now
          `density="compact"`.
        -->
        <v-btn-toggle v-if="isOnline()" v-model="toggle_exclusive" class="ml-auto" density="compact">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn variant="text" icon v-bind="props" @click="getMainLog()">
                <v-icon>mdi-text-box-outline</v-icon>
              </v-btn>
            </template>
            <span>Main Log</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn variant="text" icon v-bind="props" @click="getErrorLog()">
                <v-icon>mdi-text-box-remove-outline</v-icon>
              </v-btn>
            </template>
            <span>Error Log</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn variant="text" icon v-bind="props" @click="getProcessedLog()">
                <v-icon>mdi-text-box-plus-outline</v-icon>
              </v-btn>
            </template>
            <span>Processed Log</span>
          </v-tooltip>

          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn variant="text" icon v-bind="props" @click="getSkippedLog()">
                <v-icon>mdi-text-box-minus-outline</v-icon>
              </v-btn>
            </template>
            <span>Skipped Log</span>
          </v-tooltip>
        </v-btn-toggle>
      </v-card-actions>
      <!-- End Card Actions -->
      <!-- Begin Extended Info -->
      <v-expand-transition v-if="activeProcessInfoLength >= 5">
        <div v-show="showProcessInfo">
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-for="(value, key) in activeProcessInfo" :key="key">
                <v-row>
                  <v-col class="pa-0" md="2" sm="4" xs="6">{{ key }}</v-col>
                  <v-col class="pa-0" md="10" sm="8" xs="6">{{ value }}</v-col>
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
          <v-virtual-scroll :items="client.EncoderLineOut" :item-height="20" height="450" class="mb-2">
            <template v-slot="{ item }">
              <div>
                <v-list-item class="encoder-line-out my-2">
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item>
              </div>
            </template>
          </v-virtual-scroll>
        </div>
      </v-expand-transition>
      <v-expand-transition>
        <div v-show="isOnline() && showEncoderLog">
          <v-container
            class="px-0 pb-1 pt-1"
            v-if="!client.EncoderLineOut || (client.EncoderLineOut && client.EncoderLineOut.includes('null'))"
          >
            <v-alert class="mx-4 mt-1" type="info" color="blue-grey-darken-3"> No encoder data available yet </v-alert>
          </v-container>
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
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
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
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
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
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
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
                  <v-list-item-subtitle class="virtual-scroller-content">{{ item }}</v-list-item-subtitle>
                </v-list-item>
              </div>
            </template>
          </v-virtual-scroll>
        </div>
      </v-expand-transition>
      <!-- End Skipped Log -->
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { get } from "@/api/http";
import type { ClientInfo } from "@/types";

const ENCODER = "encoder",
  FILEWALKER = "filewalker",
  MOVER = "mover",
  PAUSED = "paused",
  IDLE = "idle",
  OFFLINE = "offline",
  WORKING = "working",
  SLEEPING = "sleeping",
  INACTIVE = [OFFLINE, PAUSED, IDLE, SLEEPING];

const props = defineProps<{
  clientInit: ClientInfo;
}>();

/**
 * `offlineClient` is emitted with a ClientInfo from onclose but with a bare HostName
 * STRING from onerror. index.vue's handler reads `.HostName` off it either way, so the
 * onerror path hands it a string whose `.HostName` is undefined. Pre-existing; the
 * union type records it rather than papering over it.
 */
const emit = defineEmits<{
  offlineClient: [client: ClientInfo | string];
}>();

const toggle_exclusive = ref<unknown[]>([]);
const showMainLog = ref(false);
const showErrorLog = ref(false);
const showProcessedLog = ref(false);
const showSkippedLog = ref(false);
const mainLog = ref<string[]>([]);
const errorLog = ref<string[]>([]);
const processedLog = ref<string[]>([]);
const skippedLog = ref<string[]>([]);
const showProcessInfo = ref(false);
const showEncoderLog = ref(false);
const remaining = ref<string | null>(null);
const pauseMachine = ref(false);
const resumeMachine = ref(false);
const shutdownMachine = ref(false);
const shutdownConfirm = ref(false);
const errorMessage = ref<string | null>(null);
let errorMessageTimeout: ReturnType<typeof setTimeout> | undefined;

// `created()` assigned clientInit straight across -- the same OBJECT, not a copy.
const client = ref<ClientInfo>(props.clientInit);
let ws: WebSocket | undefined;

watch(
  () => props.clientInit,
  (newVal) => {
    client.value = newVal;
  }
);

// The expression Vuetify 2 received in the card's `loading` prop. Extracted
// so the `loader` slot can be gated on exactly the same condition Vuetify 2
// gated the `progress` slot on.
// NOTE: the `client.Encoder &&` guard is what keeps an OFFLINE client -- which has no
// Encoder/FileWalker/Mover at all -- from throwing here and in everything it gates.
const isLoading = computed(() => {
  return client.value.Encoder && (client.value.Encoder.Active || client.value.Mover.Active || client.value.FileWalker.Active);
});

const pauseErrorText = computed(() => {
  if (client.value.PauseReason && client.value.PauseReason.length > 0) {
    return client.value.PauseReason.split(/(?=[A-Z])/).join(" ");
  } else {
    return "none";
  }
});

const bufferValue = computed(() => {
  if (client.value.Encoder.Active) {
    return 100;
  } else if (client.value.FileWalker.Active) {
    return getFileWalkerProgress();
  } else if (client.value.Mover.Active) {
    return getMoverProgress();
  }
  return undefined;
});

const activeProcessInfo = computed<Record<string, unknown>>(() => {
  const activeProcess = getActiveProcess().process;
  switch (activeProcess) {
    case ENCODER:
      return getEncoderInfo();
    case FILEWALKER:
      return getFileWalkerInfo();
    case MOVER:
      return getMoverInfo();
    case PAUSED:
      return {};
    case OFFLINE:
      return {};
    case IDLE:
      return {};
    case WORKING:
      return {};
    case SLEEPING:
      return {};
  }
  return {};
});

const activeProcessInfoLength = computed(() => Object.keys(activeProcessInfo.value).length);

const activeProcessProgress = computed<number | string | undefined>(() => {
  const activeProcess = getActiveProcess().process;
  switch (activeProcess) {
    case ENCODER:
      return getEncoderProgress();
    case FILEWALKER:
      return getFileWalkerProgress();
    case MOVER:
      return getMoverProgress();
    case PAUSED:
      return 0;
    case OFFLINE:
      return 0;
    case IDLE:
      return 0;
    case WORKING:
      return 0;
  }
  return undefined;
});

const activeProcess = computed(() => getActiveProcess());

/**
 * Color goes from red (0) to light blue (100)
 *
 * Not currently bound to any template element (the progress bars below have
 * no `:color`) — same as in the pre-port source. Not wiring it up here since
 * that would be a behavioural change, not a lint fix.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const progressColor = computed(() => {
  // `perc` is a string from toFixed(2) in the encoder/filewalker/mover branches and a
  // number in the rest. The comparisons and arithmetic below coerce, exactly as before.
  const perc = activeProcessProgress.value as unknown as number;
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
});

async function connectToWebSocket(c: ClientInfo) {
  try {
    ws = new WebSocket(`ws://${c.Ip.replace("http://", "")}/ws/status`);
    ws.onopen = () => {
      console.log(`Connected to ${c.Ip}`);
    };
    ws.onmessage = (info: MessageEvent) => {
      if (!shutdownMachine.value) {
        // if client status has been set to offline the websocket should no longer be open
        if (client.value.Status == "offline") {
          try {
            ws!.close();
          } catch (e) {
            console.log("can't close websocket because it is probably already closed");
            console.log(e);
          }
        }
        // spreads the object to avoid reactivity issues
        // https://vuejs.org/v2/guide/reactivity.html#Change-Detection-Caveats
        // uses spread operator to update client properties with data from info.data
        // without having to assign each property individually
        client.value = { ...client.value, ...JSON.parse(info.data) };
        client.value.HostName = props.clientInit.HostName;
      }
    };
    ws.onclose = () => {
      console.log(`Disconnected from ${c.Ip}`);
      clearClient();
      emit("offlineClient", client.value);
    };
    ws.onerror = (error) => {
      console.log(`Error connecting to ${c.Ip}: ${error}`);
      clearClient();
      emit("offlineClient", client.value.HostName);
    };
  } catch (error) {
    console.log(`Error connecting to ${c.Ip}: ${error}`);
  }
}

async function getMainLog() {
  showErrorLog.value = false;
  showProcessedLog.value = false;
  showSkippedLog.value = false;
  if (!showMainLog.value) {
    const log = await get<string>(client.value.Ip + "/logs/main/");
    mainLog.value = log.split("\n");
  }
  showMainLog.value = !showMainLog.value;
}

async function getErrorLog() {
  showMainLog.value = false;
  showProcessedLog.value = false;
  showSkippedLog.value = false;
  if (!showErrorLog.value) {
    const log = await get<string>(client.value.Ip + "/logs/err/");
    errorLog.value = log.split("\n");
  }
  showErrorLog.value = !showErrorLog.value;
}

async function getProcessedLog() {
  showMainLog.value = false;
  showErrorLog.value = false;
  showSkippedLog.value = false;
  if (!showProcessedLog.value) {
    const log = await get<string>(client.value.Ip + "/logs/processed/");
    processedLog.value = log.split("\n");
  }
  showProcessedLog.value = !showProcessedLog.value;
}

async function getSkippedLog() {
  showMainLog.value = false;
  // PRESERVED: the original clears showProcessedLog twice and never clears
  // showErrorLog, so opening the skipped log leaves the error log open.
  showProcessedLog.value = false;
  showProcessedLog.value = false;
  if (!showSkippedLog.value) {
    const log = await get<string>(client.value.Ip + "/logs/skipped/");
    skippedLog.value = log.split("\n");
  }
  showSkippedLog.value = !showSkippedLog.value;
}

/**
 * Determines if the client is currently in an intermediate state.
 * Only ever reached behind `isLoading`, which guarantees Encoder/FileWalker/Mover exist.
 */
function determineIndeterminate() {
  return (
    (client.value.Encoder.Active && client.value.Encoder.Remaining === 0) ||
    (client.value.FileWalker.Active && client.value.FileWalker.LibSize === 0) ||
    client.value.InFile == ""
  );
}

async function toggleEncoderLog() {
  showEncoderLog.value = !showEncoderLog.value;
  try {
    const lineOut = await get<string[]>(client.value.Ip + "/encoder/");
    client.value.EncoderLineOut = lineOut;
  } catch (e) {
    // The original assigns the empty STRING here, not an empty array. It is only ever
    // used as a falsy sentinel by the template's v-if, so the value is preserved as-is
    // rather than "corrected" to [] -- which would render an empty scroller instead of
    // no scroller at all.
    client.value.EncoderLineOut = "" as unknown as string[];
    console.log("could not retrieve encoder log");
    console.log(e);
  }
}

/**
 * Checks if the client is active.
 *
 * Typed `any` deliberately. The template uses it as `v-else-if="isActive"` -- a bare
 * function REFERENCE, never called -- which is therefore always truthy. That was
 * equally true under the Options API (a bound method is truthy), so the rendering is
 * unchanged; but a typed function in a condition trips TS2774. Annotating as `any`
 * keeps the always-true behaviour instead of "fixing" the template into calling it.
 */
const isActive: any = function () {
  const curProcess = getActiveProcess().process;
  return !INACTIVE.includes(curProcess);
};

function isOnline() {
  return getActiveProcess().process !== OFFLINE;
}

function isPauseError() {
  const pauseError = getActiveProcess().process === PAUSED && client.value.PauseReason && client.value.PauseReason.length > 0;
  return pauseError;
}

function clearClient() {
  //todo: this needs to maybe be different to make clients going offline mid-work don't show strings
  //this may not even be needed if done right i think, as we can just emit a new offline client object for the list!
  client.value.Status = "offline";
  client.value.Paused = false;
  client.value.InFile = "";
  client.value.PauseReason = "";
  showMainLog.value = false;
  showErrorLog.value = false;
  showProcessedLog.value = false;
  showSkippedLog.value = false;
  mainLog.value = [];
  errorLog.value = [];
  processedLog.value = [];
  skippedLog.value = [];
  showProcessInfo.value = false;
  showEncoderLog.value = false;
  remaining.value = null;
  pauseMachine.value = false;
  resumeMachine.value = false;
  shutdownMachine.value = false;
  shutdownConfirm.value = false;
}

async function sendResumeCommand() {
  resumeMachine.value = true;
  setTimeout(() => {
    resumeMachine.value = false;
  }, 1000);
  const url = client.value.Ip + "/resume";
  try {
    await fetch(url, {
      method: "PUT",
    });
  } catch (err) {
    setErrorMessage(err, "resume");
  }
}

async function sendPauseCommand() {
  pauseMachine.value = true;
  setTimeout(() => {
    pauseMachine.value = false;
  }, 1000);
  const url = client.value.Ip + "/pause";
  try {
    const response = await fetch(url, {
      method: "PUT",
    });
    // PRESERVED BUG: `response` is a Response object, never the string "paused", so
    // this branch is dead and the //todo: BUGGED!!!!! block below never runs.
    if ((response as unknown) == "paused") {
      try {
        //todo: BUGGED!!!!! reponse never comes
        const refreshResponse = await get<ClientInfo>(url);
        if (!(refreshResponse.Encoder.Active || refreshResponse.FileWalker.Active || refreshResponse.Mover.Active)) {
          setClientPaused();
        }
      } catch (err) {
        setErrorMessage(err, "pause");
        pauseMachine.value = false;
      }
    }
  } catch (err) {
    setErrorMessage(err, "pause");
    pauseMachine.value = false;
  }
}

async function sendShutdownCommand() {
  shutdownMachine.value = true;
  const url = client.value.Ip + "/shutdown";
  try {
    await fetch(url, {
      method: "PUT",
    });
  } catch (err) {
    setErrorMessage(err, "shut down");
  }
  shutdownMachine.value = false;
}

function setClientPaused() {
  client.value.Paused = true;
  client.value.Encoder.Active = false;
  client.value.FileWalker.Active = false;
  client.value.Mover.Active = false;
}

function setErrorMessage(err: unknown, mode: string) {
  clearTimeout(errorMessageTimeout);
  errorMessage.value = `Could not ${mode} ${client.value.HostName}.`;
  errorMessageTimeout = setTimeout(() => {
    errorMessage.value = null;
  }, 5000);
}

function getActiveProcess(): { process: string; text: string } {
  const c = client.value;
  // if the client.Status attribute exists it is considered offline.
  // NO CLUE why this is the way it is, but it is.
  if (c.Status) {
    return { process: OFFLINE, text: "Offline" };
  } else if (c.Encoder.Active) {
    return { process: ENCODER, text: "Encoder" };
  } else if (c.FileWalker.Active) {
    return { process: FILEWALKER, text: "Luke File Walker" };
  } else if (c.Mover.Active) {
    return { process: MOVER, text: "Mover" };
  } else if (c.Paused) {
    return { process: PAUSED, text: "Paused" };
  } else if (c.InFile !== "") {
    return { process: WORKING, text: "Working" };
  } else if (c.Sleeping) {
    return { process: SLEEPING, text: "Sleeping" };
  } else {
    return { process: IDLE, text: "Idle" };
  }
}

function getDurationFromDate(date: Date) {
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date
    .getUTCSeconds()
    .toString()
    .padStart(2, "0")}`;
}

function getEncoderInfo(): Record<string, unknown> {
  const enc: Record<string, unknown> = Object.assign({}, client.value.Encoder);
  const duration = new Date((enc.Duration as string).replace("0001", "2000"));
  const position = new Date((enc.Position as string).replace("0001", "2000"));
  const rem = new Date((enc.Remaining as number) / 1000 / 1000);
  enc.Duration = getDurationFromDate(duration);
  enc.Position = getDurationFromDate(position);
  enc.Remaining = getDurationFromDate(rem);
  remaining.value = enc.Remaining as string;
  return filterObject(enc, ["Active", "Remaining", "Speed", "Slice", "OfSlices", "Fps", "Progress"]);
}

function getFileWalkerInfo(): Record<string, unknown> {
  const info = filterObject(client.value.FileWalker as unknown as Record<string, unknown>, ["Active", "Progress"]);
  remaining.value = null;
  return info;
}

function getMoverInfo(): Record<string, unknown> {
  const info = filterObject(client.value.Mover as unknown as Record<string, unknown>, ["Active", "Progress"]);
  remaining.value = null;
  return info;
}

function getEncoderProgress() {
  const encoder = client.value.Encoder;
  let progress: number | string = 0;
  if (encoder.OfSlices == 0) {
    progress = encoder.Progress.toFixed(2);
  } else {
    progress = (((encoder.Slice - 1) / encoder.OfSlices + encoder.Progress / 100 / encoder.OfSlices) * 100).toFixed(2);
  }
  return progress;
}

function getFileWalkerProgress(): number | string {
  const fw = client.value.FileWalker;
  if (fw.LibSize == 0) {
    return 0;
  }
  return ((fw.Position / fw.LibSize) * 100).toFixed(2);
}

function getMoverProgress() {
  return client.value.Mover.Progress.toFixed(2);
}

function filterObject(originalObj: Record<string, unknown>, filter: string[]): Record<string, unknown> {
  return Object.keys(originalObj)
    .filter((key) => !filter.includes(key))
    .reduce((obj: Record<string, unknown>, key) => {
      obj[key] = originalObj[key];
      return obj;
    }, {});
}

onMounted(() => {
  connectToWebSocket(client.value);
});

onBeforeUnmount(() => {
  try {
    ws!.close();
  } catch (e) {
    console.log("error while closing websocket");
    console.log(e);
  }
  console.log("websocket closed");
});
</script>

<!--
  The original declared lang="scss" but the block is plain CSS with no SCSS
  syntax in it. The only `sass` in node_modules is a stale 1.32 transitive
  leftover that Vite 8 cannot drive (`sass.initAsyncCompiler is not a
  function`), so this is plain CSS: identical output, no new dependency.
-->
<style>
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

.status-pause-error {
  color: rgb(244, 146, 54);
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
