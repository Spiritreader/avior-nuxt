<template>
  <v-data-table
    :headers="headers"
    :items="data"
    :search="nameSearch"
    show-select
    return-object
    v-model="selected"
    item-value="ID"
    class="elevation-1 mt-2"
    :mobile-breakpoint="0"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-text-field
          v-model="nameSearch"
          append-inner-icon="mdi-magnify"
          label="Search"
          variant="outlined"
          density="compact"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialogDeleteSelected" max-width="500px">
          <template v-slot:activator="{ props }">
            <v-btn
              color="red-darken-2"
              variant="outlined"
              :disabled="selected.length === 0"
              class="ml-2"
              v-bind="props"
            >
              <v-icon>mdi-delete</v-icon>
              {{ selected.length > 0 ? selected.length : "" }}
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">Delete {{ selected.length }} Fields</span>
            </v-card-title>

            <v-card-text>Do you really want to delete the following fields?</v-card-text>
            <v-card-text>
              <v-list-item v-for="(field, idx) in selected" :key="`field-${idx}`">
                <v-list-item-title class="text-wrap">{{ field.Value }}</v-list-item-title>
              </v-list-item>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="dialogDeleteSelected = false">Cancel</v-btn>
              <v-btn
                color="red-darken-1"
                variant="text"
                @click="
                  dialogDeleteSelected = false;
                  deleteSelected();
                "
                >Hit me</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialog" max-width="500px">
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" color="indigo-lighten-3" class="mx-2" v-bind="props">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-text-field v-model="editedItem.Value" label="Field name"></v-text-field>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="add">{{ actionButton }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <!-- eslint-disable -->
    <template v-slot:item.actions="{ item }">
      <v-icon size="small" class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>

      <v-dialog v-model="item.deleteDialog" max-width="500">
        <template v-slot:activator="{ props }">
          <v-icon size="small" v-bind="props">mdi-delete</v-icon>
        </template>
        <v-card>
          <v-card-title>Delete {{ item.Value }}</v-card-title>
          <v-card-text>Do you really want to delete {{ item.Value }}?</v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="item.deleteDialog = false">Cancel</v-btn>
            <v-btn
              color="red-darken-1"
              variant="text"
              @click="
                item.deleteDialog = false;
                deleteItem(item);
              "
              >Hit me</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-data-table>
</template>

<script>
export default {
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Field" : "Edit Field";
    },
    actionButton() {
      return this.editedIndex === -1 ? "Add" : "Update";
    },
    data() {
      return this.modelValue;
    },
  },

  props: {
    // Vue 3 changed the component v-model contract from value + input to
    // modelValue + update:modelValue. The emit below was already commented out
    // in the Vue 2 original, so the binding is one-way: the parent owns the
    // array and reloads it after every mutation.
    modelValue: Array,
  },
  data() {
    return {
      selected: [],
      //data: this.modelValue,
      nameSearch: "",
      dialogDeleteSelected: false,
      dialog: false,
      headers: [
        {
          title: "Field",
          align: "start",
          sortable: true,
          key: "Value",
        },
        { title: "Actions", key: "actions", sortable: false, align: "end" },
      ],
      editedIndex: -1,
      editedItem: {
        ID: "",
        Value: "",
      },
      defaultItem: {
        ID: "",
        Value: "",
      },
    };
  },

  watch: {
    dialog(val) {
      val || this.close();
    },
  },

  methods: {
    deleteSelected() {
      this.$emit("newdata", { mode: "deleteMany", ary: this.selected });
      this.selected = [];
    },

    editItem(item) {
      this.editedIndex = this.data.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },
    deleteItem(item) {
      const index = this.data.indexOf(item);
      //this.data.splice(index, 1);
      this.$emit("newdata", { mode: "delete", obj: item });
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },

    add() {
      if (this.editedIndex > -1) {
        //Object.assign(this.data[this.editedIndex], this.editedItem);
        //this.$emit("update:modelValue", this.data);
        this.$emit("newdata", { mode: "update", obj: this.editedItem });
      } else {
        //this.data.push(this.editedItem);
        //this.$emit("update:modelValue", this.data);
        this.$emit("newdata", { mode: "create", obj: this.editedItem });
      }
      this.close();
    },
  },
};
</script>
