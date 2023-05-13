<template>
  <div>
    <v-data-table
      v-model="selectedRows"
      @current-items="current = $event"
      @item-selected="bulkSelect"
      @toggle-select-all="allSelect"
      :headers="headers"
      :items="currentClient.Jobs"
      item-key="ID"
      class="elevation-1"
      show-select
      unselectable
      disable-sort
      disable-pagination
      disable-filtering
      hide-default-footer
      :mobile-breakpoint="460"
      v-if="currentClient.Jobs.length > 0"
    >
      <template v-slot:[`item.Name`]="{ item, value }">
        <v-list-item class="mx-0 px-0">
          <v-list-item-content class="text-wrap">
            <v-list-item-title class="text-wrap">{{ value }}</v-list-item-title>
            <v-list-item-subtitle class="text-wrap">{{ item.Path }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <div class="d-flex flex-row-reverse">
          <v-icon size="32" @click="setDeleteItem(item)" color="red lighten-1">mdi-delete-circle-outline</v-icon>
          <v-icon size="32" @click="setEditItem(item)" color="blue lighten-1">mdi-circle-edit-outline</v-icon>
        </div>
        <!--
      <v-icon class="mr-2">mdi-pencil</v-icon>
      <v-icon>mdi-delete</v-icon>-->
      </template>
    </v-data-table>
    <!-- Begin Delete -->
    <v-dialog max-width="500" v-model="editItem.DeleteJobDialog">
      <v-card>
        <v-card-title>Delete Job</v-card-title>
        <v-card-text>Do you really want to delete the following job?</v-card-text>
        <v-card-text>
          <v-list-item two-line>
            <v-list-item-content>
              <v-list-item-title class="text-wrap">{{ editItem.Name }}</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{ editItem.Path }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="mr-4" @click="closeDeleteJobDialog(editItem)">Cancel</v-btn>
          <v-btn
            outlined
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
  created() {
    const self = this;
    self.keyDownHandler = function ({ key }) {
      if (key == "Shift") self.shiftKeyOn = true;
    };
    self.keyUpHandler = function ({ key }) {
      if (key == "Shift") self.shiftKeyOn = false;
    };
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
  },
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

      shiftKeyOn: false,
      current: [],
      selectedRows: [],
      lastSelected: {},
      headers: [
        {
          text: "Name",
          align: "start",
          sortable: false,
          value: "Name",
        },
        { text: "Actions", value: "actions", sortable: false, align: "right" },
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
      this.$set(job, "DeleteJobDialog", false);
      this.$set(job, "DeletingJob", false);
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
    allSelect({ items, value }) {
      const data = value ? items : [];
      this.$emit("updateselected", {
        client: this.currentClient.ID,
        selected: data,
      });
    },
    bulkSelect({ item: b, value }) {
      const { selectedRows, current, shiftKeyOn, lastSelected } = this;
      if (b) {
        this.lastSelected = b;
        if (value == true && shiftKeyOn && b) {
          let start = current.findIndex((item) => item == lastSelected);
          let end = current.findIndex((item) => item == b);
          if (start - end > 0) {
            let temp = start;
            start = end;
            end = temp;
          }
          for (let i = start; i <= end; i++) {
            if (!selectedRows.includes(current[i])) {
              selectedRows.push(current[i]);
            }
          }
        } else if (value == true) {
          selectedRows.push(b);
        } else if (value == false) {
          selectedRows.splice(selectedRows.indexOf(b), 1);
        }

        this.emitSelected();
      }
    },
  },
  watch: {
    currentClient: function (newCurrClient) {
      this.selectedRows = [];
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
