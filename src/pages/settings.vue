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

<script>
import { get, post } from "@/api/http";
import SimpleList from "@/components/SimpleList.vue";

export default {
  components: { SimpleList },
  data() {
    return {
      users: [],
      clientName: "",
      clientAddresses: [],
      rules: {
        name: (v) => !!v || "Name is required",
        nameLen: (v) => v.length <= 30 || "Name must be at most 30 characters",
        address: (v) => !!v || "Address is required",
      },
      loader: null,
      submitLoad: false,
    };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    // Nuxt's async fetch() hook has no Vue 3 equivalent; it becomes a plain
    // method called from mounted() and re-invoked after every write.
    async refresh() {
      const users = await get("/api/clients");
      users.forEach((user) => {
        user.removeLoad = false;
      });
      this.users = users;
    },
    handleAddressData(data) {
      this.clientAddresses = data;
    },
    setLoader(i) {
      this.loader = i;
    },
    async addClient() {
      if (this.clientName != "" && this.clientAddress != "") {
        this.submitLoad = true;
        const newUser = {
          Name: this.clientName,
          Addresses: this.clientAddresses,
        };
        this.loader = await post("/api/clients", newUser);
        this.submitLoad = false;
        await this.refresh();
        this.submitLoad = false;
      }
    },
    async deleteClient(client) {
      client.removeLoad = true;
      const deleteUser = {
        _id: client._id,
      };
      await post("/api/clients/delete", deleteUser);
      await this.refresh();
      client.removeLoad = false;
    },
  },
};
</script>
