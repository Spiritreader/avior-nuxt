<template>
  <v-container>
    <div class="d-flex asfasdfasdf flex-wrap"></div>
    <v-row>
      <v-card class="mx-auto" width="100%">
        <v-list>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>

            <!-- Reassign -->
            <v-dialog v-model="reassignDialog" max-width="300">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  :loading="reassigning"
                  :disabled="reassigning || !selectedJobs"
                  v-bind="attrs"
                  color="blue"
                  v-on="on"
                  class="mx-2"
                >Reassign {{ selectedJobs ? selectedJobs.length + " Jobs" : ""}}</v-btn>
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
                    @click="reassignDialog = false; reassignToClient = {}"
                  >Cancel</v-btn>
                  <v-btn
                    color="green darken-1"
                    text
                    @click="reassignDialog = false; reassignJobs();"
                  >Reassign to {{reassignToClient.Name}}</v-btn>
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
                    @click="addJobDialog = false; reassignToClient = {}"
                  >Cancel</v-btn>
                  <v-btn
                    color="green darken-1"
                    text
                    @click="addJobDialog = false; reassignJobs();"
                  >Reassign to {{reassignToClient.Name}}</v-btn>
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
                  <v-icon :color="client.Online ? 'green' : 'red'">mdi-power</v-icon>
                  {{ client.Name }}
                </v-list-item-title>
                <v-list-item-subtitle v-text="client.Jobs ? client.Jobs.length : 0"></v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <v-list-item-group
              v-model="selectedJobs"
              :key="`job-all`"
            >
              <v-list-item class="my-2" :value="client.Jobs">
                <template v-slot:default="{ active }">
                  <v-list-item-action>
                    <v-checkbox :input-value="active" color="primary"></v-checkbox>
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title class="text-wrap">Select All</v-list-item-title>
                  </v-list-item-content>
                </template>
              </v-list-item>
            </v-list-item-group>
            <v-list-item-group
              v-for="(job, i) in client.Jobs"
              v-model="selectedJobs"
              multiple
              :key="`job-${i}`"
            >
              <v-list-item class="my-2" :value="job">
                <template v-slot:default="{ active }">
                  <v-list-item-action>
                    <v-checkbox :input-value="active" color="primary"></v-checkbox>
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title class="text-wrap" v-text="getJobName(job)"></v-list-item-title>
                    <v-list-item-subtitle class="text-wrap">{{ job.Path }}</v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-list-item>
            </v-list-item-group>
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
    reassignToClient: {},
    addJobDialog: false,
    addingJob: false,
    selectedJobs: [],
    jobs: [],
    clients: [],
    url: "",
  }),
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  methods: {
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
      this.reassignToClient = {};
    },
    selectAllJobs: function(client) {
      if (client.Selec)
      client.Jobs.forEach((j) => {
        this.selectedJobs.push(j);
      });
    },
    getJobsForClient: function (client) {
      // this might return undefined if there is no client matching the AssignedClient.ID of the job
      return this.jobs.filter((j) => client.ID === j.AssignedClient.ID);
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
      const registeredClients = await this.$http.$get("api/clients/");
      let onlineClient;
      let clients;
      for (let c of registeredClients) {
        this.url = c.Address;
        try {
          clients = await this.$http.$get(this.url + "/clients/");
          break;
        } catch (error) {
          console.log(`${c.Name} is not online.`);
        }
      }
      await this.getJobs();
      clients.sort((a, b) => (a.Online === b.Online ? 0 : a.Online ? -1 : 1));
      clients.forEach((c) => {
        c.Jobs = this.getJobsForClient(c);
        c.SelectAll = false;
      });
      this.clients = clients;
    },
  },
};
</script>