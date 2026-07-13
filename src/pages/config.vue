<template>
  <div>
    <v-row v-if="fetchPending" class="mb-6 mt-10" justify="center" no-gutters>
      <v-progress-circular :size="150" :width="20" color="red-darken-3" indeterminate></v-progress-circular>
    </v-row>
    <!--
    <v-row
      v-else-if="$fetchState.error"
      class="mb-6"
      justify="start"
      no-gutters
    >
      <p>No one seems to be online. {{ err }}</p>
    </v-row>-->
    <v-container class="px-0" v-else>
      <v-row class="mb-2" justify="start" no-gutters>
        <v-col class="client-dropdown">
          <v-select
            :items="items"
            :item-title="'Name'"
            v-model="selectedClient"
            @update:model-value="configLoad"
            label="Client"
            variant="outlined"
            return-object
          ></v-select>
        </v-col>
      </v-row>
      <!-- Config Card -->
      <v-row v-if="config == null || loading" justify="center" class="mb-6" no-gutters>
        <v-progress-circular :size="150" :width="20" color="red-darken-3" indeterminate></v-progress-circular>
      </v-row>
      <v-row justify="center" class="mb-6" no-gutters v-else-if="err != ''">
        <v-icon size="150">mdi-lan-disconnect</v-icon>
      </v-row>
      <v-row v-else-if="!clientIsSelected"> </v-row>
      <v-card v-else>
        <!-- v-tabs-slider is gone in Vuetify 4; the slider is styled via slider-color on v-tabs.
             background-color became bg-color, centered became align-tabs, and dark is dropped. -->
        <v-tabs v-model="selectedTab" color="white" bg-color="red-darken-3" slider-color="white" show-arrows align-tabs="center">
          <v-tab v-for="configOption in configHeaders" :key="configOption" :value="configOption">{{ configOption }}</v-tab>
        </v-tabs>
        <v-window v-model="selectedTab">
          <!--general settings -->
          <v-window-item :key="configHeaders[0]" :value="configHeaders[0]">
            <v-card flat>
              <v-row justify="start" class="px-7 mt-4">
                <v-col cols="12" sm="2" md="2" lg="2" class="mb-1 pb-0">
                  <v-text-field
                    label="Extension"
                    v-model="config.Ext"
                    placeholder="Enter Extension"
                    hide-details
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="10" md="10" lg="10" class="mb-1 pb-0">
                  <v-text-field
                    label="Obsolete Directory"
                    placeholder="Enter Path"
                    v-model="config.ObsoletePath"
                    hide-details
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row justify="start" class="px-7 mt-4">
                <v-col class="mt-0 pt-0">
                  <v-checkbox v-model="config.PauseOnEncodeError" hide-details :label="`Pause service if encoding fails`"></v-checkbox>
                </v-col>
              </v-row>
              <v-row justify="start" class="px-4">
                <v-col> <CacheConfig @newdata="handleRedisConfigUpdate" :redisConfig="config.Redis" /> </v-col>
              </v-row>
              <v-row justify="start" class="px-4">
                <v-col class="mt-0 pt-0">
                  <SimpleList
                    @newdata="handleMediaPathData($event)"
                    :icon="'mdi-folder'"
                    :list="config.MediaPaths"
                    :type="'Media Path'"
                  ></SimpleList>
                </v-col>
              </v-row>
            </v-card>
          </v-window-item>

          <!--audio formats-->
          <v-window-item :key="configHeaders[1]" :value="configHeaders[1]">
            <v-card flat>
              <v-container class="d-flex flex-wrap">
                <v-col cols="12" sm="6" md="6">
                  <SimpleList
                    @newdata="handleAudioFormatStereoData($event)"
                    :icon="'mdi-music-note'"
                    :list="config.AudioFormats.StereoTags"
                    :type="'Stereo Format'"
                  ></SimpleList>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <SimpleList
                    @newdata="handleAudioFormatMultiData($event)"
                    :icon="'mdi-music-note-plus'"
                    :list="config.AudioFormats.MultiTags"
                    :type="'Multi Format'"
                  ></SimpleList>
                </v-col>
              </v-container>
            </v-card>
          </v-window-item>
          <!--resolutions-->
          <v-window-item :key="configHeaders[2]" :value="configHeaders[2]" class="mt-4">
            <Property
              v-for="elem of resolutionArray"
              :key="elem.tag"
              :tag="elem.tag"
              :id="elem.id"
              :new="elem.new"
              :content="elem.resolution"
              :allowNew="true"
              @deleted="handleResolutionDelete($event)"
              @newcontentdata="handleResolutionContentData($event)"
              @newtagdata="handleResolutionTagEdit($event)"
              tagName="Tag"
              contentName="Resolution"
            ></Property>
            <v-container class="d-flex justify-center">
              <!-- v-btn has no `fab` prop in Vuetify 4; the boolean `icon` prop gives the round FAB shape. -->
              <v-btn icon color="red-darken-3" @click="addResolution()">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-container>
          </v-window-item>

          <!--modules-->
          <!--first column-->
          <v-window-item :eager="true" :key="configHeaders[3]" :value="configHeaders[3]" class="mt-2">
            <div class="d-flex flex-wrap">
              <div class="module-col">
                <Module :name="'AudioModule'" :module="config.Modules.AudioModule">
                  <AudioSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.AudioModule.Settings"
                    :name="'AudioModule'"
                  ></AudioSettings>
                </Module>
                <Module :name="'AgeModule'" :module="config.Modules.AgeModule">
                  <AgeSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.AgeModule.Settings"
                    :name="'AgeModule'"
                  ></AgeSettings>
                </Module>
                <Module :name="'LegacyModule'" :module="config.Modules.LegacyModule"></Module>
                <Module :name="'LengthModule'" :module="config.Modules.LengthModule">
                  <LengthSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.LengthModule.Settings"
                    :name="'LengthModule'"
                  ></LengthSettings>
                </Module>
                <Module :name="'ErrorSkipModule'" :module="config.Modules.ErrorSkipModule">
                  <ErrorSkipSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.ErrorSkipModule.Settings"
                    :name="'ErrorSkipModule'"
                  ></ErrorSkipSettings>
                </Module>
                <Module :name="'ErrorReplaceModule'" :module="config.Modules.ErrorReplaceModule">
                  <ErrorReplaceSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.ErrorReplaceModule.Settings"
                    :name="'ErrorReplaceModule'"
                  ></ErrorReplaceSettings>
                </Module>
              </div>
              <!--second column-->
              <div class="module-col">
                <Module :name="'LogMatchModule'" :module="config.Modules.LogMatchModule">
                  <LogMatchSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.LogMatchModule.Settings"
                    :name="'LogMatchModule'"
                  ></LogMatchSettings>
                </Module>
                <Module :name="'MaxSizeModule'" :module="config.Modules.MaxSizeModule">
                  <MaxSizeSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.MaxSizeModule.Settings"
                    :name="'MaxSizeModule'"
                  ></MaxSizeSettings>
                </Module>
                <Module :name="'ResolutionModule'" :module="config.Modules.ResolutionModule">
                  <ResolutionSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.ResolutionModule.Settings"
                    :name="'ResolutionModule'"
                  ></ResolutionSettings>
                </Module>
                <Module :name="'SizeApproxModule'" :module="config.Modules.SizeApproxModule">
                  <SizeApproxSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.SizeApproxModule.Settings"
                    :name="'SizeApproxModule'"
                  ></SizeApproxSettings>
                </Module>
                <Module :name="'DuplicateLengthCheckModule'" :module="config.Modules.DuplicateLengthCheckModule">
                  <DuplicateLengthCheckSettings
                    @newdata="handleModuleSettings($event)"
                    :settings="config.Modules.DuplicateLengthCheckModule.Settings"
                    :name="'DuplicateLengthCheckModule'"
                  ></DuplicateLengthCheckSettings>
                </Module>
              </div>
            </div>
          </v-window-item>

          <!--encoder config-->
          <v-window-item :key="configHeaders[4]" :value="configHeaders[4]" class="mt-2">
            <v-card>
              <v-select
                variant="outlined"
                class="px-4 pt-4 mb-0 pb-0"
                :items="encoderPriority"
                v-model="config.EncoderPriority"
                label="Select an encoder process priority"
              ></v-select>

              <v-select
                class="px-4 pt-0"
                :items="encoderConfigArray"
                :item-title="'tag'"
                :item-value="'tag'"
                v-model="selectedEncoderConfigTag"
                :disabled="!allowUploadConfig"
                @update:model-value="loadEncoderConfig"
                label="Add or edit an encoder configuration"
                variant="outlined"
              ></v-select>
              <div v-if="selectedEncoderConfig.content">
                <EncoderConfig
                  :tag="selectedEncoderConfig.tag"
                  :id="selectedEncoderConfig.id"
                  :new="selectedEncoderConfig.new"
                  :content="selectedEncoderConfig.content"
                  @deleted="handleEncoderSettingsDelete($event)"
                  @newdata="handleEncoderSettingsData($event)"
                  @isEdit="handleEncoderSettingsEditActive($event)"
                  :allowNew="true"
                ></EncoderConfig>
              </div>
            </v-card>
          </v-window-item>

          <!--
          <v-window-item v-for="configOption in configHeaders" :key="configOption">
            <v-card flat>
              <v-card-text>{{ "dis an option" }}</v-card-text>
            </v-card>
          </v-window-item>-->
        </v-window>
      </v-card>
      <div class="d-flex flex-wrap">
        <v-btn
          :loading="saving"
          :disabled="!allowUploadConfig"
          v-if="clientIsSelected && !loading && !err"
          @click="saveConfig()"
          color="red-darken-2"
          class="mt-6 mr-6"
          >Upload Config</v-btn
        >
        <div>
          <v-btn @click="configImportConfirm = true" color="gray-darken-3" v-if="clientIsSelected && !loading && !err" class="mt-6"
            >Import</v-btn
          >
          <v-btn @click="configExportDialog = true" color="gray-darken-3" v-if="clientIsSelected && !loading && !err" class="mt-6"
            >Export</v-btn
          >
        </div>
      </div>
    </v-container>

    <!--import dialog-->
    <v-dialog v-if="configImportConfirm" v-model="configImportConfirm" max-width="500">
      <v-card>
        <v-card-title>
          Paste your json configuration here!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle>Make sure to hit opslaan afterwards. DatabaseURL is omitted for security reasons.</v-card-subtitle>
        <v-container>
          <v-textarea
            variant="outlined"
            label="Import"
            name="Import Config"
            :error-messages="configImportError"
            v-model="configImportString"
          ></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="darken-1"
            variant="text"
            @click="
              configImportConfirm = false;
              configImportString = '';
            "
            >Cancel</v-btn
          >
          <v-btn color="green" variant="text" @click="importConfig">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-if="configExportDialog" v-model="configExportDialog" max-width="500">
      <v-card>
        <v-card-title>
          Here's your configuration in a json format!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle>DatabaseURL is omitted and can only be set from the client machine</v-card-subtitle>
        <v-container>
          <v-textarea variant="outlined" label="Config" rows="12" v-model="configExportString" name="Export Config"></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="darken-1" variant="text" @click="configExportDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { get, put } from "@/api/http";
