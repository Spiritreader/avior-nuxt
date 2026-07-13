<template>
  <v-container fluid>
    <v-row class="mb-6 mt-10" justify="center" no-gutters v-if="loading">
      <v-progress-circular :size="150" :width="20" color="light-green-darken-3" indeterminate></v-progress-circular>
    </v-row>
    <v-row class="mb-6" justify="start" no-gutters v-else-if="fetchError">
      <p>No client reachable to marshal database operations</p>
    </v-row>
    <v-row v-else>
      <v-card class="mx-auto" width="100%">
        <!-- Was <v-system-bar>. In Vuetify 4 VSystemBar calls useLayoutItem, so it is a
             LAYOUT component: it hoists itself out of the card and pins to the top of the
             page, spanning the full width. In Vuetify 2 it was an ordinary inline element
             unless given `app`/`fixed`. No prop restores the inline behaviour (`absolute`
             would overlay the card's own content), so this is a plain strip: same colour,
             same 32px height as `window`, same content, but it stays inside the card. -->
        <v-sheet
          color="light-green-darken-3"
          height="32"
          class="d-flex align-center px-4 text-body-medium"
        >
          <span>{{ jobs.length }} job{{ s2 }} left to process</span>
          <v-spacer></v-spacer>
        </v-sheet>
        <!-- VList has no boolean `flat` prop in Vuetify 4 (it is only a value of `variant`,
             whose default is already 'text' = flat). The v2 attribute is dropped. -->
        <v-list>
          <!-- Begin Buttons -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon class="pl-4 pt-3">mdi-home</v-icon>
            </template>
            <v-container class>
              <!-- Begin Add Job -->
              <v-dialog v-model="addJobDialog" max-width="500">
                <template v-slot:activator="{ props: activatorProps }">
                  <v-btn
                    :loading="addingJob"
                    :disabled="addingJob"
                    v-bind="activatorProps"
                    color="blue"
                    variant="outlined"
                    class="ma-2 pl-2"
                  >
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
                        :item-title="'Name'"
                        :item-value="'ID'"
                        v-model="newJob.AssignedClient.ID"
                        label="Client"
                        variant="outlined"
                      ></v-select>
                      <v-btn
                        class="mr-2 my-2"
                        @click="
                          addJobDialog = false;
                          clearNewJob();
                        "
                        >Cancel</v-btn
                      >
                      <v-btn class="mr-6" :loading="addingJob" :disabled="addingJob" variant="outlined" color="green" @click="addJob()"
                        >Add Job</v-btn
                      >
                      <v-btn variant="outlined" color="blue-darken-1" class="mr-6 my-2" @click="addJobsDialog = true">JSON</v-btn>
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
                      <v-btn
                        variant="outlined"
                        class="mr-4"
                        :loading="addingJobs"
                        :disabled="addingJobs"
                        color="green"
                        @click="addJobsFromJson()"
                        >Add Jobs</v-btn
                      >
                      <v-btn variant="outlined" color="blue-darken-1" class="mr-6 my-2" @click="addJobsDialog = false">Job Form</v-btn>
                    </v-form>
                    <!-- End Add Multiple Jobs-->
                  </v-container>
                </v-card>
              </v-dialog>
              <!-- End Add Job -->
              <!-- Begin Reassign -->
              <v-dialog v-model="reassignDialog" max-width="300">
                <template v-slot:activator="{ props: activatorProps }">
                  <v-btn
                    :loading="reassigning"
                    :disabled="reassigning || howManyJobsAreSelectedQuestionmark === 0"
                    v-bind="activatorProps"
                    variant="outlined"
                    color="blue"
                    class="ma-2"
                    >Reassign {{ howManyJobsAreSelectedQuestionmark > 0 ? howManyJobsAreSelectedQuestionmark + " Job" + s : "" }}</v-btn
                  >
                </template>
                <v-card>
                  <!-- v-list-item-group is gone in Vuetify 4: selection lives on v-list -->
                  <v-list :selected="reassignSelection" @update:selected="setReassignToClient" color="primary">
                    <v-list-item v-for="(client, i) in clients" :key="i" :value="client">
                      <v-list-item-title>{{ client.Name }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      variant="text"
                      @click="
                        reassignDialog = false;
                        reassignToClient = null;
                      "
                      >Cancel</v-btn
                    >
                    <v-btn
                      :disabled="!reassignToClient"
                      color="green-darken-1"
                      variant="text"
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
                <template v-slot:activator="{ props: activatorProps }">
                  <v-btn
                    :loading="deletingSelectedJobs"
                    :disabled="deletingSelectedJobs || howManyJobsAreSelectedQuestionmark === 0"
                    v-bind="activatorProps"
                    color="red"
                    variant="outlined"
                    class="ma-2 pl-2"
                  >
                    <v-icon class="mr-2">mdi-delete</v-icon>
                    Delete
                    <!-- selectedJobs is an object, so .length is undefined and the count never shows.
                         Preserved verbatim from the Nuxt app; see the report. -->
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
                      lines="two"
                    >
                      <v-list-item-title class="text-wrap">{{ getJobName(value) }}</v-list-item-title>
                      <v-list-item-subtitle class="text-wrap">{{ value.Path }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn class="mr-4" @click="deleteSelectedJobsDialog = false">Cancel</v-btn>
                    <v-btn
                      variant="outlined"
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
              <v-list-item-title class="bg-error pa-2"
                >{{ reassignError }} job{{ reassignError > 1 ? "s" : "" }} could not be reassigned</v-list-item-title
              >
            </v-list-item>
          </v-list>
          <!-- End Reassign Error -->

          <!-- Begin Client List -->
          <v-list-group v-for="(client, i) in clients" :key="`client-${i}`" :value="`client-${i}`" subgroup>
            <template v-slot:activator="{ props: activatorProps }">
              <v-list-item v-bind="activatorProps">
                <v-list-item-title>
                  <v-icon class="pb-1" :color="client.Online ? 'green' : 'red'">mdi-power</v-icon>
                  {{ client.Name }}
                </v-list-item-title>
                <v-list-item-subtitle>{{ client.Jobs ? `${client.Jobs.length} assigned` : "0 assigned" }}</v-list-item-subtitle>
              </v-list-item>
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
                  <v-text-field label="Path" v-model="editItem.Path" required></v-text-field>
                  <v-text-field label="Name" v-model="editItem.Name" required></v-text-field>
                  <v-text-field label="Subtitle" v-model="editItem.Subtitle" required></v-text-field>
                  <v-textarea label="Custom Parameters" v-model="editItem.CustomParameters"></v-textarea>
                  <v-select
                    :items="clients"
                    :item-title="'Name'"
                    :item-value="'ID'"
                    v-model="editItem.AssignedClient.ID"
                    label="Client"
                    variant="outlined"
                  ></v-select>
                  <v-btn class="mr-4" @click="closeEditJobDialog(editItem)">Cancel</v-btn>
                  <v-btn
                    class="mr-4"
                    :loading="editItem.EditingJob"
                    :disabled="editItem.EditingJob"
                    variant="outlined"
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

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { get, post, put, del } from "@/api/http";
import JobDataTable from "@/components/JobDataTable.vue";
import { useClientResolution } from "@/composables/useClientResolution";
import type { DaemonClient, Job, JobSelectionUpdate } from "@/types";

const { resolveAnyAddress } = useClientResolution();

/**
 * Selected jobs, keyed by client ID -- e.g. { "62bc2a93...": [job, job] }.
 *
 * Deliberately `any`, and that is not laziness. The template and reassignJobs() use
 * this value in two mutually contradictory ways at once, which is the PRESERVED BUG:
 *
 *   - `selectedJobs.length` -- read as if it were an ARRAY. It is an object, so this
 *     is always undefined. That is why the Delete button never shows a count
 *     (`undefined > 0` is false), and why reassignJobs' `idx === selectedJobs.length - 1`
 *     compares a string key against NaN and is never true.
 *   - `Object.values(selectedJobs).reduce((flat, ary) => flat.concat(ary))` -- read as
 *     if it were a plain record of Job[]. Correct, and the dialog depends on it.
 *
 * No single honest type admits both readings: adding `length: number` poisons
 * Object.values() with a number, and omitting it makes `.length` an error. `any` keeps
 * BOTH template expressions compiling AND both behaviours bit-identical. The script-side
 * iterations below re-narrow to the real shape.
 */
interface SelectedJobs {
  /** client ID -> that client's selected jobs. Typed `any` on purpose, so the template's
   *  `Object.values(selectedJobs).reduce((flat, ary) => flat.concat(ary))` still infers
   *  an array instead of being poisoned by the phantom `length` below. */
  [clientId: string]: any;
  /** NOT REAL. Never assigned, so it always reads back as undefined. */
  length: number;
}

const loading = ref(false);
const fetchError = ref<unknown>(null);
const reassigning = ref(false);
const reassignError = ref(0);
const reassignDialog = ref(false);
const reassignToClient = ref<DaemonClient | null>(null);
const deletingSelectedJobs = ref(false);
const deleteSelectedJobsDialog = ref(false);
const addJobDialog = ref(false);
const addingJob = ref(false);
const howManyJobsAreSelectedQuestionmark = ref(0);

const EMPTY_JOBS_JSON = `[
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

const newJobs = ref(EMPTY_JOBS_JSON);
const newJobsError = ref("");
const addingJobs = ref(false);
const addJobsDialog = ref(false);

function emptyJob() {
  return {
    Path: "",
    Name: "",
    Subtitle: "",
    CustomParameters: null as Job["CustomParameters"],
    AssignedClient: {
      Ref: "clients",
      ID: "",
      DB: "undefined",
    },
  };
}

const newJob = ref(emptyJob());
const selectedJobs = ref<SelectedJobs>({} as SelectedJobs);
const jobs = ref<Job[]>([]);
const clients = ref<(DaemonClient & { Jobs: Job[] })[]>([]);
const url = ref("");

// edit item data. Note this placeholder is not a valid Job: it has no ID, and its
// AssignedClient is {ID, Name} rather than {Ref, ID, DB}. setEditItem() replaces it
// with a real Job before anything reads it.
const editItem = ref<Job>({
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
} as unknown as Job);

const s = computed(() => {
  if (howManyJobsAreSelectedQuestionmark.value > 1) {
    return "s";
  }
  return "";
});

const s2 = computed(() => {
  if (jobs.value.length > 1) {
    return "s";
  } else {
    return "";
  }
});

/**
 * v-list takes an array of selected values, where v-list-item-group took a single one.
 */
const reassignSelection = computed(() => {
  return reassignToClient.value ? [reassignToClient.value] : [];
});

/**
 * Replaces Nuxt's async fetch() hook. Called from mounted().
 */
async function refresh() {
  loading.value = true;
  fetchError.value = null;
  try {
    await getClients();
  } catch (err) {
    fetchError.value = err;
  } finally {
    loading.value = false;
  }
}

function setReassignToClient(selected: DaemonClient[]) {
  reassignToClient.value = selected.length > 0 ? selected[0] : null;
}

function calculateHowManyJobsAreSelectedQuestionmark() {
  let amount = 0;
  for (const selectedRows of Object.values(selectedJobs.value) as Job[][]) {
    amount += selectedRows.length;
  }
  return amount;
}

/**
 * Removes all object keys within the filter, such that a job object only contains relevant keys to be displayed for rendering
 */
function filteredJob(job: Job): Record<string, unknown> {
  const filter = ["EditJobDialog", "EditingJob", "DeleteJobDialog", "DeleteJob"];
  const filtered = Object.keys(job)
    .filter((key) => !filter.includes(key))
    .reduce((obj: Record<string, unknown>, key) => {
      obj[key] = (job as unknown as Record<string, unknown>)[key];
      return obj;
    }, {});
  return filtered;
}

function clearNewJob() {
  newJob.value = emptyJob();
}

function resetJsonJobs() {
  newJobs.value = EMPTY_JOBS_JSON;
}

async function addJobsFromJson() {
  addingJobs.value = true;
  const promises: Promise<unknown>[] = [];
  try {
    const parsedJobs: Job[] = JSON.parse(newJobs.value);
    newJobsError.value = "";
    parsedJobs.forEach((job) => {
      promises.push(post(url.value + "/jobs/", job));
    });
    try {
      await Promise.all(promises);
      await getClients();
      resetJsonJobs();
    } catch (err) {
      console.error(err);
    }
    addingJobs.value = false;
    addJobsDialog.value = false;
    addJobDialog.value = false;
  } catch (error) {
    console.error(error);
    newJobsError.value = `Invalid JSON: ${String(error)}`;
    addingJobs.value = false;
    selectedJobs.value = {} as SelectedJobs;
  }
}

async function addJob() {
  addingJob.value = true;
  const job = JSON.parse(JSON.stringify(newJob.value));
  if (job.CustomParameters && job.CustomParameters !== "") {
    job.CustomParameters = job.CustomParameters.split("\n");
  } else {
    job.CustomParameters = null;
  }
  try {
    await post(url.value + "/jobs/", job);
    await getClients();
    clearNewJob();
  } catch (err) {
    // TODO make this an error in the ui
    console.log("error inserting job");
    console.error(err);
  }
  addingJob.value = false;
  addJobDialog.value = false;
  selectedJobs.value = {} as SelectedJobs;
}

async function updateJob(job: Job) {
  job.EditingJob = true;
  const jobToSend = filteredJob(job) as Record<string, unknown> & { CustomParameters: unknown };
  if (job.CustomParameters && jobToSend.CustomParameters !== "") {
    jobToSend.CustomParameters = (jobToSend.CustomParameters as string).split("\n");
  } else {
    jobToSend.CustomParameters = null;
  }
  try {
    await put(url.value + "/jobs/", jobToSend);
    await getClients();
  } catch (err) {
    console.error(err);
  }
  job.EditingJob = false;
  job.EditJobDialog = false;
}

function closeEditJobDialog(job: Job) {
  job.EditJobDialog = false;
  job.EditingJob = false;
}

function setEditItem(job: Job) {
  job.EditJobDialog = true;
  editItem.value = job;
}

async function deleteJobNoRefresh(job: Job) {
  try {
    await del(`${url.value}/jobs/${job.ID}`);
  } catch (err) {
    console.error(err);
    console.log(`retrying ${job.ID}`);
    try {
      await del(`${url.value}/jobs/${job.ID}`);
    } catch (err2) {
      console.log("retry failed");
      console.error(err2);
    }
  }
}

async function deleteJob(job: Job) {
  job.DeletingJob = true;
  try {
    await del(`${url.value}/jobs/${job.ID}`);
    await getClients();
    job.DeletingJob = false;
    job.DeleteJobDialog = false;
  } catch (err) {
    console.error(err);
  }
}

async function reassignJobs() {
  reassigning.value = true;
  const promises: Promise<unknown>[] = [];
  let errorCount = 0;
  for (const [idx, client] of Object.entries(selectedJobs.value) as [string, Job[]][]) {
    for (const job of client) {
      job.AssignedClient.ID = reassignToClient.value!.ID;
      job.AssignedClient.DB = "undefined";
      if (job.CustomParameters && job.CustomParameters !== "") {
        job.CustomParameters = (job.CustomParameters as string).split("\n");
      } else {
        job.CustomParameters = null;
      }
      promises.push(put(url.value + "/jobs/", job));
      // PRESERVED BUG: `idx` is an Object.entries KEY, so it holds a client ID string
      // like "62bc2a93...". `idx % 5` coerces that to NaN, so the first
      // branch is never true; and `selectedJobs.length` is undefined on an object,
      // so the second compares a string to NaN and is never true either. Net effect:
      // the batch is NEVER flushed inside the loop, so every put is fired and only
      // awaited... never. errorCount therefore stays 0. Do not fix without being asked.
      if ((idx as unknown as number) % 5 == 0 || (idx as unknown as number) === selectedJobs.value.length - 1) {
        const res = await Promise.allSettled(promises);
        res.forEach((r) => {
          if (r.status === "rejected") {
            errorCount++;
          }
        });
        promises.length = 0;
      }
    }
  }
  reassignError.value = errorCount;
  setTimeout(() => (reassignError.value = 0), 5000);
  await getClients();
  reassigning.value = false;
  reassignToClient.value = null;
  selectedJobs.value = {} as SelectedJobs;
  howManyJobsAreSelectedQuestionmark.value = 0;
}

async function deleteSelectedJobs() {
  deletingSelectedJobs.value = true;
  const promises: Promise<unknown>[] = [];
  for (const client of Object.values(selectedJobs.value) as Job[][]) {
    for (const job of client) {
      promises.push(deleteJobNoRefresh(job));
      if (promises.length >= 5) {
        await Promise.all(promises);
        promises.length = 0;
      }
    }
  }
  if (promises.length > 0) {
    await Promise.all(promises);
  }
  await getClients();
  deletingSelectedJobs.value = false;
  deleteSelectedJobsDialog.value = false;
  selectedJobs.value = {} as SelectedJobs;
  howManyJobsAreSelectedQuestionmark.value = 0;
}

function updateJobSelection(updateObject: JobSelectionUpdate) {
  selectedJobs.value[updateObject.client] = updateObject.selected;
  howManyJobsAreSelectedQuestionmark.value = calculateHowManyJobsAreSelectedQuestionmark();
}

function getJobsForClient(client: DaemonClient): Job[] {
  if (jobs.value == null) {
    return [];
  }
  return jobs.value.filter((j) => {
    j.EditJobDialog = false;
    j.EditingJob = false;
    j.DeleteJobDialog = false;
    j.DeleteJob = false;
    if (j.CustomParameters && typeof j.CustomParameters === "object") {
      j.CustomParameters = j.CustomParameters.join("\n");
    }
    return client.ID === j.AssignedClient.ID;
  });
}

function getJobName(job: Job) {
  let jobName = job.Name;
  if (job.Subtitle !== "") {
    jobName += " - " + job.Subtitle;
  }
  return jobName;
}

async function getJobs() {
  const fetched = await get<Job[] | string>(url.value + "/jobs/");
  if (fetched != null && (fetched as unknown) != "null\n") {
    jobs.value = fetched as Job[];
  } else {
    jobs.value = [];
  }
}

/**
 * Races EVERY address of EVERY client and keeps the single first responder: this page
 * only needs one reachable daemon to marshal database operations through, because
 * /jobs and /clients are cluster-wide. This is NOT the per-client race that index.vue
 * and config.vue run.
 */
async function getClients() {
  const resolution = await resolveAnyAddress();
  console.log(resolution);
  if (resolution.address != "none") {
    url.value = resolution.address;
    const fetched = await get<(DaemonClient & { Jobs: Job[] })[]>(url.value + "/clients/");
    await getJobs();
    fetched.sort((a, b) => (a.Online === b.Online ? 0 : a.Online ? -1 : 1));
    fetched.forEach((c) => {
      c.Jobs = getJobsForClient(c);
      c.SelectAll = false;
    });
    clients.value = fetched;
  }
}

onMounted(() => {
  refresh();
});
</script>
