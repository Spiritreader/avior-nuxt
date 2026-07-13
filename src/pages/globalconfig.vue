<template>
  <div>
    <v-row class="mb-6 mt-10" justify="center" no-gutters v-if="loading">
      <v-progress-circular :size="150" :width="20" color="indigo-lighten-2" indeterminate></v-progress-circular>
    </v-row>
    <v-row class="mb-6" justify="start" no-gutters v-else-if="error">
      <p>No client reachable to marshal database operations</p>
    </v-row>
    <v-card v-else>
      <v-tabs bg-color="indigo-lighten-2" align-tabs="center" color="white" show-arrows v-model="tab">
        <v-tab href="#tab-1" value="tab-1"> <v-icon class="mr-1">mdi-laptop</v-icon>Clients </v-tab>
        <v-tab href="#tab-2" value="tab-2"> <v-icon class="mr-1">mdi-alphabetical-variant-off</v-icon>Name Exclude </v-tab>
        <v-tab href="#tab-3" value="tab-3"> <v-icon class="mr-1">mdi-alphabetical-off</v-icon>Sub Exclude </v-tab>
        <v-tab href="#tab-4" value="tab-4"> <v-icon class="mr-1">mdi-playlist-check</v-icon>Log Include </v-tab>
        <v-tab href="#tab-5" value="tab-5"> <v-icon class="mr-1">mdi-playlist-remove</v-icon>Log Exclude </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="tab-1">
          <v-container class="pt-4 pb-0">
            <v-alert border="top" color="red-lighten-2" v-show="scheduleModified">
              You must pause and unpause the client for the schedule changes to take effect!
            </v-alert>
            <v-btn @click="clientAdd = true" class="pl-2" color="orange-lighten-2" variant="outlined">
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
                    <v-text-field label="Name" variant="outlined" required v-model="newClient.Name"></v-text-field>
                  </v-form>
                </v-container>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn @click="clientAdd = false; err = null;" variant="text">Cancel</v-btn>
                  <v-btn :loading="clientLoader" @click="addClient()" color="indigo-lighten-3" variant="text">Add</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- client list -->
            <v-list v-model:opened="opened">
              <v-list-group :key="client.ID" subgroup v-for="client in clients" :value="client.ID">
                <v-dialog max-width="500" v-if="client.Selected" v-model="client.Selected">
                  <v-card>
                    <v-card-title>Delete confirm</v-card-title>
                    <v-card-subtitle>Do you really want to delete {{ client.Name }}?</v-card-subtitle>
                    <v-alert class="mx-5" v-if="err" type="error">{{ err }}</v-alert>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn @click="client.Selected = false; err = null;" variant="text">Cancel</v-btn>
                      <v-btn @click="deleteClient(client)" color="red-darken-1" variant="text">Delete</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <!-- client list element -->
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ client.Name }}</v-list-item-title>
                  </v-list-item>
                </template>
                <v-list-item class="pl-6">
                  <v-container>
                    <v-row>
                      <v-switch class="pl-2" color="indigo-lighten-2" label="Can always receive jobs"
                        v-model="client.IgnoreOnline"></v-switch>
                    </v-row>
                    <v-row class="pt-4">
                      <v-col class="px-2" cols="12" sm="6" md="4">
                        <v-text-field
                          :rules="[(v) => (v || '').indexOf(' ') < 0 || 'No spaces are allowed', (v) => !!v || 'Name is required']"
                          label="Name" variant="outlined" v-model="client.Name"></v-text-field>
                      </v-col>
                      <v-col class="px-2" cols="6" sm="3" md="2">
                        <v-text-field :rules="[(v) => (!!v && v >= 0) || 'Must be set and positive']" label="Priority"
                          variant="outlined" type="number" v-model.number="client.Priority"></v-text-field>
                      </v-col>
                      <v-col class="px-2" cols="6" sm="3" md="2">
                        <v-text-field :rules="[(v) => (!!v && v >= 0) || 'Must be set and positive']"
                          label="Maximum Jobs" variant="outlined" type="number"
                          v-model.number="client.MaximumJobs"></v-text-field>
                      </v-col>
                      <v-col class="px-2" cols="6" sm="6" md="2">
                        <v-menu :close-on-content-click="false" location="bottom" transition="scale-transition">
                          <template v-slot:activator="{ props }">
                            <v-text-field :model-value="client.AvailabilityStart" label="Start Time"
                              variant="outlined" readonly v-bind="props" />
                          </template>
                          <v-time-picker class="mt-4" format="24hr" min="0:00" scrollable
                            v-model="client.AvailabilityStart" @update:model-value="enableBanner" />
                        </v-menu>
                      </v-col>
                      <v-col class="px-2" cols="6" sm="6" md="2">
                        <v-menu :close-on-content-click="false" location="bottom" transition="scale-transition">
                          <template v-slot:activator="{ props }">
                            <v-text-field :model-value="client.AvailabilityEnd" label="End Time"
                              variant="outlined" readonly v-bind="props" />
                          </template>
                          <v-time-picker class="mt-4" format="24hr" min="0:00" scrollable
                            v-model="client.AvailabilityEnd" @update:model-value="enableBanner" />
                        </v-menu>
                      </v-col>
                    </v-row>
                    <v-row justify="center">
                      <v-btn :loading="clientLoader" class="ml-2" color="indigo-lighten-2" icon
                        @click="editClient(client)">
                        <v-icon size="30">mdi-content-save</v-icon>
                      </v-btn>
                      <v-btn :loading="clientLoader" class="ml-2" color="red-lighten-2" icon
                        @click="client.Selected = true">
                        <v-icon size="30">mdi-delete</v-icon>
                      </v-btn>
                    </v-row>
                  </v-container>
                </v-list-item>
              </v-list-group>
            </v-list>
          </v-card>
        </v-window-item>

        <!-- Include and exclude lists -->
        <v-window-item value="tab-2">
          <v-card flat>
            <v-btn variant="outlined" @click="importDialog = true; importType = 'name_exclude';"
              color="orange-lighten-2" class="ml-4 mt-3">Import</v-btn>
            <v-btn variant="outlined" @click="exportType = 'name_exclude'; exportConfig();"
              color="orange-lighten-2" class="mt-3">Export</v-btn>
            <TextDataTable @newdata="modifyFields($event, 'name_exclude')" v-model="nameExcludes"></TextDataTable>
          </v-card>
        </v-window-item>
        <v-window-item value="tab-3">
          <v-btn variant="outlined" @click="importDialog = true; importType = 'sub_exclude';"
            color="orange-lighten-2" class="ml-4 mt-3">Import</v-btn>
          <v-btn variant="outlined" @click="exportType = 'sub_exclude'; exportConfig();"
            color="orange-lighten-2" class="mt-3">Export</v-btn>
          <v-card flat>
            <TextDataTable @newdata="modifyFields($event, 'sub_exclude')" v-model="subExcludes"></TextDataTable>
          </v-card>
        </v-window-item>

        <v-window-item value="tab-4">
          <v-card flat>
            <v-btn variant="outlined" @click="importDialog = true; importType = 'log_include';"
              color="orange-lighten-2" class="ml-4 mt-3">Import</v-btn>
            <v-btn variant="outlined" @click="exportType = 'log_include'; exportConfig();"
              color="orange-lighten-2" class="mt-3">Export</v-btn>
            <TextDataTable @newdata="modifyFields($event, 'log_include')" v-model="logIncludes"></TextDataTable>
          </v-card>
        </v-window-item>
        <v-window-item value="tab-5">
          <v-card flat>
            <v-btn variant="outlined" @click="importDialog = true; importType = 'log_exclude';"
              color="orange-lighten-2" class="ml-4 mt-3">Import</v-btn>
            <v-btn variant="outlined" @click="exportType = 'log_exclude'; exportConfig();"
              color="orange-lighten-2" class="mt-3">Export</v-btn>
            <TextDataTable @newdata="modifyFields($event, 'log_exclude')" v-model="logExcludes"></TextDataTable>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>

    <v-dialog v-if="importDialog" v-model="importDialog" max-width="500">
      <v-card>
        <v-card-title>
          Paste your fields here!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle>Your changes are saved as soon as you hit Import</v-card-subtitle>
        <v-container>
          <v-textarea variant="outlined" label="Import" name="Import" placeholder="One entry per line please"
            :error-messages="importError" v-model="importContent"></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="importDialog = false; importContent = '';">Cancel</v-btn>
          <v-btn color="green" :loading="importLoader" :disabled="importLoader" variant="text"
            @click="importConfig">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-if="exportDialog" v-model="exportDialog" max-width="500">
      <v-card>
        <v-card-title>
          Here's your configuration in a json format!
          <v-icon class="ml-2">mdi-emoticon-wink-outline</v-icon>
        </v-card-title>
        <v-card-subtitle>DatabaseURL is omitted and can only be set from the client machine</v-card-subtitle>
        <v-container>
          <v-textarea variant="outlined" label="Export" rows="12" v-model="exportContent" name="Export"></v-textarea>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="exportDialog = false; exportType = '';">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-overlay v-model="deleting" class="align-center justify-center">
      <v-progress-circular :model-value="deleteProgress" width="15" size="150"></v-progress-circular>
    </v-overlay>
  </div>