import CacheConfig from "@/components/CacheConfig.vue";
import EncoderConfig from "@/components/EncoderConfig.vue";
import Property from "@/components/Property.vue";
import SimpleList from "@/components/SimpleList.vue";
import Module from "@/components/Modules/Module.vue";
import AgeSettings from "@/components/Modules/AgeSettings.vue";
import AudioSettings from "@/components/Modules/AudioSettings.vue";
import DuplicateLengthCheckSettings from "@/components/Modules/DuplicateLengthCheckSettings.vue";
import ErrorReplaceSettings from "@/components/Modules/ErrorReplaceSettings.vue";
import ErrorSkipSettings from "@/components/Modules/ErrorSkipSettings.vue";
import LengthSettings from "@/components/Modules/LengthSettings.vue";
import LogMatchSettings from "@/components/Modules/LogMatchSettings.vue";
import MaxSizeSettings from "@/components/Modules/MaxSizeSettings.vue";
import ResolutionSettings from "@/components/Modules/ResolutionSettings.vue";
import SizeApproxSettings from "@/components/Modules/SizeApproxSettings.vue";

import { computed, onMounted, ref } from "vue";
import { useClientResolution } from "@/composables/useClientResolution";
import type {
  Client,
  Config,
  EncoderConfigEntry,
  EncoderConfigEntryRow,
  ModuleSettingsUpdate,
  PropertyEntry,
  RedisConfig,
} from "@/types";

