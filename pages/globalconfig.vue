<template>
  <div>
    <v-row class="mb-6 mt-10" justify="center" no-gutters v-if="$fetchState.pending">
      <v-progress-circular :size="150" :width="20" color="indigo lighten-2" indeterminate></v-progress-circular>
    </v-row>
    <v-row class="mb-6" justify="start" no-gutters v-else-if="$fetchState.error">
      <p>No client reachable to marshall database operations</p>
    </v-row>
    <v-card v-else>
      <v-tabs
        background-color="indigo lighten-2"
        centered
        color="white"
        dark
        show-arrows
        v-model="tab"
      >
        <v-tabs-slider color="white"></v-tabs-slider>
        <v-tab href="#tab-1">
          <v-icon class="mr-1">mdi-laptop</v-icon>Clients
        </v-tab>
        <v-tab href="#tab-2">
          <v-icon class="mr-1">mdi-heart</v-icon>Name Exclude
        </v-tab>
        <v-tab href="#tab-3">
          <v-icon class="mr-1">mdi-playlist-remove</v-icon>Exclude
        </v-tab>
        <v-tab href="#tab-4">
          <v-icon class="mr-1">mdi-playlist-check</v-icon>Log Include
        </v-tab>
        <v-tab href="#tab-5">
          <v-icon class="mr-1">mdi-playlist-remove</v-icon>Log Exclude
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <v-tab-item value="tab-1">
          <v-container class="pt-4 pb-0">
            <v-btn @click="clientAdd = true" class="pl-2" color="orange lighten-2" outlined text>
              <v-icon class="mr-2">mdi-plus</v-icon>New
            </v-btn>
          </v-container>
          <v-card flat>
            <!--Client adder-->
            <v-dialog max-width="500" v-model="clientAdd">
              <v-card>
                <v-card-title>Add client</v-card-title>
                <v-container class="px-7">
                  <v-form>
                    <v-text-field label="Name" outlined required v-model="newClient.Name"></v-text-field>
                  </v-form>
                </v-container>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn @click="clientAdd = false;" color="darken-1" text>Cancel</v-btn>
                  <v-btn
                    :loading="clientLoader"
                    @click="addClient();"
                    color="indigo lighten-3"
                    text
                  >Add</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-list>
              <v-list-group
                :key="client.id"
                no-action
                sub-group
                v-for="client in clients"
                v-model="client.active"
                value="true"
              >
                <v-dialog max-width="500" v-if="client.Selected" v-model="client.Selected">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn class="mb-2" color="red" icon large v-bind="attrs" v-on="on">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <v-card>
                    <v-card-title>Do you really want to delete {{ client.Name }}?</v-card-title>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn @click="client.Selected = false" color="darken-1" text>Cancel</v-btn>
                      <v-btn
                        @click="client.Selected = false; deleteClient(client);"
                        color="red darken-1"
                        text
                      >Delete</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
                <template v-slot:activator>
                  <v-list-item-content>
                    <v-list-item-title>{{client.Name}}</v-list-item-title>
                  </v-list-item-content>
                </template>
                <v-list-item class="pl-6">
                  <v-container>
                    <v-row>
                      <v-switch
                        class="pl-2"
                        color="indigo lighten-2"
                        label="Can always receive jobs"
                        v-model="client.IgnoreOnline"
                      ></v-switch>
                    </v-row>
                    <v-layout class="pt-4 d-flex flex-wrap" row wrap>
                      <v-flex class="px-2" md4 sm6 xs12>
                        <v-text-field
                          :rules="[v => (v || '').indexOf(' ') < 0 || 'No spaces are allowed', v => !!v || 'Name is required']"
                          label="Name"
                          outlined
                          v-model="client.Name"
                        ></v-text-field>
                      </v-flex>
                      <v-flex class="px-2" md2 sm3 xs6>
                        <v-text-field
                          :rules="[v => !!v && v >= 0 || 'Must be set and positive']"
                          label="Priority"
                          outlined
                          type="number"
                          v-model.number="client.Priority"
                        ></v-text-field>
                      </v-flex>
                      <v-flex class="px-2" md2 sm3 xs6>
                        <v-text-field
                          :rules="[v => !!v && v >= 0 || 'Must be set and positive']"
                          label="Maximum Jobs"
                          outlined
                          type="number"
                          v-model.number="client.MaximumJobs"
                        ></v-text-field>
                      </v-flex>
                      <v-flex class="px-2" md2>
                        <v-menu
                          :close-on-content-click="false"
                          :nudge-right="40"
                          max-width="290px"
                          min-width="290px"
                          offset-y
                          transition="scale-transition"
                        >
                          <template v-slot:activator="{ on }">
                            <v-text-field
                              :value="client.AvailabilityStart"
                              label="Start Time"
                              outlined
                              readonly
                              v-on="on"
                            />
                          </template>
                          <v-time-picker
                            class="mt-4"
                            format="24hr"
                            min="0:00"
                            scrollable
                            v-model="client.AvailabilityStart"
                          />
                        </v-menu>
                      </v-flex>
                      <v-flex class="px-2" md2>
                        <v-menu
                          :close-on-content-click="false"
                          :nudge-right="40"
                          max-width="290px"
                          min-width="290px"
                          offset-y
                          transition="scale-transition"
                        >
                          <template v-slot:activator="{ on }">
                            <v-text-field
                              :value="client.AvailabilityEnd"
                              label="End Time"
                              outlined
                              readonly
                              v-on="on"
                            />
                          </template>
                          <v-time-picker
                            class="mt-4"
                            format="24hr"
                            min="0:00"
                            scrollable
                            v-model="client.AvailabilityEnd"
                          />
                        </v-menu>
                      </v-flex>
                    </v-layout>
                    <v-row justify="center">
                      <v-btn :loading="clientLoader" class="ml-2" color="indigo lighten-2" icon>
                        <v-icon @click="editClient(client)" size="30">mdi-content-save</v-icon>
                      </v-btn>
                      <v-btn :loading="clientLoader" class="ml-2" color="red lighten-2" icon>
                        <v-icon @click="client.Selected = true;" size="30">mdi-delete</v-icon>
                      </v-btn>
                    </v-row>
                  </v-container>
                </v-list-item>
              </v-list-group>
            </v-list>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-2">
          <v-card flat>
            <TextDataTable></TextDataTable>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-3">
          <v-card flat>
            <TextDataTable></TextDataTable>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-4">
          <v-card flat>
            <TextDataTable></TextDataTable>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-5">
          <v-card flat>
            <TextDataTable></TextDataTable>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </div>

  <!--
                    <v-menu
                      :nudge-right="40"
                      transition="scale-transition"
                      offset-y
                      max-width="290px"
                      min-width="290px"
                      :close-on-content-click="false"
                    >

                      <template v-slot:activator="{ on }">
                        <v-text-field
                          label="Start AM"
                          readonly
                          :value="settings.notification.startAm"
                          v-on="on"
                        />
                      </template>
                      <v-time-picker
                        v-model="settings.notification.startAm"
                        class="mt-4"
                        format="24hr"
                        scrollable
                        min="0:00"
                        :max="settings.notification.endAm"
                      />
  </v-menu>-->