</template>



<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { get, post, put, del } from "@/api/http";
import TextDataTable from "@/components/TextDataTable.vue";
import { useClientResolution } from "@/composables/useClientResolution";
import type { DaemonClient, Field, FieldMutation, FieldType, Job } from "@/types";

const { resolveAnyAddress } = useClientResolution();

const loading = ref(true);
const error = ref(false);
const deleting = ref(false);
const deleteProgress = ref(0);
const importDialog = ref(false);
const importContent = ref("");
const importType = ref("");
const importError = ref("");
const importLoader = ref(false);
const exportDialog = ref(false);
const exportContent = ref("");
const exportType = ref("");
const newClient = ref<DaemonClient>({
  ID: "",
  Name: "",
  AvailabilityStart: "0:00",
  AvailabilityEnd: "0:00",
  MaximumJobs: 10,
  Priority: 0,
  Online: false,
  IgnoreOnline: false,
});
const nameExcludes = ref<Field[]>([]);
const subExcludes = ref<Field[]>([]);
const scheduleModified = ref(false);
const logExcludes = ref<Field[]>([]);
const logIncludes = ref<Field[]>([]);
const url = ref("");
const err = ref<unknown>(null);
const clientAdd = ref(false);
const clientLoader = ref(false);
const tab = ref("tab-1");
const opened = ref<unknown[]>([]);
const currentActiveCard = ref("");
const clients = ref<DaemonClient[]>([]);

