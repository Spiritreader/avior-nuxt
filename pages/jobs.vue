<template>
  <v-container fluid>
    <v-row class="mb-6 mt-10" justify="center" no-gutters v-if="$fetchState.pending">
      <v-progress-circular :size="150" :width="20" color="light-green darken-3" indeterminate></v-progress-circular>
    </v-row>
    <v-row class="mb-6" justify="start" no-gutters v-else-if="$fetchState.error">
      <p>No client reachable to marshal database operations</p>
    </v-row>
    <v-row v-else>
      <v-card class="mx-auto" width="100%">
        <v-system-bar color="light-green darken-3" :window="true">
          <span>{{ jobs.length }} job{{ s2 }} left to process</span>
          <v-spacer></v-spacer>
        </v-system-bar>
        <v-list flat>
          <!-- Begin Buttons -->
          <v-list-item>
            <v-list-item-icon class="pl-4 pt-3">
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-container class>
              <!-- Begin Add Job -->
              <v-dialog v-model="addJobDialog" max-width="500">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn :loading="addingJob" :disabled="addingJob" v-bind="attrs" color="blue" v-on="on" outlined class="ma-2 pl-2">
                    <v-icon class="mr-2">mdi-plus</v-icon>New
                  </v-btn>
                </template>
                <v-card>
                  <v-container>
                    <v-form v-if="!addJobsDialog">
                      <v-text-field label="Path" v-model="newJob.Path" required></v-text-field>
                      <v-text-field label="Name" v-model="newJob.Name" required></v-text-field>
                      <v-text-field label="Subtitle" v-model="newJob.Subtitle" required></v-text-field>
                      <v-textarea label="Custom Parameters" v-model="newJob.CustomParameters"></v-textarea>
                      <v-select
                        :items="clients"
                        :item-text="'Name'"
                        :item-value="'ID'"
                        v-model="newJob.AssignedClient.ID"
                        label="Client"
                        outlined
                      ></v-select>
                      <v-btn
                        class="mr-2 my-2"
                        @click="
                          addJobDialog = false;
                          clearNewJob();
                        "
                        >Cancel</v-btn
                      >
                      <v-btn class="mr-6" :loading="addingJob" :disabled="addingJob" outlined color="green" @click="addJob()"
                        >Add Job</v-btn
                      >
                      <v-btn outlined color="blue darken-1" class="mr-6 my-2" @click="addJobsDialog = true">JSON</v-btn>
                    </v-form>
                    <!-- Begin Add Multiple Jobs -->
                    <v-form v-else>
                      <v-textarea label="JSON" :error-messages="newJobsError" v-model="newJobs" rows="12"></v-textarea>
                      <v-btn
                        class="mr-4"
                        @click="
                          addJobDialog = false;
                          addJobsDialog = false;
                          resetJsonJobs();
                        "
                        >Cancel</v-btn
                      >
                      <v-btn outlined class="mr-4" :loading="addingJobs" :disabled="addingJobs" color="green" @click="addJobsFromJson()"
                        >Add Jobs</v-btn
                      >
                      <v-btn outlined color="blue darken-1" class="mr-6 my-2" @click="addJobsDialog = false">Job Form</v-btn>
                    </v-form>
                    <!-- End Add Multiple Jobs-->
                  </v-container>
                </v-card>
              </v-dialog>
              <!-- End Add Job -->
              <!-- Begin Reassign -->
              <v-dialog v-model="reassignDialog" max-width="300">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :loading="reassigning"
                    :disabled="reassigning || howManyJobsAreSelectedQuestionmark === 0"
                    v-bind="attrs"
                    outlined
                    color="blue"
                    v-on="on"
                    class="ma-2"
                    >Reassign {{ howManyJobsAreSelectedQuestionmark > 0 ? howManyJobsAreSelectedQuestionmark + " Job" + s : "" }}</v-btn
                  >
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
                      @click="
                        reassignDialog = false;
                        reassignToClient = null;
                      "
                      >Cancel</v-btn
                    >
                    <v-btn
                      :disabled="!reassignToClient"
                      color="green darken-1"
                      text
                      @click="
                        reassignDialog = false;
                        reassignJobs();
                      "
                      >{{ reassignToClient ? `Reassign to ${reassignToClient.Name}` : "Select Client" }}</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <!-- End Reassign -->
              <!-- Begin Delete Selected Jobs -->
              <v-dialog max-width="500" v-model="deleteSelectedJobsDialog">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    :loading="deletingSelectedJobs"
                    :disabled="deletingSelectedJobs || howManyJobsAreSelectedQuestionmark === 0"
                    v-bind="attrs"
                    color="red"
                    v-on="on"
                    outlined
                    class="ma-2 pl-2"
                  >
                    <v-icon class="mr-2">mdi-delete</v-icon>
                    Delete
                    {{ selectedJobs.length > 0 ? selectedJobs.length + " Jobs" : "" }}
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title>Delete Selected Jobs</v-card-title>
                  <v-card-text>Do you really want to delete the following jobs?</v-card-text>
                  <v-card-text v-if="Object.keys(selectedJobs).length > 0">
                    <v-list-item
                      v-for="(value, idx) in Object.values(selectedJobs).reduce((flat, ary) => flat.concat(ary))"
                      :key="`job-${idx}`"
                      two-line
                    >
                      <v-list-item-content>
                        <v-list-item-title class="text-wrap">{{ getJobName(value) }}</v-list-item-title>
                        <v-list-item-subtitle class="text-wrap">{{ value.Path }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn class="mr-4" @click="deleteSelectedJobsDialog = false">Cancel</v-btn>
                    <v-btn
                      outlined
                      class="mr-4"
                      :loading="deletingSelectedJobs"
                      :disabled="deletingSelectedJobs"
                      color="red"
                      @click="deleteSelectedJobs()"
                      >Delete Jobs</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <!-- End Delete Selected Jobs -->
            </v-container>
          </v-list-item>
          <!-- End Buttons -->

          <!-- Begin Reassign Error -->
          <v-list v-if="reassignError > 0">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="error pa-2"
                  >{{ reassignError }} job{{ reassignError > 1 ? "s" : "" }} could not be reassigned</v-list-item-title
                >
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
                <v-list-item-subtitle>{{ client.Jobs ? `${client.Jobs.length} assigned` : "0 assigned" }}</v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <!-- Begin Job List -->
            <JobDataTable
              :currentClient="client"
              :clients="clients"
              v-on:deletejob="deleteJob"
              v-on:updateselected="updateJobSelection"
              v-on:editJobDialog="setEditItem"
            />
          </v-list-group>
          <!-- End Job List -->

          <!-- Begin Single Element Update Dialog -->
          <v-dialog max-width="1000" v-model="editItem.EditJobDialog">
            <v-card>
              <v-container>
                <v-form>
                  <v-text-field label="Path" v-model="editItem.Path" :value="editItem.Path" required></v-text-field>
                  <v-text-field label="Name" v-model="editItem.Name" :value="editItem.Name" required></v-text-field>
                  <v-text-field label="Subtitle" v-model="editItem.Subtitle" :value="editItem.Subtitle" required></v-text-field>
                  <v-textarea label="Custom Parameters" v-model="editItem.CustomParameters" :value="editItem.CustomParameters"></v-textarea>
                  <v-select
                    :items="clients"
                    :item-text="'Name'"
                    :item-value="'ID'"
                    :value="'ID'"
                    v-model="editItem.AssignedClient.ID"
                    label="Client"
                    outlined
                  ></v-select>
                  <v-btn class="mr-4" @click="closeEditJobDialog(editItem)">Cancel</v-btn>
                  <v-btn
                    class="mr-4"
                    :loading="editItem.EditingJob"
                    :disabled="editItem.EditingJob"
                    outlined
                    color="green"
                    @click="updateJob(editItem)"
                    >Update Job</v-btn
                  >
                </v-form>
              </v-container>
            </v-card>
          </v-dialog>
          <!-- End Single Element Update Dialog -->
        </v-list>
      </v-card>
    </v-row>
  </v-container>
</template>


<script>
import any from "promise.any";

export default {
  data: () => ({
    reassigning: false,
    reassignError: 0,
    reassignDialog: false,
    reassignToClient: null,
    deletingSelectedJobs: false,
    deleteSelectedJobsDialog: false,
    addJobDialog: false,
    addingJob: false,
    howManyJobsAreSelectedQuestionmark: 0,
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
    selectedJobs: {},
    jobs: [],
    clients: [],
    url: "",

    // edit item data
    editItem: {
        Path: "",
        Name: "",
        Subtitle: "",
        CustomParameters: "",
        AssignedClient: {
          ID: "",
          Name: "",
        },
        EditJobDialog: false,
        EditingJob: false,
        DeleteJobDialog: false,
        DeletingJob: false,
      },
  }),
  computed: {
    s() {
      if (this.howManyJobsAreSelectedQuestionmark > 1) {
        return "s";
      }
      return "";
    },
    s2() {
      if (this.jobs.length > 1) {
        return "s";
      } else {
        return "";
      }
    },
  },
  async fetch() {
    console.log("fetching");
    await this.getClients();
  },
  fetchOnServer: false,
  methods: {
    calculateHowManyJobsAreSelectedQuestionmark() {
      let amount = 0;
      for (const selectedRows of Object.values(this.selectedJobs)) {
        amount += selectedRows.length;
      }
      return amount;
    },
    /**
     * Removes all object keys within the filter, such that a job object only contains relevant keys to be displayed for rendering
     */
    filteredJob: function (job) {
      const filter = ["EditJobDialog", "EditingJob", "DeleteJobDialog", "DeleteJob"];
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
    addJobsFromJson: async function () {
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
        this.addJobDialog = false;
      } catch (error) {
        console.error(error);
        this.newJobsError = `Invalid JSON: ${error.toString()}`;
        this.addingJobs = false;
        this.selectedJobs = {};
      }
    },
    addJob: async function () {
      this.addingJob = true;
      const job = JSON.parse(JSON.stringify(this.newJob));
      if (job.CustomParameters && job.CustomParameters !== "") {
        job.CustomParameters = job.CustomParameters.split("\n");
      } else {
        job.CustomParameters = null;
      }
      try {
        await this.$http.$post(this.url + "/jobs/", job);
        await this.getClients();
        this.clearNewJob();
      } catch (err) {
        // TODO make this an error in the ui
        console.log("error inserting job");
        console.error(err);
      }
      this.addingJob = false;
      this.addJobDialog = false;
      this.selectedJobs = {};
    },
    updateJob: async function (job) {
      this.$set(job, "EditingJob", true);
      const jobToSend = this.filteredJob(job);
      if (job.CustomParameters && jobToSend.CustomParameters !== "") {
        jobToSend.CustomParameters = jobToSend.CustomParameters.split("\n");
      } else {
        jobToSend.CustomParameters = null;
      }
      try {
        await this.$http.$put(this.url + "/jobs/", jobToSend);
        await this.getClients();
      } catch (err) {
        console.error(err);
      }
      this.$set(job, "EditingJob", false);
      this.$set(job, "EditJobDialog", false);
    },
    closeEditJobDialog: function (job) {
      this.$set(job, "EditJobDialog", false);
      this.$set(job, "EditingJob", false);
    },
    setEditItem: function (job) {
      job.EditJobDialog = true;
      this.editItem = job;
    },
    deleteJobNoRefresh: async function (job) {
      try {
        await this.$http.$delete(`${this.url}/jobs/${job.ID}`);
      } catch (err) {
        console.error(err);
        console.log(`retrying ${job.ID}`);
        try {
          await this.$http.$delete(`${this.url}/jobs/${job.ID}`);
        }
        catch (err2) {
          console.log("retry failed");
          console.error(err2);
        }
      }
    },
    deleteJob: async function (job) {
      this.$set(job, "DeletingJob", true);
      try {
        await this.$http.$delete(`${this.url}/jobs/${job.ID}`);
        await this.getClients();
        this.$set(job, "DeletingJob", false);
        this.$set(job, "DeleteJobDialog", false);
      } catch (err) {
        console.error(err);
      }
    },
    reassignJobs: async function () {
      this.reassigning = true;
      const promises = [];
      let errorCount = 0;
      for (const [idx, client] of Object.entries(this.selectedJobs)) {
        for (const job of client) {
          job.AssignedClient.ID = this.reassignToClient.ID;
          job.AssignedClient.DB = "undefined";
          if (job.CustomParameters && job.CustomParameters !== "") {
            job.CustomParameters = job.CustomParameters.split("\n");
          } else {
            job.CustomParameters = null;
          }
          promises.push(this.$http.$put(this.url + "/jobs/", job));
          if (idx % 5 == 0 || idx === this.selectedJobs.length - 1) {
            let res = await Promise.allSettled(promises);
            res.forEach((r) => {
              if (r.status === "rejected") {
                errorCount++;
              }
            });
            promises.length = 0;
          }
        }
      }
      this.reassignError = errorCount;
      setTimeout(() => (this.reassignError = 0), 5000);
      await this.getClients();
      this.reassigning = false;
      this.reassignToClient = null;
      this.selectedJobs = {};
      this.howManyJobsAreSelectedQuestionmark = 0;
    },
    deleteSelectedJobs: async function () {
      this.deletingSelectedJobs = true;
      let promises = [];
      for (const client of Object.values(this.selectedJobs)) {
        for (const job of client) {
          promises.push(this.deleteJobNoRefresh(job));
          if (promises.length >= 5) {
            await Promise.all(promises);
            promises.length = 0;
          }
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      await this.getClients();
      this.deletingSelectedJobs = false;
      this.deleteSelectedJobsDialog = false;
      this.selectedJobs = {};
      this.howManyJobsAreSelectedQuestionmark = 0;
    },
    updateJobSelection: function (updateObject) {
      this.$set(this.selectedJobs, updateObject.client, updateObject.selected);
      this.howManyJobsAreSelectedQuestionmark = this.calculateHowManyJobsAreSelectedQuestionmark();
    },
    getJobsForClient: function (client) {
      if (this.jobs == null) {
        return [];
      };
      return this.jobs.filter((j) => {
        this.$set(j, "EditJobDialog", false);
        this.$set(j, "EditingJob", false);
        this.$set(j, "DeleteJobDialog", false);
        this.$set(j, "DeleteJob", false);
        if (j.CustomParameters && typeof j.CustomParameters === "object") {
          j.CustomParameters = j.CustomParameters.join("\n");
        }
        return client.ID === j.AssignedClient.ID;
      });
    },
    getJobName: function (job) {
      //console.log(job);
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
      const jobs = await this.$http.$get(this.url + "/jobs/");
      if (jobs != null && jobs != "null\n") {
        this.jobs = jobs;
      }
      else {
        this.jobs = [];
      }
    },

    resolveClients: async function () {
      const unresolvedClients = await this.$http.$get("api/clients");
      let promises = [];
      for (let client of unresolvedClients) {
        for (let address of client.Addresses) {
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
      console.log(resolution);
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
