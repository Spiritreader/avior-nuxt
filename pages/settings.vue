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
            <v-text-field
              v-model="clientName"
              :rules="[rules.nameLen, rules.name]"
              :counter="30"
              label="Client Name"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <SimpleList
              @newdata="handleAddressData($event)"
              :icon="'mdi-access-point-network'"
              :list="clientAddresses"
              :type="'Address'"
              noheader
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
          <v-list-item-content>
            <v-list-item-title v-text="user.Name"></v-list-item-title>
            <v-list-item-subtitle v-text="user.Addresses.join(', ')"></v-list-item-subtitle>
          </v-list-item-content>

          <v-btn :loading="user.removeLoad" :disabled="user.removeLoad" text small color="red" @click="deleteClient(user)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
export default {
  mounted() {
    this.rules = {
      name: (v) => !!v || "Name is required",
      nameLen: (v) => v.length <= 30 || "Name must be at most 30 characters",
      address: (v) => !!v || "Address is required",
    };
  },
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
  methods: {
    handleAddressData(data) {
      this.clientAddresses = data;
    },
    setLoader(i) {
      console.log(i);
      this.loader = i;
    },
    async addClient() {
      if (this.clientName != "" && this.clientAddress != "") {
        this.submitLoad = true;
        const newUser = {
          Name: this.clientName,
          Addresses: this.clientAddresses,
        };
        /*
        this.loader = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        }).then((res) => res.json());*/
        this.loader = await this.$http.$post("/api/clients", newUser);
        this.submitLoad = false;
        await this.$fetch();
        this.submitLoad = false;
      }
    },
    async deleteClient(client) {
      client.removeLoad = true;
      const deleteUser = {
        _id: client._id,
      };
      let result = await this.$http.$post("/api/clients/delete", deleteUser);
      console.log(result);
      /*
      this.loader = await fetch("http://localhost:3000/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteUser),
      }).then((res) => res.json());*/
      await this.$fetch();
      client.removeLoad = false;
    },
  },
  async fetch() {
    //this.users = await fetch("http://localhost:3000/api/clients").then((res) => res.json());
    const users = await this.$http.$get("/api/clients");
    users.forEach((user) => {
      user.removeLoad = false;
    });
    this.users = users;
  },
};
</script>