const { resolveClient } = useClientResolution();

const configExportDialog = ref(false);
const configImportConfirm = ref(false);
const configImportString = ref("");
const configImportError = ref<string | null>(null);
const encoderPriority = ref(["IDLE", "BELOW_NORMAL", "NORMAL", "ABOVE_NORMAL", "HIGH"]);
// `err` is assigned a string, an Error and `false` at different points in the
// original. The template only ever tests `err != ''`, so the union is kept as-is.
const err = ref<unknown>("");
const selectedEncoderConfigTag = ref("");
const selectedEncoderConfig = ref<EncoderConfigEntryRow>({} as EncoderConfigEntryRow);
const allowUploadConfig = ref(true);
const saving = ref(false);
const loading = ref(false);
// Stands in for Nuxt's $fetchState.pending: true only for the initial
// client-list fetch, not for the per-client config load (that is `loading`).
const fetchPending = ref(false);
const items = ref<Client[]>([]);
// Starts as an empty object: the template gates every `config.*` read behind
// `v-if="config == null || config == {} || loading"`, so nothing dereferences it
// before configLoad() replaces it with a real Config.
const config = ref<Config>({} as Config);
const selectedClient = ref<Client>({} as Client);
const selectedTab = ref("General");
const configHeaders = ref(["General", "Audio Formats", "Resolutions", "Modules", "Encoder"]);