const nameExcludesValues = computed(() => nameExcludes.value.map((f) => f.Value));
const subExcludesValues = computed(() => subExcludes.value.map((f) => f.Value));
const logExcludesValues = computed(() => logExcludes.value.map((f) => f.Value));
const logIncludesValues = computed(() => logIncludes.value.map((f) => f.Value));

// Nuxt's async fetch() hook; Vue 3 has no equivalent, so it runs from mounted().
async function refresh() {
  loading.value = true;
  error.value = false;
  try {
    await getClients();
    await getFields();
  } catch (e) {
    console.error(e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

function enableBanner() {
  scheduleModified.value = true;
}

async function importConfig() {
  try {
    importLoader.value = true;
    setTimeout(() => {
      importLoader.value = false;
    }, 400);
    const lines = importContent.value.split("\n").filter((c) => c != "");
    const content = lines.map((f) => ({ Value: f }));
    console.log(content);
    importError.value = "";
    await post(`${url.value}/fields/${importType.value}/`, content);
    reloadData(importType.value as FieldType);
    importType.value = "";
    importDialog.value = false;
    importContent.value = "";
  } catch (e) {
    importError.value = String(e);
  }
}

function exportConfig() {
  console.log(exportType.value);
  exportDialog.value = true;
  switch (exportType.value) {
    case "name_exclude":
      exportContent.value = nameExcludesValues.value.join("\n");
      break;
    case "sub_exclude":
      exportContent.value = subExcludesValues.value.join("\n");
      break;
    case "log_exclude":
      exportContent.value = logExcludesValues.value.join("\n");
      break;
    case "log_include":
      exportContent.value = logIncludesValues.value.join("\n");
      break;
  }
}

async function modifyFields(event: FieldMutation, fieldType: FieldType) {
  console.log("emitted " + event);
  switch (event.mode) {
    case "create":
      try {
        await post(`${url.value}/fields/${fieldType}/`, [event.obj]);
        await reloadData(fieldType);
      } catch (e) {
        console.error(e);
      }
      break;
    case "update":
      try {
        await put(`${url.value}/fields/${fieldType}/`, [event.obj]);
      } catch (e) {
        console.error(e);
      }
      break;
    case "delete":
      console.log(event);
      try {
        await del(`${url.value}/fields/${fieldType}/${event.obj.ID}/`);
        await reloadData(fieldType);
      } catch (e) {
        console.error(e);
      }
      break;
    case "deleteMany":
      deleteProgress.value = 0;
      deleting.value = true;
      console.log(event);
      try {
        for (const [idx, obj] of event.ary.entries()) {
          await del(`${url.value}/fields/${fieldType}/${obj.ID}/`);
          if (idx % 5 == 0) {
            deleteProgress.value = Math.round((idx / event.ary.length) * 100);
          }
        }
        deleteProgress.value = 100;
        await reloadData(fieldType);
        setTimeout(() => {
          deleting.value = false;
        }, 500);
      } catch (e) {
        console.error(e);
      }
      break;
  }
}

/**
 * The daemon replies with the literal string "null\n" (not JSON null) when a field
 * list is empty, which destr hands back as a string. Every read guards on that.
 */
async function fetchField(type: FieldType): Promise<Field[]> {
  const result = await get<Field[] | string>(`${url.value}/fields/${type}/`);
  if (typeof result == "string") {
    return [];
  }
  return result;
}

async function getFields() {
  try {
    nameExcludes.value = await fetchField("name_exclude");
    subExcludes.value = await fetchField("sub_exclude");
    logExcludes.value = await fetchField("log_exclude");
    logIncludes.value = await fetchField("log_include");
  } catch (e) {
    console.error(e);
  }
}

async function reloadData(type: FieldType) {
  console.log("fetching reload data for " + type);
  switch (type) {
    case "name_exclude":
      try {
        nameExcludes.value = await fetchField(type);
        console.log("name excludes: ", nameExcludes.value);
      } catch (e) {
        console.error(e);
      }
      break;
    case "sub_exclude":
      try {
        subExcludes.value = await fetchField(type);
      } catch (e) {
        console.error(e);
      }
      break;
    case "log_exclude":
      try {
        logExcludes.value = await fetchField(type);
      } catch (e) {
        console.error(e);
      }
      break;
    case "log_include":
      try {
        logIncludes.value = await fetchField(type);
      } catch (e) {
        console.error(e);
      }
      break;
  }
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortClients() {
  clients.value.sort(function (x, y) {
    if (x.Priority < y.Priority) {
      return -1;
    } else if (x.Priority > y.Priority) {
      return 1;
    } else {
      return 0;
    }
  });
}

async function editClient(client: DaemonClient) {
  clientLoader.value = true;
  scheduleModified.value = false;
  await timeout(300);
  try {
    await put(`${url.value}/clients/`, client);
  } catch (e) {
    console.log(e);
  }
  sortClients();
  // await getClients();
  clientLoader.value = false;
}

async function addClient() {
  err.value = null;
  try {
    clientLoader.value = true;
    await post(`${url.value}/clients/`, newClient.value);
    await timeout(300);
    newClient.value.Name = "";
    clientAdd.value = false;
  } catch (e) {
    console.log(e);
    err.value = e;
  }
  sortClients();
  // await getClients();
  clientLoader.value = false;
}

async function deleteClient(client: DaemonClient) {
  err.value = null;
  const jobs = await getJobsForClient(client);
  if (jobs.length > 0) {
    err.value = `This client still has ${jobs.length} jobs. Please reassign them first!`;
    return;
  }
  clientLoader.value = true;
  await timeout(300);
  clients.value.splice(clients.value.indexOf(client), 1);
  delete client.Selected;
  delete client.active;
  try {
    await del(`${url.value}/clients/${client.ID}`);
  } catch (e) {
    console.log(e);
  }
  // await getClients();
  clientLoader.value = false;
  client.Selected = false;
}

/**
 * Races EVERY address of EVERY client and keeps the single first responder: this page
 * only needs one reachable daemon, because /clients and /fields are cluster-wide.
 * The per-client race that index.vue and config.vue run is a different algorithm.
 */
async function getClients() {
  const resolution = await resolveAnyAddress();
  if (resolution.address != "none") {
    url.value = resolution.address;
    const fetched = await get<DaemonClient[]>(url.value + "/clients/");
    fetched.forEach((c) => (c.Selected = false));
    clients.value = fetched;
  }
}

async function getJobsForClient(client: DaemonClient): Promise<Job[]> {
  const jobs = await getJobs();
  return jobs.filter((j) => {
    return client.ID === j.AssignedClient.ID;
  });
}

function getJobs(): Promise<Job[]> {
  return get<Job[]>(url.value + "/jobs/");
}

onMounted(() => {
  refresh();
});
</script>

<!-- The original declared lang="scss" but the block is plain CSS with no SCSS
     syntax in it, and the installed sass build cannot run under this Vite. -->
<style scoped>
.smol {
  max-width: 100px;
}
</style>
