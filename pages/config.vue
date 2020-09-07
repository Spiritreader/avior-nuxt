<template>
  <v-container>
    <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
      <v-progress-circular :size="150" :width="80" color="red darken-3" indeterminate></v-progress-circular>
    </v-row>
    <v-row v-else-if="$fetchState.error" class="mb-6" justify="start" no-gutters>
      <p>There was something I couldn't load.</p>
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
                  <List @newdata="handleData($event)" :icon="'mdi-folder'" :list="config.MediaPaths"></List>
                </v-col>
              </v-row>
            </v-card>
          </v-tab-item>
          <!--
          <v-tab-item v-for="configOption in configHeaders" :key="configOption">
            <v-card flat>
              <v-card-text>{{ "dis an option" }}</v-card-text>
            </v-card>
          </v-tab-item>-->
        </v-tabs-items>
      </v-card>
    </v-container>
  </v-container>
</template>

<script>
export default {
  data: () => ({
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
  async fetch() {
    this.loading = true;
    this.items = await fetch("api/clients").then(res => res.json());
    if (this.items.length > 0) {
      this.selectedClient = this.items[0];
      try {
        this.config = await this.$http.$get(
          `${this.selectedClient.Address}/config`
        );
        this.loading = false;
      } catch (err) {
        console.log(`couldn't load config for client ${client}, err: ${err}`);
      }
    }
  },
  methods: {
    async configLoad(client) {
      this.loading = true;
      try {
        this.config = await fetch(`${client}/config`).then(res => res.json());
        this.loading = false;
      } catch (err) {
        console.log(`couldn't load config for client ${client}, err: ${err}`);
      }
    },
    handleData: function (e) {
      this.config.MediaPaths = e;
      console.log(this.config.MediaPaths);
    },
  },
};
</script>