const clientIsSelected = computed(() => {
  return selectedClient.value && Object.keys(selectedClient.value).length !== 0;
});

const resolutionArray = computed<PropertyEntry[]>(() => {
  const ary: PropertyEntry[] = [];
  let idx = 0;
  for (const prop of Object.entries(config.value.Resolutions)) {
    if (prop[0] === "") {
      ary.push({ tag: prop[0], resolution: prop[1], id: idx, new: true });
    } else {
      ary.push({ tag: prop[0], resolution: prop[1], id: idx, new: false });
    }

    idx++;
  }
  return ary;
});

const encoderConfigArray = computed<EncoderConfigEntryRow[]>(() => {
  const ary: EncoderConfigEntryRow[] = [];
  let idx = 0;
  for (const prop of Object.entries(config.value.EncoderConfig)) {
    if (prop[0] === "") {
      ary.push({ tag: prop[0], content: prop[1], id: idx, new: true });
    } else {
      ary.push({ tag: prop[0], content: prop[1], id: idx, new: false });
    }

    idx++;
  }
  ary.unshift({ tag: "New Template...", content: {}, id: -1, new: true });
  return ary;
});

const configExportString = computed(() => JSON.stringify(config.value, null, 1));

/**
 * Replaces Nuxt's async fetch() hook. Called from mounted().
 */
async function refresh() {
  fetchPending.value = true;
  loading.value = true;
  try {
    items.value = await get<Client[]>("/api/clients");
  } catch (error) {
    // Without this, a failing /api/clients (Mongo down) leaves fetchPending true
    // forever: the page renders a spinner and the client selector never appears.
    // index/jobs/globalconfig all guard this; config.vue did not.
    console.log(error);
    err.value = "could not load the client list";
  } finally {
    loading.value = false;
    fetchPending.value = false;
  }
}

/**
 * Races one client's addresses and writes the winner back onto the selected client.
 *
 * The write-back is NOT incidental: saveConfig() reads `selectedClient.Address`, and
 * nothing else ever sets it (it is not part of the Mongo document). This side effect
 * is the reason config.vue's copy of the race could not simply be swapped for the
 * shared one -- the shared resolveClient() supplies the resolution, and the write-back
 * stays here where it belongs.
 */
async function tryResolveClient(client: Client) {
  const resolvedClient = await resolveClient(client);
  // Vue 3's proxy reactivity tracks plain property addition; $set is gone.
  selectedClient.value.Address = resolvedClient.Address;
  return resolvedClient;
}

function importConfig() {
  try {
    const json = JSON.parse(configImportString.value);
    config.value = json;
    configImportConfirm.value = false;
    configImportError.value = "";
  } catch (err) {
    configImportError.value = `Invalid JSON: ${String(err)}`;
    console.log(`invalid json: ${err}`);
  }
}

