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
              :rules="nameRules"
              :counter="30"
              label="Client Name"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="clientAddress" :rules="addressRules" label="Address" required></v-text-field>
          </v-col>

          <v-btn
            class="mb-2"
            :loading="remove_load"
            :disabled="remove_load"
            text
            small
            color="blue"
            @click="loader = 'remove_load'"
          >Submit</v-btn>
        </v-row>
      </v-form>
    </v-card>
    <v-card class="mb-10">
      <v-card-title>Client List</v-card-title>
      <v-list>
        <v-divider></v-divider>
        <v-list-item v-for="user in users" :key="user.Name">
          <v-list-item-content>
            <v-list-item-title v-text="user.Name"></v-list-item-title>
            <v-list-item-subtitle v-text="user.Address"></v-list-item-subtitle>
          </v-list-item-content>

          <v-btn
            :loading="submit_load"
            :disabled="submit_load"
            text
            small
            color="red"
            @click="loader = 'submit_load'"
          >Remove</v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      users: [],
      clientName: "",
      clientAddress: "",
      nameRules: [
        (v) => !!v || "Name is required",
        (v) => v.length <= 30 || "Name must be less than 10 characters",
      ],
      addressRules: [(v) => !!v || "Name is required"],
      loader: null,
      submit_load: false,
      remove_load: false,
    };
  },
  async fetch() {
    this.users = await this.$axios.$get("/api/clients");
    // this.$axios.$post(url, postData)
  },
  watch: {
    async loader() {
      const l = this.loader;
      if (l == submit_load) {
        const newUser = { Name: clientName, Address: clientAddress };
        this.loader = await this.$axios.$post("/api/clients", newUser);
      } else if (l == remove_load) {
      }

      this.loader = null;
    },
  },
};
</script>