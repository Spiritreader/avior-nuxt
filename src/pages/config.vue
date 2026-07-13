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
      <v-row v-if="config == null || config == {} || loading" justify="center" class="mb-6" no-gutters>
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
          v-if="clientIsSelected && !loading && !err != ''"
          @click="saveConfig()"
          color="red-darken-2"
          class="mt-6 mr-6"
          >Upload Config</v-btn
        >
        <div>
          <v-btn @click="configImportConfirm = true" color="gray-darken-3" v-if="clientIsSelected && !loading && !err != ''" class="mt-6"
            >Import</v-btn
          >
          <v-btn @click="configExportDialog = true" color="gray-darken-3" v-if="clientIsSelected && !loading && !err != ''" class="mt-6"
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

<script>
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

export default {
  components: {
    CacheConfig,
    EncoderConfig,
    Property,
    SimpleList,
    Module,
    AgeSettings,
    AudioSettings,
    DuplicateLengthCheckSettings,
    ErrorReplaceSettings,
    ErrorSkipSettings,
    LengthSettings,
    LogMatchSettings,
    MaxSizeSettings,
    ResolutionSettings,
    SizeApproxSettings,
  },
  data: () => ({
    configExportDialog: false,
    configImportConfirm: false,
    configImportString: "",
    configImportError: null,
    encoderPriority: ["IDLE", "BELOW_NORMAL", "NORMAL", "ABOVE_NORMAL", "HIGH"],
    err: "",
    selectedEncoderConfigTag: "",
    selectedEncoderConfig: {},
    allowUploadConfig: true,
    saving: false,
    loading: false,
    // Stands in for Nuxt's $fetchState.pending: true only for the initial
    // client-list fetch, not for the per-client config load (that is `loading`).
    fetchPending: false,
    items: [],
    config: {},
    selectedClient: {},
    selectedTab: "General",
    selectedMediaPath: {},
    configHeaders: ["General", "Audio Formats", "Resolutions", "Modules", "Encoder"],
    newMediaPath: "",
    mediaPathEditButtons: false,
  }),
  computed: {
    clientIsSelected() {
      return this.selectedClient && Object.keys(this.selectedClient).length !== 0;
    },
    resolutionArray() {
      let ary = [];
      let idx = 0;
      for (let prop of Object.entries(this.config.Resolutions)) {
        if (prop[0] === "") {
          ary.push({ tag: prop[0], resolution: prop[1], id: idx, new: true });
        } else {
          ary.push({ tag: prop[0], resolution: prop[1], id: idx, new: false });
        }

        idx++;
      }
      return ary;
    },
    encoderConfigArray() {
      let ary = [];
      let idx = 0;
      for (let prop of Object.entries(this.config.EncoderConfig)) {
        if (prop[0] === "") {
          ary.push({ tag: prop[0], content: prop[1], id: idx, new: true });
        } else {
          ary.push({ tag: prop[0], content: prop[1], id: idx, new: false });
        }

        idx++;
      }
      ary.unshift({ tag: "New Template...", content: {}, id: -1, new: true });
      return ary;
    },
    configExportString() {
      return JSON.stringify(this.config, null, 1);
    },
  },
  mounted() {
    this.refresh();
  },
  methods: {
    /**
     * Replaces Nuxt's async fetch() hook. Called from mounted().
     */
    async refresh() {
      this.fetchPending = true;
      this.loading = true;
      this.items = await get("/api/clients");
      this.loading = false;
      this.fetchPending = false;
    },
    /**
     * Tries to resolve the first available IP address from all clients returned by the api.
     * @returns a list of resolved client objects with a HostName, Address and Reachable property.
     * The address provided when Reachable is false is not a correct resolve!
     */
    tryResolveClient: async function (client) {
      let promises = [];
      for (let address of client.Addresses) {
        try {
          let promise = new Promise(async (resolve, reject) => {
            let response;
            try {
              response = await get(address + "/alive");
            } catch (err) {
              reject({ address: "none", response: {} });
              return;
            }
            resolve({ address: address, response: response });
          });
          promises.push(promise);
        } catch (error) {
          console.log(`$failed to create promises: ${error}`);
        }
      }
      let resolution;
      const resolvedClient = {
        HostName: client.Name,
      };
      try {
        resolution = await Promise.any(promises);
        resolvedClient.Reachable = true;
        resolvedClient.Address = resolution.address;
      } catch {
        resolvedClient.Reachable = false;
        resolvedClient.Address = client.Addresses[0];
      }
      // Vue 3's proxy reactivity tracks plain property addition; $set is gone.
      this.selectedClient.Address = resolvedClient.Address;
      return resolvedClient;
    },
    importConfig() {
      try {
        let json = JSON.parse(this.configImportString);
        this.config = json;
        this.configImportConfirm = false;
        this.configImportError = "";
      } catch (err) {
        this.configImportError = `Invalid JSON: ${err.toString()}`;
        console.log(`invalid json: ${err}`);
      }
    },
    async saveConfig() {
      this.saving = true;
      console.log(this.selectedClient.Address);
      try {
        await put(`${this.selectedClient.Address.trim()}/config`, this.config);
        setTimeout(() => {
          this.saving = false;
        }, 500);
      } catch (err) {
        console.log(err);
        this.err = "there was an error saving the configuration";
        this.saving = false;
      }
    },
    loadEncoderConfig(tag) {
      // VSelect has no `change` event in Vuetify 4, so this is wired to
      // @update:model-value, which hands the new tag in directly.
      const wanted = tag === undefined ? this.selectedEncoderConfigTag : tag;
      this.selectedEncoderConfig = this.encoderConfigArray.find((cfg) => cfg.tag == wanted);
    },
    async configLoad(client) {
      this.loading = true;
      this.err = false;
      const resolvedClient = await this.tryResolveClient(client);
      console.log(
        `Trying to get result for ${resolvedClient.Reachable ? "reachable" : "previously unreachable"} with ip ${resolvedClient.Address}`
      );
      try {
        this.config = await get(`${resolvedClient.Address}/config/`);
        if (this.selectedEncoderConfigTag) {
          this.loadEncoderConfig();
        }
      } catch (err) {
        this.err = err;
        console.log(`couldn't load config for client ${resolvedClient.Address}, err: ${this.err}`);
      }
      this.loading = false;
    },
    addResolution() {
      this.config.Resolutions[""] = "";
    },
    handleRedisConfigUpdate: function (e) {
      console.log("good old jannis");
      this.config.Redis = e;
    },
    handleMediaPathData: function (e) {
      this.config.MediaPaths = e;
    },
    handleAudioFormatStereoData: function (e) {
      this.config.AudioFormats.StereoTags = e;
    },
    handleAudioFormatMultiData: function (e) {
      this.config.AudioFormats.MultiTags = e;
    },
    handleResolutionContentData: function (e) {
      this.config.Resolutions[e.tag] = e.content;
    },
    handleResolutionDelete: function (e) {
      delete this.config.Resolutions[e];
    },
    handleResolutionTagEdit: function (e) {
      let resConfig = this.resolutionArray;
      resConfig[e.id].tag = e.tag;
      let obj = {};
      resConfig.forEach((r) => (obj[r.tag] = r.resolution));
      this.config.Resolutions = obj;
    },
    handleModuleSettings: function (e) {
      this.config.Modules[e.Name].Settings = e.Settings;
    },
    handleEncoderSettingsData: function (e) {
      this.config.EncoderConfig[e.tag] = e.content;
    },
    handleEncoderSettingsDelete: function (e) {
      delete this.config.EncoderConfig[e];
    },
    handleEncoderSettingsEditActive: function (e) {
      this.allowUploadConfig = e;
    },
  },
};
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
