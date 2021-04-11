<template>
  <div>
    <v-row
      class="mb-6 mt-10"
      justify="center"
      no-gutters
      v-if="$fetchState.pending"
    >
      <v-progress-circular
        :size="150"
        :width="20"
        color="indigo lighten-2"
        indeterminate
      ></v-progress-circular>
    </v-row>
    <v-row
      class="mb-6"
      justify="start"
      no-gutters
      v-else-if="$fetchState.error"
    >
      <p>No client reachable to marshal database operations</p>
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
          <v-icon class="mr-1">mdi-alphabetical-variant-off</v-icon>Name Exclude
        </v-tab>
        <v-tab href="#tab-3">
          <v-icon class="mr-1">mdi-alphabetical-off</v-icon>Sub Exclude
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
            <v-btn
              @click="clientAdd = true"
              class="pl-2"
              color="orange lighten-2"
              outlined
              text
            >
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
                    <v-text-field
                      label="Name"
                      outlined
                      required
                      v-model="newClient.Name"
                    ></v-text-field>
                  </v-form>
                </v-container>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="
                      clientAdd = false;
                      err = null;
                    "
                    color="darken-1"
                    text
                    >Cancel</v-btn
                  >
                  <v-btn
                    :loading="clientLoader"
                    @click="addClient()"
                    color="indigo lighten-3"
                    text
                    >Add</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- client list -->
            <v-list>
              <v-list-group
                :key="client.id"
                no-action
                sub-group
                v-for="client in clients"
                v-model="client.active"
                value="true"
              >
                <v-dialog
                  max-width="500"
                  v-if="client.Selected"
                  v-model="client.Selected"
                >
                  <v-card>
                    <v-card-title>Delete confirm</v-card-title>
                    <v-card-subtitle
                      >Do you really want to delete
                      {{ client.Name }}?</v-card-subtitle
                    >
                    <v-alert class="mx-5" v-if="err" type="error">{{
                      err
                    }}</v-alert>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        @click="
                          client.Selected = false;
                          err = null;
                        "
                        color="darken-1"
                        text
                        >Cancel</v-btn
                      >
                      <v-btn
                        @click="deleteClient(client)"
                        color="red darken-1"
                        text
                        >Delete</v-btn
                      >
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <!-- client list element -->
                <template v-slot:activator>
                  <v-list-item-content>
                    <v-list-item-title>{{ client.Name }}</v-list-item-title>
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
                          :rules="[
                            (v) =>
                              (v || '').indexOf(' ') < 0 ||
                              'No spaces are allowed',
                            (v) => !!v || 'Name is required',
                          ]"
                          label="Name"
                          outlined
                          v-model="client.Name"
                        ></v-text-field>
                      </v-flex>
                      <v-flex class="px-2" md2 sm3 xs6>
                        <v-text-field
                          :rules="[
                            (v) =>
                              (!!v && v >= 0) || 'Must be set and positive',
                          ]"
                          label="Priority"
                          outlined
                          type="number"
                          v-model.number="client.Priority"
                        ></v-text-field>
                      </v-flex>
                      <v-flex class="px-2" md2 sm3 xs6>
                        <v-text-field
                          :rules="[
                            (v) =>
                              (!!v && v >= 0) || 'Must be set and positive',
                          ]"
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
                      <v-btn
                        :loading="clientLoader"
                        class="ml-2"
                        color="indigo lighten-2"
                        icon
                      >
                        <v-icon @click="editClient(client)" size="30"
                          >mdi-content-save</v-icon
                        >
                      </v-btn>
                      <v-btn
                        :loading="clientLoader"
                        class="ml-2"
                        color="red lighten-2"
                        icon
                      >
                        <v-icon @click="client.Selected = true" size="30"
                          >mdi-delete</v-icon
                        >
                      </v-btn>
                    </v-row>
                  </v-container>
                </v-list-item>
              </v-list-group>
            </v-list>
          </v-card>
        </v-tab-item>

        <!-- Include and exclude lists -->
        <v-tab-item value="tab-2">
          <v-card flat>
            <v-btn
              outlined
              text
              @click="
                importDialog = true;
                importType = 'name_exclude';
              "
              color="orange lighten-2"
              class="ml-4 mt-3"
              >Import</v-btn
            >
            <v-btn
              outlined
              text
              @click="
                exportType = 'name_exclude';
                exportConfig();
              "
              color="orange lighten-2"
              class="mt-3"
              >Export</v-btn
            >
            <TextDataTable
              @newdata="modifyFields($event, 'name_exclude')"
              v-model="nameExcludes"
            ></TextDataTable>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-3">
          <v-btn
            outlined
            text
            @click="
              importDialog = true;
              importType = 'sub_exclude';
            "
            color="orange lighten-2"
            class="ml-4 mt-3"
            >Import</v-btn
          >
          <v-btn
            outlined
            text
            @click="
              exportType = 'sub_exclude';
              exportConfig();
            "
            color="orange lighten-2"
            class="mt-3"
            >Export</v-btn
          >
          <v-card flat>
            <TextDataTable
              @newdata="modifyFields($event, 'sub_exclude')"
              v-model="subExcludes"
            ></TextDataTable>
          </v-card>
        </v-tab-item>

        <v-tab-item value="tab-4">
          <v-card flat>
            <v-btn
              outlined
              text
              @click="
                importDialog = true;
                importType = 'log_include';
              "
              color="orange lighten-2"
              class="ml-4 mt-3"
              >Import</v-btn
            >
            <v-btn
              outlined
              text
              @click="
                exportType = 'log_include';
                exportConfig();
              "
              color="orange lighten-2"
              class="mt-3"
              >Export</v-btn
            >
            <TextDataTable
              @newdata="modifyFields($event, 'log_include')"
              v-model="logIncludes"
            ></TextDataTable>
          </v-card>
        </v-tab-item>
        <v-tab-item value="tab-5">
          <v-card flat>
            <v-btn
              outlined
              text
              @click="
                importDialog = true;
                importType = 'log_exclude';
              "
              color="orange lighten-2"
              class="ml-4 mt-3"
              >Import</v-btn
            >
            <v-btn
              outlined
              text
              @click="
                exportType = 'log_exclude';
                exportConfig();
              "
              color="orange lighten-2"
              class="mt-3"
              >Export</v-btn
            >
            <TextDataTable
              @newdata="modifyFields($event, 'log_exclude')"
              v-model="logExcludes"
            ></TextDataTable>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <v-dialog v-if="importDialog" v-model="importDialog" max-width="500">
      <v-card>
        <v-card-title>
          Paste your fields here!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle
          >Your changes are saved as soon as you hit Import</v-card-subtitle
        >
        <v-container>
          <v-textarea
            outlined
            label="Import"
            name="Import"
            placeholder="One entry per line please"
            :error-messages="importError"
            v-model="importContent"
          ></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="darken-1"
            text
            @click="
              importDialog = false;
              importContent = '';
            "
            >Cancel</v-btn
          >
          <v-btn
            color="green"
            :loading="importLoader"
            :disabled="importLoader"
            text
            @click="importConfig"
            >Import</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-if="exportDialog" v-model="exportDialog" max-width="500">
      <v-card>
        <v-card-title>
          Here's your configuration in a json format!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle
          >DatabaseURL is omitted and can only be set from the client
          machine</v-card-subtitle
        >
        <v-container>
          <v-textarea
            outlined
            label="Export"
            rows="12"
            v-model="exportContent"
            name="Export"
          ></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="darken-1"
            text
            @click="
              exportDialog = false;
              exportType = '';
            "
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-overlay :value="deleting">
      <v-progress-circular
        :value="deleteProgress"
        width="15"
        size="150"
      ></v-progress-circular>
    </v-overlay>
  </div>
