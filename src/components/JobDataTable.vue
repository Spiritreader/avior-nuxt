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
        <v-list-item class="mx-0 px-0">
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

<script>
export default {
  emits: ["deletejob", "updateselected", "editJobDialog"],
  props: {
    currentClient: Object,
    clients: Array,
  },
  data() {
    return {
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

      selectedRows: [],
      headers: [
        {
          title: "Name",
          align: "start",
          sortable: false,
          key: "Name",
        },
        { title: "Actions", key: "actions", sortable: false, align: "end" },
      ],
    };
  },
  methods: {
    setEditItem: function (item) {
      this.$emit("editJobDialog", item);
    },
    setDeleteItem: function (item) {
      item.DeleteJobDialog = true;
      this.editItem = item;
    },
    closeDeleteJobDialog: function (job) {
      job.DeleteJobDialog = false;
      job.DeletingJob = false;
    },
    filteredJob: function (job) {
      const filter = ["EditJobDialog", "EditingJob", "DeleteJobDialog", "DeletingJob"];
      const filtered = Object.keys(job)
        .filter((key) => !filter.includes(key))
        .reduce((obj, key) => {
          obj[key] = job[key];
          return obj;
        }, {});
      return filtered;
    },
    emitSelected() {
      this.$emit("updateselected", {
        client: this.currentClient.ID,
        selected: this.selectedRows,
      });
    },
  },
  watch: {
    currentClient: function () {
      this.selectedRows = [];
    },
    // Vuetify 4's data table owns selection: `v-model` holds the selected rows
    // (raw job objects, thanks to `return-object`), and shift-click range
    // selection plus select-all are handled natively by VDataTable's select
    // strategy. The Vuetify 2 version had to reimplement both by hand off the
    // `item-selected` / `toggle-select-all` events, which no longer exist.
    // All that is left to do is forward the current selection to the parent.
    selectedRows: function () {
      this.emitSelected();
    },
  },
};
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
