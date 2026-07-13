<template>
  <div>
    <v-data-table
      v-model="selectedRows"
      :headers="headers"
      :items="currentClient.Jobs"
      item-value="ID"
      return-object
      class="elevation-1"
      show-select
      disable-sort
      hide-default-footer
      :items-per-page="-1"
      :mobile-breakpoint="460"
      v-if="currentClient.Jobs.length > 0"
    >
      <template v-slot:[`item.Name`]="{ item, value }">
        <!--
          lines="two": Vuetify 2 sized a list item from its v-list-item-content, so a
          title + subtitle got the taller two-line box automatically. Vuetify 4 deleted
          that wrapper and needs telling, so the job name and its path were packed into
          a single-line box. py-2 is the extra breathing room on top of that.
        -->
        <v-list-item lines="two" class="mx-0 px-0 py-2">
          <v-list-item-title class="text-wrap">{{ value }}</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">{{ item.Path }}</v-list-item-subtitle>
        </v-list-item>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <div class="d-flex flex-row-reverse">
          <v-icon size="32" @click="setDeleteItem(item)" color="red-lighten-1">mdi-delete-circle-outline</v-icon>
          <v-icon size="32" @click="setEditItem(item)" color="blue-lighten-1">mdi-circle-edit-outline</v-icon>
        </div>
      </template>
    </v-data-table>
    <!-- Begin Delete -->
    <v-dialog max-width="500" v-model="editItem.DeleteJobDialog">
      <v-card>
        <v-card-title>Delete Job</v-card-title>
        <v-card-text>Do you really want to delete the following job?</v-card-text>
        <v-card-text>
          <v-list-item lines="two">
            <v-list-item-title class="text-wrap">{{ editItem.Name }}</v-list-item-title>
            <v-list-item-subtitle class="text-wrap">{{ editItem.Path }}</v-list-item-subtitle>
          </v-list-item>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-4" @click="closeDeleteJobDialog(editItem)">Cancel</v-btn>
          <v-btn
            variant="outlined"
            class="mr-4"
            :loading="editItem.DeletingJob"
            :disabled="editItem.DeletingJob"
            color="red"
            @click="$emit('deletejob', editItem)"
            >Delete Job</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- End Delete -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { DaemonClient, Job, JobSelectionUpdate } from "@/types";

// jobs.vue always attaches `Jobs` before rendering this component, and the
// (untouched) template dereferences `currentClient.Jobs.length` unguarded.
type JobClient = DaemonClient & { Jobs: Job[] };

const props = defineProps<{
  currentClient: JobClient;
  clients: DaemonClient[];
}>();

const emit = defineEmits<{
  (e: "deletejob", job: Job): void;
  (e: "updateselected", payload: JobSelectionUpdate): void;
  (e: "editJobDialog", job: Job): void;
}>();

// Edit item data. This placeholder is NOT a valid Job -- it has no ID, and its
// AssignedClient is {ID, Name} rather than {Ref, ID, DB}. Preserved verbatim; it is only
// ever a placeholder, because setDeleteItem() swaps in a real Job (which is what opens
// the dialog) before anything reads it. Hence the cast rather than a widened type.
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
} as unknown as Job)

const selectedRows = ref<Job[]>([]);
const headers: any[] = [
  {
    title: "Name",
    align: "start",
    sortable: false,
    key: "Name",
  },
  { title: "Actions", key: "actions", sortable: false, align: "end" },
];

function setEditItem(item: Job) {
  emit("editJobDialog", item);
}

function setDeleteItem(item: Job) {
  item.DeleteJobDialog = true;
  editItem.value = item;
}

function closeDeleteJobDialog(job: Job) {
  job.DeleteJobDialog = false;
  job.DeletingJob = false;
}

// Not called anywhere -- true of the pre-port Options API original too, which
// defined the same method here and never invoked it (jobs.vue has its own,
// separately-called filteredJob). Kept verbatim.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function filteredJob(job: Record<string, unknown>) {
  const filter = ["EditJobDialog", "EditingJob", "DeleteJobDialog", "DeletingJob"];
  const filtered = Object.keys(job)
    .filter((key) => !filter.includes(key))
    .reduce((obj: Record<string, unknown>, key) => {
      obj[key] = job[key];
      return obj;
    }, {});
  return filtered;
}

function emitSelected() {
  emit("updateselected", {
    client: props.currentClient.ID,
    selected: selectedRows.value,
  });
}

watch(
  () => props.currentClient,
  () => {
    selectedRows.value = [];
  }
);

// Vuetify 4's data table owns selection: `v-model` holds the selected rows
// (raw job objects, thanks to `return-object`), and shift-click range
// selection plus select-all are handled natively by VDataTable's select
// strategy. The Vuetify 2 version had to reimplement both by hand off the
// `item-selected` / `toggle-select-all` events, which no longer exist.
// All that is left to do is forward the current selection to the parent.
watch(selectedRows, () => {
  emitSelected();
});
</script>
<style>
.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
