<template>
  <v-container>
    <div class="d-flex asfasdfasdf flex-wrap"></div>
    <v-row>
      <v-card class="mx-auto" width="100%">
        <v-list flat>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>

            <!-- Reassign -->
            <v-dialog v-model="reassignDialog" max-width="300">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :loading="reassigning"
                  :disabled="reassigning || selectedJobs.length === 0"
                  v-bind="attrs"
                  color="blue"
                  v-on="on"
                  class="mx-2"
                >Reassign {{ selectedJobs.length > 0 ? selectedJobs.length + " Jobs" : ""}}</v-btn>
              </template>
              <v-card>
                <v-list>
                  <v-list-item-group v-model="reassignToClient" color="primary">
                    <v-list-item v-for="(client, i) in clients" :key="i" :value="client">
                      <v-list-item-content>
                        <v-list-item-title>{{ client.Name }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="darken-1"
                    text
                    @click="reassignDialog = false; reassignToClient = null"
                  >Cancel</v-btn>
                  <v-btn
                    :disabled="!reassignToClient"
                    color="green darken-1"
                    text
                    @click="reassignDialog = false; reassignJobs();"
                  >{{ reassignToClient ? `Reassign to ${reassignToClient.Name}` : "Select Client" }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Add Job -->
            <v-dialog v-model="addJobDialog" max-width="500">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :loading="addingJob"
                  :disabled="addingJob"
                  v-bind="attrs"
                  color="blue"
                  v-on="on"
                  class="mx-2"
                >Add Job</v-btn>
              </template>
              <v-card>
                <v-container>
                  <v-form>
                    <v-text-field v-model="newJob.Path" label="Path" required></v-text-field>
                  </v-form>
                </v-container>

                <v-list>
                  <v-list-item-group v-model="reassignToClient" color="primary">
                    <v-list-item v-for="(client, i) in clients" :key="i" :value="client">
                      <v-list-item-content>
                        <v-list-item-title>{{ client.Name }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="darken-1"
                    text
                    @click="addJobDialog = false; reassignToClient = null"
                  >Cancel</v-btn>
                  <v-btn color="green darken-1" text @click="addJobDialog = false; reassignJobs();"></v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-list-item>
          <v-list v-if="reassignError.length > 0">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Following jobs could not be reassigned:</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-for="(err, i) in reassignError" :key="`error-${i}`">
              <v-list-item-content>
                <v-list-item-title>{{ err.Path }}</v-list-item-title>
                <v-list-item-subtitle>{{ err.Error }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-list-group v-for="(client, i) in clients" :key="`client-${i}`" sub-group>
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>
                  <v-icon class="pb-1" :color="client.Online ? 'green' : 'red'">mdi-power</v-icon>
                  {{ client.Name }}
                </v-list-item-title>
                <v-list-item-subtitle
                  v-text="client.Jobs ? `${client.Jobs.length} assigned` : '${client.Jobs.length} assigned'"
                ></v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <v-list-item-group v-if="client.Jobs.length > 0" :key="`job-all`">
              <v-list-item class="my-2" :value="client.SelectAll" @click="selectAllJobs(client)">
                <template v-slot:default="{}">
                  <v-list-item-action>
                    <v-checkbox :input-value="client.SelectAll" color="primary"></v-checkbox>
                  </v-list-item-action>
                  <v-list-item-content>
                    <v-list-item-title>{{client.SelectAll ? 'Deselect All' : 'Select All'}}</v-list-item-title>
                  </v-list-item-content>
                </template>
              </v-list-item>
            </v-list-item-group>
            <v-list-item class="my-2" v-for="(job, i) in client.Jobs" :key="`job-${i}`">
              <template v-slot:default="{ active }">
                <v-list-item-action>
                  <v-checkbox
                    :input-value="active"
                    multiple
                    v-model="selectedJobs"
                    :value="job"
                    color="primary"
                  ></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title class="text-wrap" v-text="getJobName(job)"></v-list-item-title>
                  <v-list-item-subtitle class="text-wrap">{{ job.Path }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-dialog max-width="1000" v-model="job.EditJobDialog">
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon v-bind="attrs" color="blue" v-on="on" class="mx-2">
                        <v-icon>mdi-circle-edit-outline</v-icon>
                      </v-btn>
                    </template>
                    <v-card>
                      <v-container>
                        <v-form>
                          <v-text-field label="Path" v-model="job.Path" :value="job.Path" required></v-text-field>
                          <v-text-field label="Name" v-model="job.Name" :value="job.Name" required></v-text-field>
                          <v-text-field
                            label="Subtitle"
                            v-model="job.Subtitle"
                            :value="job.Subtitle"
                            required
                          ></v-text-field>
                          <v-text-field
                            label="CustomParameters"
                            v-model="job.CustomParameters"
                            :value="job.CustomParameters"
                          ></v-text-field>
                          <v-select
                            :items="clients"
                            :item-text="'Name'"
                            :item-value="'ID'"
                            :value="'ID'"
                            v-model="job.AssignedClient.ID"
                            label="Client"
                            outlined
                          ></v-select>
                          <v-btn class="mr-4" @click="closeEditJobDialog(job)">Cancel</v-btn>
                          <v-btn
                            class="mr-4"
                            :loading="job.EditingJob"
                            :disabled="job.EditingJob"
                            color="green"
                            @click="updateJob(job)"
                          >Update Job</v-btn>
                        </v-form>
                      </v-container>
                    </v-card>
                  </v-dialog>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-card>
    </v-row>
  </v-container>
</template>


<script>
export default {
  data: () => ({
    reassigning: false,
    reassignError: [],
    reassignDialog: false,
    reassignToClient: null,
    addJobDialog: false,
    addingJob: false,
    newJob: {},
    selectedJobs: [],
    jobs: [],
    clients: [],
    url: "",
  }),
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  fetchOnServer: false,
  methods: {
    updateJob: async function (job) {
      this.$set(job, "EditJobDialog", true);
      this.$set(job, "EditingJob", true);
      try {
        await this.$http.$put(this.url + "/jobs/", job);
        await this.getClients();
      } catch (err) {
        console.log(err);
      }
      this.closeEditJobDialog(job);
    },
    closeEditJobDialog: function (job) {
      this.$set(job, "EditJobDialog", false);
      this.$set(job, "EditingJob", false);
    },
    reassignJobs: async function () {
      this.reassigning = true;
      let timeout;
      this.selectedJobs.forEach((j) => {
        j.AssignedClient.ID = this.reassignToClient.ID;
        j.AssignedClient.DB = "undefined";
        this.$http.$put(this.url + "/jobs/", j).catch((error) => {
          clearTimeout(timeout);
          this.reassignError.push({ Path: j.Path, Error: error });
          timeout = setTimeout(() => (this.reassignError = []), 5000);
        });
      });
      await this.getClients();
      this.reassigning = false;
      this.reassignToClient = null;
      this.selectedJobs = [];
    },
    selectAllJobs: function (client) {
      if (!client.SelectAll) {
        client.Jobs.forEach((j) => {
          if (!this.selectedJobs.includes(j)) {
            this.selectedJobs.push(j);
          }
        });
        client.SelectAll = true;
      } else {
        try {
          client.SelectAll = false;
          const jobs = this.selectedJobs.filter(
            (j) =>
              !client.Jobs.reduce((result, ele) => {
                result.push(ele.ID);
                return result;
              }, []).includes(j.ID)
          );
          this.selectedJobs = jobs;
        } catch (err) {
          console.log(`err: ${err}`);
        }
      }
    },
    getJobsForClient: function (client) {
      return this.jobs.filter((j) => {
        this.$set(j, "EditJobDialog", false);
        this.$set(j, "EditingJob", false);
        return client.ID === j.AssignedClient.ID;
      });
    },
    getJobName: function (job) {
      let jobName = job.Name;
      if (job.Subtitle !== "") {
        jobName += " - " + job.Subtitle;
      }
      return jobName;
    },
    addSelectedJob: function (job) {
      if (this.selectedJobs.includes(job)) {
        this.selectedJobs.splice(this.selectedJobs.indexOf(job), 1);
      } else {
        this.selectedJobs.push(job);
      }
    },
    getJobs: async function () {
      this.jobs = await this.$http.$get(this.url + "/jobs/");
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
        await this.getJobs();
        clients.sort((a, b) => (a.Online === b.Online ? 0 : a.Online ? -1 : 1));
        clients.forEach((c) => {
          c.Jobs = this.getJobsForClient(c);
          c.SelectAll = false;
        });
        this.clients = clients;
      }
    },
  },
};
</script>