</template>



<script>
export default {
  data: () => ({
    newClient: {
      ID: "",
      Name: "",
      AvailabilityStart: "0:00",
      AvailabilityEnd: "0:00",
      MaximumJobs: 10,
      Priority: 0,
      Online: false,
      IgnoreOnline: false,
    },
    url: "",
    err: null,
    clientAdd: false,
    clientLoader: false,
    tab: null,
    currentActiveCard: "",
    clients: [],
  }),
  async fetch() {
    await this.getClients();
  },
  fetchOnServer: false,
  methods: {
    timeout(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async editClient(client) {
      this.clientLoader = true;
      await this.timeout(300);
      delete client.Selected;
      delete client.active;
      try {
        let result = await this.$http.$put(`${this.url}/clients/`, client);
      } catch (err) {
        console.log(err);
      }
      await this.getClients();
      this.clientLoader = false;
    },
    async addClient() {
      console.log("helloooouuuuuu???!!");
      try {
        this.clientLoader = true;
        let result = await this.$http.$post(
          `${this.url}/clients/`,
          this.newClient
        );
        await this.timeout(300);
        this.newClient.Name = "";
        this.clientAdd = false;
      } catch (err) {
        console.log(err);
        this.err = err;
      }
      await this.getClients();
      this.clientLoader = false;
    },
    async deleteClient(client) {
      this.clientLoader = true;
      await this.timeout(300);
      this.clients.splice(this.clients.indexOf(client), 1);
      delete client.Selected;
      delete client.active;
      try {
        let result = await this.$http.$delete(
          `${this.url}/clients/${client.ID}`
        );
      } catch (err) {
        console.log(err);
      }
      await this.getClients();
      this.clientLoader = false;
    },
    getClients: async function () {
      let promises = [];
      const registeredClients = await this.$http.$get("api/clients/");
      let onlineClient;
      for (let c of registeredClients) {
        try {
          let promise = new Promise(async (resolve, reject) => {
            let response;
            try {
              response = await this.$http.$get(c.Address);
            } catch (err) {
              reject({ address: "none", response: {} });
              return;
            }
            resolve({ address: c.Address, response: response });
          });
          promises.push(promise);
        } catch (error) {
          console.log(`$failed to create promises: ${error}`);
        }
      }
      let resolution = await Promise.race(promises);
      if (resolution.address != "none") {
        this.url = resolution.address;
        let clients = await this.$http.$get(this.url + "/clients/");
        clients.forEach((c) => (c.Selected = false));
        this.clients = clients;
      }
    },
    getJobsForClient: function (client) {
      return this.jobs.filter((j) => {
        return client.ID === j.AssignedClient.ID;
      });
    },
    getJobs: async function () {
      this.jobs = await this.$http.$get(this.url + "/jobs/");
    },
  },
  mounted() {},
  props: {},
};
</script>

<style lang="scss" scoped>
.smol {
  max-width: 100px;
}
</style>