</template>



<script>
import any from "promise.any";

export default {
  data: () => ({
    deleting: false,
    deleteProgress: 0,
    importDialog: false,
    importContent: "",
    importType: "",
    importError: "",
    importLoader: false,
    exportDialog: false,
    exportContent: "",
    exportType: "",
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
    nameExcludes: [],
    subExcludes: [],
    logExcludes: [],
    logIncludes: [],
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
    await this.getFields();
  },
  fetchOnServer: false,
  computed: {
    nameExcludesValues() {
      return this.nameExcludes.map((f) => f.Value);
    },
    subExcludesValues() {
      return this.subExcludes.map((f) => f.Value);
    },
    logExcludesValues() {
      return this.logExcludes.map((f) => f.Value);
    },
    logIncludesValues() {
      return this.logIncludes.map((f) => f.Value);
    },
  },
  methods: {
    async importConfig() {
      try {
        this.importLoader = true;
        setTimeout(() => {
          this.importLoader = false;
        }, 400);
        let content = this.importContent.split("\n").filter((c) => c != "");
        content = content.map((f) => ({ Value: f }));
        console.log(content);
        this.importError = "";
        await this.$http.$post(
          `${this.url}/fields/${this.importType}/`,
          content
        );
        this.reloadData(this.importType);
        this.importType = "";
        this.importDialog = false;
        this.importContent = "";
      } catch (err) {
        this.importError = err.toString();
      }
    },
    exportConfig() {
      console.log(this.exportType);
      this.exportDialog = true;
      switch (this.exportType) {
        case "name_exclude":
          this.exportContent = this.nameExcludesValues.join("\n");
          break;
        case "sub_exclude":
          this.exportContent = this.subExcludesValues.join("\n");
          break;
        case "log_exclude":
          this.exportContent = this.logExcludesValues.join("\n");
          break;
        case "log_include":
          this.exportContent = this.logIncludesValues.join("\n");
          break;
      }
    },
    async modifyFields(event, fieldType) {
      console.log("emitted " + event);
      switch (event.mode) {
        case "create":
          try {
            await this.$http.$post(`${this.url}/fields/${fieldType}/`, [
              event.obj,
            ]);
            await this.reloadData(fieldType);
          } catch (err) {
            console.error(err);
          }
          break;
        case "update":
          try {
            await this.$http.$put(`${this.url}/fields/${fieldType}/`, [
              event.obj,
            ]);
          } catch (err) {
            console.error(err);
          }
          break;
        case "delete":
          console.log(event);
          try {
            await this.$http.$delete(
              `${this.url}/fields/${fieldType}/${event.obj.ID}/`
            );
            await this.reloadData(fieldType);
          } catch (err) {
            console.error(err);
          }
          break;
        case "deleteMany":
          this.deleteProgress = 0;
          this.deleting = true;
          console.log(event);
          try {
            for (const [idx, obj] of event.ary.entries()) {
              await this.$http.$delete(
                `${this.url}/fields/${fieldType}/${obj.ID}/`
              );
              if (idx % 5 == 0) {
                this.deleteProgress = Math.round(
                  (idx / event.ary.length) * 100
                );
              }
            }
            this.deleteProgress = 100;
            await this.reloadData(fieldType);
            setTimeout(() => {
              this.deleting = false;
            }, 500);
          } catch (err) {
            console.error(err);
          }
          break;
      }
    },
    async getFields() {
      try {
        this.nameExcludes = await this.$http.$get(
          `${this.url}/fields/name_exclude/`
        );
        this.subExcludes = await this.$http.$get(
          `${this.url}/fields/sub_exclude/`
        );
        this.logExcludes = await this.$http.$get(
          `${this.url}/fields/log_exclude/`
        );
        this.logIncludes = await this.$http.$get(
          `${this.url}/fields/log_include/`
        );
      } catch (err) {
        console.error(err);
      }
    },
    async reloadData(type) {
      console.log("fetching reload data for " + type);
      switch (type) {
        case "name_exclude":
          try {
            this.nameExcludes = await this.$http.$get(
              `${this.url}/fields/${type}/`
            );
            console.log("name excludes: ", this.nameExcludes);
          } catch (err) {
            console.error(err);
          }
          break;
        case "sub_exclude":
          try {
            this.subExcludes = await this.$http.$get(
              `${this.url}/fields/${type}/`
            );
          } catch (err) {
            console.error(err);
          }
          break;
        case "log_exclude":
          try {
            this.logExcludes = await this.$http.$get(
              `${this.url}/fields/${type}/`
            );
          } catch (err) {
            console.error(err);
          }
          break;
        case "log_include":
          try {
            this.logIncludes = await this.$http.$get(
              `${this.url}/fields/${type}/`
            );
          } catch (err) {
            console.error(err);
          }
          break;
      }
    },
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
      this.err = null;
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
      this.err = null;
      const jobs = await this.getJobsForClient(client);
      if (jobs.length > 0) {
        this.err = `This client still has ${jobs.length} jobs. Please reassign them first!`;
        return;
      }
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
      client.Selected = false;
    },
    resolveClients: async function () {
      const unresolvedClients = await this.$http.$get("api/clients");
      let promises = [];
      for (let client of unresolvedClients) {
        for (let address of client.Addresses) {
          console.log(address);
          try {
            let promise = new Promise(async (resolve, reject) => {
              let response;
              try {
                response = await this.$http.$get(address + "/alive");
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
      }
      any.shim();
      return await Promise.any(promises);
    },
    getClients: async function () {
      let resolution = await this.resolveClients();
      if (resolution.address != "none") {
        this.url = resolution.address;
        let clients = await this.$http.$get(this.url + "/clients/");
        clients.forEach((c) => (c.Selected = false));
        this.clients = clients;
      }
    },
    getJobsForClient: async function (client) {
      const jobs = await this.getJobs();
      return jobs.filter((j) => {
        return client.ID === j.AssignedClient.ID;
      });
    },
    getJobs: async function () {
      return this.$http.$get(this.url + "/jobs/");
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