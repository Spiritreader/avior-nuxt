<template>
  <v-container>
    <v-row v-if="$fetchState.pending" class="mb-6 mt-10" justify="center" no-gutters>
      <v-progress-circular :size="150" :width="80" color="red" indeterminate></v-progress-circular>
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
      <v-row v-if="config != {}" class="mb-6" no-gutters>{{ config }}</v-row>
      <!-- Config Card -->
      <v-row v-if="loading" justify="center" class="mb-6" no-gutters>
        <v-progress-circular :size="150" :width="80" color="red" indeterminate></v-progress-circular>
      </v-row>
      <v-card v-else>
        <v-tabs v-model="selectedTab" background-color="primary" dark>
          <v-tab v-for="configOption in configHeaders" :key="configOption">{{ configOption }}</v-tab>
        </v-tabs>
        <v-tabs-items v-model="selectedTab">
          <v-tab-item v-for="configOption in configHeaders" :key="configOption">
            <v-card flat>
              <v-card-text>{{ "dis an option" }}</v-card-text>
            </v-card>
          </v-tab-item>
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
    configHeaders: ["General", "Audio Formats", "Modules", "Encoder"],
  }),
  async fetch() {
    this.loading = true;
    this.items = await this.$axios.$get("/api/clients");
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
        this.config = await this.$http.$get(`${client}/config`);
        this.loading = false;
      } catch (err) {
        console.log(`couldn't load config for client ${client}, err: ${err}`);
      }

    },
  },
};
</script>

<style lang="scss">
.client-dropdown {
  max-width: 500px;
}
</style>