async function saveConfig() {
  saving.value = true;
  console.log(selectedClient.value.Address);
  try {
    // 20s, matching the original's explicit AbortController timeout. A config
    // upload is a big body and a slow daemon operation, so it gets far longer
    // than the 2.5s default — but it must still be bounded, or a daemon that
    // accepts the connection and never answers spins the button forever.
    await put(`${selectedClient.value.Address!.trim()}/config`, config.value, 20000);
    setTimeout(() => {
      saving.value = false;
    }, 500);
  } catch (error) {
    console.log(error);
    err.value = "there was an error saving the configuration";
    saving.value = false;
  }
}

function loadEncoderConfig(tag?: string) {
  // VSelect has no `change` event in Vuetify 4, so this is wired to
  // @update:model-value, which hands the new tag in directly.
  const wanted = tag === undefined ? selectedEncoderConfigTag.value : tag;
  selectedEncoderConfig.value = encoderConfigArray.value.find((cfg) => cfg.tag == wanted) as EncoderConfigEntryRow;
}

async function configLoad(client: Client) {
  loading.value = true;
  err.value = false;
  const resolvedClient = await tryResolveClient(client);
  console.log(
    `Trying to get result for ${resolvedClient.Reachable ? "reachable" : "previously unreachable"} with ip ${resolvedClient.Address}`
  );
  try {
    config.value = await get<Config>(`${resolvedClient.Address}/config/`);
    if (selectedEncoderConfigTag.value) {
      loadEncoderConfig();
    }
  } catch (error) {
    err.value = error;
    console.log(`couldn't load config for client ${resolvedClient.Address}, err: ${err.value}`);
  }
  loading.value = false;
}

function addResolution() {
  config.value.Resolutions[""] = "";
}

function handleRedisConfigUpdate(e: RedisConfig) {
  console.log("good old jannis");
  config.value.Redis = e;
}

function handleMediaPathData(e: string[]) {
  config.value.MediaPaths = e;
}

function handleAudioFormatStereoData(e: string[]) {
  config.value.AudioFormats.StereoTags = e;
}

function handleAudioFormatMultiData(e: string[]) {
  config.value.AudioFormats.MultiTags = e;
}

function handleResolutionContentData(e: { tag: string; content: string }) {
  config.value.Resolutions[e.tag] = e.content;
}

function handleResolutionDelete(e: string) {
  delete config.value.Resolutions[e];
}

function handleResolutionTagEdit(e: { tag: string; id: number }) {
  const resConfig = resolutionArray.value;
  resConfig[e.id].tag = e.tag;
  const obj: Record<string, string> = {};
  resConfig.forEach((r) => (obj[r.tag] = r.resolution));
  config.value.Resolutions = obj;
}

function handleModuleSettings(e: ModuleSettingsUpdate) {
  (config.value.Modules[e.Name] as { Settings: unknown }).Settings = e.Settings;
}

function handleEncoderSettingsData(e: { tag: string; content: Partial<EncoderConfigEntry>; id: number }) {
  config.value.EncoderConfig[e.tag] = e.content as EncoderConfigEntry;
}

function handleEncoderSettingsDelete(e: string) {
  delete config.value.EncoderConfig[e];
}

function handleEncoderSettingsEditActive(e: boolean) {
  allowUploadConfig.value = e;
}

onMounted(() => {
  refresh();
});
</script>

<!-- Plain CSS: the block uses no SCSS syntax, and `sass` is not a dependency of the
     Vite app (the only copy in node_modules is a stale transitive of the old Nuxt
     stack, too old for Vite 8). Every other ported SFC dropped lang="scss" too. -->
<style>
@media only screen and (min-width: 600px) {
  .min-module-width {
    min-width: 380px !important;
  }
}
@media only screen and (min-width: 600px) {
  .min-module-width {
    min-width: 350px;
  }
}
@media only screen and (min-width: 360px) {
  .min-module-width {
    min-width: 280px;
  }
}

.wrapper {
  display: flex;
  flex-wrap: wrap;
  /*grid-template-columns: repeat(2, 1fr);
  grid-gap: 0px;*/
}

.module-col {
  flex-grow: 1;
  flex-basis: 50%;
  min-width: 300px;
}
</style>
