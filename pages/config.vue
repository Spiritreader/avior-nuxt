<template>
  <v-container>
    <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
      <v-progress-circular :size="150" :width="80" color="red darken-3" indeterminate></v-progress-circular>
    </v-row>
    <v-row v-else-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load {{err}}</p>
    </v-row>
    <v-container v-else>
      <v-row class="mb-2" justify="start" no-gutters>
        <v-col class="client-dropdown">
          <v-select
            :items="items"
            :item-text="'Name'"
            :item-value="'Address'"
            v-model="selectedClient"
            @change="configLoad"
            label="Client"
            outlined
          ></v-select>
        </v-col>
      </v-row>
      <!-- Config Card -->
      <v-row v-if="config == {} || loading" justify="center" class="mb-6" no-gutters>
        <v-progress-circular :size="150" :width="80" color="red darken-3" indeterminate></v-progress-circular>
      </v-row>
      <v-card v-else>
        <v-tabs
          v-model="selectedTab"
          color="white"
          background-color="red darken-3"
          show-arrows
          dark
        >
          <v-tabs-slider color="white"></v-tabs-slider>
          <v-tab v-for="configOption in configHeaders" :key="configOption">{{ configOption }}</v-tab>
        </v-tabs>
        <v-tabs-items v-model="selectedTab">
          <!--general settings -->
          <v-tab-item :key="configHeaders[0]">
            <v-card flat>
              <v-row justify="start" class="px-4 mt-4">
                <v-col cols="12" sm="2" md="2" class="mb-1 pb-0">
                  <v-text-field
                    label="Extension"
                    v-model="config.Ext"
                    placeholder="Enter Extension"
                    hide-details
                    outlined
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="10" md="10" class="mb-1 pb-0">
                  <v-text-field
                    label="Obsolete Directory"
                    placeholder="Enter Path"
                    v-model="config.ObsoletePath"
                    hide-details
                    outlined
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row justify="start" class="px-4">
                <v-col class="mt-0 pt-0">
                  <List
                    @newdata="handleMediaPathData($event)"
                    :icon="'mdi-folder'"
                    :list="config.MediaPaths"
                    :type="'Media Path'"
                  ></List>
                </v-col>
              </v-row>
            </v-card>
          </v-tab-item>
          <!--audio formats-->
          <v-tab-item :key="configHeaders[1]">
            <v-card flat>
              <v-container class="d-flex flex-wrap">
                <v-col cols="12" sm="6" md="6">
                  <List
                    @newdata="handleAudioFormatStereoData($event)"
                    :icon="'mdi-music-note'"
                    :list="config.AudioFormats.StereoTags"
                    :type="'Stereo Format'"
                  ></List>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <List
                    @newdata="handleAudioFormatMultiData($event)"
                    :icon="'mdi-music-note-plus'"
                    :list="config.AudioFormats.MultiTags"
                    :type="'Multi Format'"
                  ></List>
                </v-col>
              </v-container>
            </v-card>
          </v-tab-item>
          <!--resolutions-->
          <v-tab-item :key="configHeaders[2]" class="mt-4">
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
              <v-btn fab color="red darken-3" @click="addResolution()">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-container>
          </v-tab-item>

          <!--modules-->

          <v-tab-item :key="configHeaders[3]" class="mt-2">
            <v-container d-flex flex-column>
              <v-row>
                <v-col
                  class="min-module-width"
                  v-for="cfgmodule of Object.entries(config.Modules)"
                  :key="cfgmodule[0]"
                >
                  <Module :name="cfgmodule[0]" :module="cfgmodule[1]"></Module>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>

          <!--
          <v-tab-item v-for="configOption in configHeaders" :key="configOption">
            <v-card flat>
              <v-card-text>{{ "dis an option" }}</v-card-text>
            </v-card>
          </v-tab-item>-->
        </v-tabs-items>
      </v-card>
      <v-btn :loading="saving" color="red darken-2" class="mt-6">opslaan</v-btn>
    </v-container>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    err: "",
    saving: false,
    loading: false,
    items: [],
    config: {},
    selectedClient: {},
    selectedTab: "General",
    selectedMediaPath: {},
    configHeaders: [
      "General",
      "Audio Formats",
      "Resolutions",
      "Modules",
      "Encoder",
    ],
    newMediaPath: "",
    mediaPathEditButtons: false,
  }),
  computed: {
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
  },
  async fetch() {
    this.loading = true;
    //this.items = await fetch("api/clients").then(res => res.json());
    this.items = await this.$http.$get("api/clients");
    if (this.items.length > 0) {
      this.selectedClient = this.items[0];
      try {
        //this.config = await fetch(`${this.selectedClient.Address}/config`).then(res => res.json());
        this.config = await this.$http.$get(
          `${this.selectedClient.Address}/config`
        );
        this.loading = false;
      } catch (err) {
        console.log(`couldn't load config for client ${client}, err: ${err}`);
        this.err = err;
      }
    }
  },
  methods: {
    async configLoad(client) {
      this.loading = true;
      try {
        //this.config = await fetch(`${client}/config`).then(res => res.json());
        this.config = await fetch(`${client}/config`);
        this.loading = false;
      } catch (err) {
        console.log(`couldn't load config for client ${client}, err: ${err}`);
        this.err = err;
      }
    },
    addResolution() {
      this.$set(this.config.Resolutions, "", "");
    },
    handleMediaPathData: function (e) {
      this.config.MediaPaths = e;
      console.log(this.config.MediaPaths);
    },
    handleAudioFormatStereoData: function (e) {
      this.config.AudioFormats.StereoTags = e;
      console.log(this.config.AudioFormats.StereoTags);
    },
    handleAudioFormatMultiData: function (e) {
      this.config.AudioFormats.MultiTags = e;
      console.log(this.config.AudioFormats.MultiTags);
    },
    handleResolutionContentData: function (e) {
      this.config.Resolutions[e.tag] = e.content;
    },
    handleResolutionDelete: function (e) {
      this.$delete(this.config.Resolutions, e);
    },
    handleResolutionTagEdit: function (e) {
      let resConfig = this.resolutionArray;
      resConfig[e.id].tag = e.tag;
      let obj = {};
      resConfig.forEach((r) => (obj[r.tag] = r.resolution));
      this.config.Resolutions = obj;
    },
  },
};
</script>

<style lang="scss">
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
@media only screen and (min-width: 370px) {
  .min-module-width {
    min-width: 280px;
  }
}
</style>