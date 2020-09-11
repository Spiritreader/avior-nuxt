<template>
  <v-container>
    <div class="d-flex flex-wrap"></div>
    <v-row>
      <v-card class="mx-auto" width="100%">
        <v-list flat>
          <!-- Start Buttons -->
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-container class>
              <!-- Begin Reassign -->
              <v-dialog v-model="reassignDialog" max-width="300">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :loading="reassigning"
                    :disabled="reassigning || selectedJobs.length === 0"
                    v-bind="attrs"
                    color="blue"
                    v-on="on"
                    class="ma-2"
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
              <!-- End Reassign -->
              <!-- Begin Add Job -->
              <v-dialog v-model="addJobDialog" max-width="500">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :loading="addingJob"
                    :disabled="addingJob"
                    v-bind="attrs"
                    color="blue"
                    v-on="on"
                    class="ma-2"
                  >Add Job</v-btn>
                </template>
                <v-card>
                  <v-container>
                    <v-form v-if="!addJobsDialog">
                      <v-text-field label="Path" v-model="newJob.Path" required></v-text-field>
                      <v-text-field label="Name" v-model="newJob.Name" required></v-text-field>
                      <v-text-field label="Subtitle" v-model="newJob.Subtitle" required></v-text-field>
                      <v-text-field label="Custom Parameters" v-model="newJob.CustomParameters"></v-text-field>
                      <v-select
                        :items="clients"
                        :item-text="'Name'"
                        :item-value="'ID'"
                        v-model="newJob.AssignedClient.ID"
                        label="Client"
                        outlined
                      ></v-select>
                      <v-btn class="mr-2 my-2" @click="addJobDialog = false; clearNewJob();">Cancel</v-btn>
                      <v-btn
                        class="mr-6"
                        :loading="addingJob"
                        :disabled="addingJob"
                        color="green"
                        @click="addJob();"
                      >Add Job</v-btn>
                      <v-btn
                        color="blue darken-1"
                        class="mr-6 my-2"
                        @click="addJobsDialog = true;"
                      >JSON</v-btn>
                    </v-form>
                    <!-- Begin Add Multiple Jobs -->
                    <v-form v-else>
                      <v-textarea
                        label="JSON"
                        :error-messages="newJobsError"
                        v-model="newJobs"
                        rows="12"
                      ></v-textarea>
                      <v-btn
                        class="mr-4"
                        @click="addJobDialog = false; addJobsDialog = false; resetJsonJobs();"
                      >Cancel</v-btn>
                      <v-btn
                        class="mr-4"
                        :loading="addingJobs"
                        :disabled="addingJobs"
                        color="green"
                        @click="addJobs();"
                      >Add Jobs</v-btn>
                      <v-btn
                        color="blue darken-1"
                        class="mr-6 my-2"
                        @click="addJobsDialog = false;"
                      >Job Form</v-btn>
                    </v-form>
                    <!-- End Add Multiple Jobs-->
                  </v-container>
                </v-card>
              </v-dialog>
            </v-container>
          </v-list-item>
          <!-- End Buttons -->

          <!-- Begin Reassign Error -->
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
          <!-- End Reassign Error -->

          <!-- Begin Client List -->
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
              <v-list-item :value="client.SelectAll" @click="selectAllJobs(client)">
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
            <!-- Begin Job List -->
            <v-list-item v-for="(job, i) in client.Jobs" :key="`job-${i}`" class="box-width">
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

                <v-list-item-content class="text-wrap">
                  <v-list-item-title class="text-wrap" v-text="getJobName(job)"></v-list-item-title>
                  <v-list-item-subtitle class="text-wrap">{{ job.Path }}</v-list-item-subtitle>
                </v-list-item-content>
                <!-- Begin CRUD -->
                <v-list-item-action class="flex-sm-row flex-column align-center justify-center">
                  <!-- Begin Update -->
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
                            label="Custom Parameters"
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
                  <!-- End Update -->
                  <!-- Begin Delete -->
                  <v-dialog max-width="500" v-model="job.DeleteJobDialog">
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon v-bind="attrs" color="blue" v-on="on" class="mx-2">
                        <v-icon>mdi-delete-circle-outline</v-icon>
                      </v-btn>
                    </template>
                    <v-card>
                      <v-card-title>Delete Job</v-card-title>
                      <v-card-text>Do you really want to delete the following job?</v-card-text>
                      <v-card-text>
                        <v-list-item
                          v-for="(value, key) in filteredJob(job)"
                          :key="`${key}-${i}`"
                          two-line
                        >
                          <v-list-item-content>
                            <v-list-item-title class="text-wrap">{{key}}</v-list-item-title>
                            <v-list-item-subtitle class="text-wrap">{{value}}</v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn class="mr-4" @click="closeDeleteJobDialog(job)">Cancel</v-btn>
                        <v-btn
                          class="mr-4"
                          :loading="job.DeleteJob"
                          :disabled="job.DeleteJob"
                          color="red"
                          @click="deleteJob(job)"
                        >Delete Job</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                  <!-- End Delete -->
                </v-list-item-action>
                <!-- End CRUD -->
              </template>
            </v-list-item>
          </v-list-group>
          <!-- End Job List -->
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
    newJobs: `[
  {
    "ID": ""
    "Path": "",
    "Name": "",
    "Subtitle": "",
    "CustomParameters": null,
    "AssignedClient": {
      "Ref": "clients",
      "ID": "",
      "DB": "undefined"
    }
  }
]`,
    newJobsError: "",
    addingJobs: false,
    addJobsDialog: false,
    newJob: {
      Path: "",
      Name: "",
      Subtitle: "",
      CustomParameters: null,
      AssignedClient: {
        Ref: "clients",
        ID: "",
        DB: "undefined",
      },
    },
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
    filteredJob: function (job) {
      const filter = [
        "EditJobDialog",
        "EditingJob",
        "DeleteJobDialog",
        "DeleteJob",
      ];
      const filtered = Object.keys(job)
        .filter((key) => !filter.includes(key))
        .reduce((obj, key) => {
          obj[key] = job[key];
          return obj;
        }, {});
      return filtered;
    },
    clearNewJob: function () {
      this.newJob = {
        Path: "",
        Name: "",
        Subtitle: "",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "",
          DB: "undefined",
        },
      };
    },
    resetJsonJobs: function () {
      this.newJobs = `[
  {
    "ID": ""
    "Path": "",
    "Name": "",
    "Subtitle": "",
    "CustomParameters": null,
    "AssignedClient": {
      "Ref": "clients",
      "ID": "",
      "DB": "undefined"
    }
  }
]`;
    },
    addJobs: async function () {
      this.addingJobs = true;
      const promises = [];
      try {
        const parsedJobs = JSON.parse(this.newJobs);
        this.newJobsError = "";
        parsedJobs.forEach((job) => {
          promises.push(this.$http.$post(this.url + "/jobs/", job));
        });
        try {
          await Promise.all(promises);
          await this.getClients();
          this.resetJsonJobs();
        } catch (err) {
          console.error(err);
        }
        this.addingJobs = false;
        this.addJobsDialog = false;
      } catch (error) {
        console.error(error);
        this.newJobsError = "Invalid JSON!";
        this.addingJobs = false;
      }
    },
    addJob: async function () {
      this.addingJob = true;
      try {
        await this.$http.$post(this.url + "/jobs/", this.newJob);
        await this.getClients();
        this.clearNewJob();
      } catch (err) {
        console.error(err);
      }
      this.addingJob = false;
      this.addJobDialog = false;
    },
    updateJob: async function (job) {
      this.$set(job, "EditJobDialog", true);
      this.$set(job, "EditingJob", true);
      try {
        await this.$http.$put(this.url + "/jobs/", job);
        await this.getClients();
      } catch (err) {
        console.error(err);
      }
      this.closeEditJobDialog(job);
    },
    deleteJob: async function (job) {
      this.$set(job, "DeleteJobDialog", true);
      this.$set(job, "DeleteJob", true);
      try {
        console.log(JSON.stringify(job));
        await this.$http.$delete(`${this.url}/jobs/${job.ID}`);
        await this.getClients();
      } catch (err) {
        console.error(err);
      }
      this.closeDeleteJobDialog(job);
    },
    closeEditJobDialog: function (job) {
      this.$set(job, "EditJobDialog", false);
      this.$set(job, "EditingJob", false);
    },
    closeDeleteJobDialog: function (job) {
      this.$set(job, "DeleteJobDialog", false);
      this.$set(job, "DeleteJob", false);
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
        this.$set(j, "DeleteJobDialog", false);
        this.$set(j, "DeleteJob", false);
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
<style lang="scss">
@media only screen and (min-width: 300px) {
  .box-width {
    width: 60%;
  }
}
@media only screen and (min-width: 350px) {
  .box-width {
    width: 70%;
  }
}
@media only screen and (min-width: 450px) {
  .box-width {
    width: 90%;
  }
}
@media only screen and (min-width: 540px) {
  .box-width {
    width: 100%;
  }
}
</style>