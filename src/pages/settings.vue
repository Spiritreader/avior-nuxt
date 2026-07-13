<template>
  <v-container>
    <v-row class="title" no-gutters>
      <h2 class="mb-2">Settings</h2>
    </v-row>
    <v-divider class="mb-2"></v-divider>
    <v-card class="mb-10">
      <v-card-title>Add Client</v-card-title>
      <v-form>
        <v-row class="ml-3 mr-3">
          <v-col cols="12" sm="6">
            <!--
              persistent-counter has no Vuetify 2 equivalent because v2 always
              showed the counter. Vuetify 4 only reveals it while the field is
              focused, so without this the reference app's permanent "0 / 30"
              silently disappears. Matching the reference, not the v4 default.
            -->
            <v-text-field
              v-model="clientName"
              :rules="[rules.nameLen, rules.name]"
              :counter="30"
              persistent-counter
              label="Client Name"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <SimpleList
              :icon="'mdi-access-point-network'"
              :list="clientAddresses"
              :type="'Address'"
              noheader
              @newdata="handleAddressData($event)"
            ></SimpleList>
          </v-col>

          <v-btn
            class="mb-2"
            :loading="submitLoad"
            :disabled="submitLoad || clientName === '' || clientAddresses === ''"
            color="blue"
            @click="addClient()"
            >Submit</v-btn
          >
        </v-row>
      </v-form>
    </v-card>
    <v-card class="mb-10">
      <v-card-title>Client List</v-card-title>
      <v-list>
        <v-divider></v-divider>
        <v-list-item v-for="(user, i) in users" :key="i">
          <v-list-item-title v-text="user.Name"></v-list-item-title>
          <v-list-item-subtitle v-text="user.Addresses.join(', ')"></v-list-item-subtitle>
          <template #append>
            <v-btn
              :loading="user.removeLoad"
              :disabled="user.removeLoad"
              variant="text"
              size="small"
              color="red"
              @click="deleteClient(user)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { get, post } from "@/api/http";
import SimpleList from "@/components/SimpleList.vue";
import type { Client } from "@/types";

const users = ref<Client[]>([]);
const clientName = ref("");

// `any` on purpose: the (untouched) template compares this array to a string
// (`clientAddresses === ''`), which never holds. Typing it as string[] would
// make that comparison a type error in the template, and the template is not
// mine to change.
const clientAddresses = ref<any>([]);

// PRESERVED BUG: addClient() below guards on `clientAddress` (SINGULAR), a field
// that never existed on the Options API component -- the real one is
// `clientAddresses` (plural). `undefined != ""` is always true, so that half of
// the guard has never done anything. Declared here so the guard stays literally
// the same expression and stays always-true.
const clientAddress = undefined as string | undefined;

const rules = {
  name: (v: string) => !!v || "Name is required",
  nameLen: (v: string) => v.length <= 30 || "Name must be at most 30 characters",
  address: (v: string) => !!v || "Address is required",
};

const loader = ref<unknown>(null);
const submitLoad = ref(false);

// Nuxt's async fetch() hook has no Vue 3 equivalent; it becomes a plain
// function called from onMounted() and re-invoked after every write.
async function refresh() {
  const fetched = await get<Client[]>("/api/clients");
  fetched.forEach((user) => {
    user.removeLoad = false;
  });
  users.value = fetched;
}

function handleAddressData(data: string[]) {
  clientAddresses.value = data;
}

function setLoader(i: unknown) {
  loader.value = i;
}

async function addClient() {
  if (clientName.value != "" && clientAddress != "") {
    submitLoad.value = true;
    const newUser = {
      Name: clientName.value,
      Addresses: clientAddresses.value,
    };
    loader.value = await post("/api/clients", newUser);
    submitLoad.value = false;
    await refresh();
    submitLoad.value = false;
  }
}

async function deleteClient(client: Client) {
  client.removeLoad = true;
  const deleteUser = {
    _id: client._id,
  };
  await post("/api/clients/delete", deleteUser);
  await refresh();
  client.removeLoad = false;
}

onMounted(() => {
  refresh();
});
</script>
