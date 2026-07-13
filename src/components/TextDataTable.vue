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
      <!--
        color="transparent": Vuetify 4's v-toolbar paints its own surface colour, so inside
        a card it renders as a lighter grey stripe. Vuetify 2's flat toolbar inherited the
        card's background. class="px-2" restores the horizontal padding the search field
        needs — without it the input sits flush against the card's left edge.
      -->
      <v-toolbar flat color="transparent" class="px-2">
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
              <span class="text-headline-small">Delete {{ selected.length }} Fields</span>
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
              <span class="text-headline-small">{{ formTitle }}</span>
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

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { Field, FieldMutation } from "@/types";

// The rows carry a per-row `deleteDialog` flag that the template stamps onto
// them via v-model. It is not part of the wire shape, hence the local widening.
type FieldRow = Field & { deleteDialog?: boolean };

const props = defineProps<{
  // Vue 3 changed the component v-model contract from value + input to
  // modelValue + update:modelValue. The emit below was already commented out
  // in the Vue 2 original, so the binding is one-way: the parent owns the
  // array and reloads it after every mutation.
  modelValue: FieldRow[];
}>();

const emit = defineEmits<{
  (e: "newdata", payload: FieldMutation): void;
}>();

const selected = ref<FieldRow[]>([]);
//const data = ref(props.modelValue);
const nameSearch = ref("");
const dialogDeleteSelected = ref(false);
const dialog = ref(false);
const headers: any[] = [
  {
    title: "Field",
    align: "start",
    sortable: true,
    key: "Value",
  },
  { title: "Actions", key: "actions", sortable: false, align: "end" },
];
const editedIndex = ref(-1);
const editedItem = ref<Field>({
  ID: "",
  Value: "",
});
const defaultItem: Field = {
  ID: "",
  Value: "",
};

const formTitle = computed(() => (editedIndex.value === -1 ? "New Field" : "Edit Field"));
const actionButton = computed(() => (editedIndex.value === -1 ? "Add" : "Update"));
const data = computed(() => props.modelValue);

function deleteSelected() {
  emit("newdata", { mode: "deleteMany", ary: selected.value });
  selected.value = [];
}

function editItem(item: FieldRow) {
  editedIndex.value = data.value.indexOf(item);
  editedItem.value = Object.assign({}, item);
  dialog.value = true;
}

function deleteItem(item: FieldRow) {
  //data.value.splice(data.value.indexOf(item), 1);
  emit("newdata", { mode: "delete", obj: item });
}

function close() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem);
    editedIndex.value = -1;
  });
}

function add() {
  if (editedIndex.value > -1) {
    //Object.assign(data.value[editedIndex.value], editedItem.value);
    //emit("update:modelValue", data.value);
    emit("newdata", { mode: "update", obj: editedItem.value });
  } else {
    //data.value.push(editedItem.value);
    //emit("update:modelValue", data.value);
    emit("newdata", { mode: "create", obj: editedItem.value });
  }
  close();
}

watch(dialog, (val) => {
  val || close();
});
</script>
