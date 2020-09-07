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
            :loading="submit_load"
            :disabled="submit_load"
            text
            small
            color="blue"
            @click="loader = 'submit_load'"
          >Submit</v-btn>
        </v-row>
      </v-form>
    </v-card>
    <v-card class="mb-10">
      <v-card-title>Client List</v-card-title>
      <v-list>
        <v-divider></v-divider>
        <v-list-item v-for="(user, i) in users" :key="user._id">
          <v-list-item-content>
            <v-list-item-title v-text="user.Name"></v-list-item-title>
            <v-list-item-subtitle v-text="user.Address"></v-list-item-subtitle>
          </v-list-item-content>

          <v-btn
            :loading="remove_load"
            :disabled="remove_load"
            text
            small
            color="red"
            @click="loader = i"
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
        (v) => v.length <= 30 || "Name must be less than 30 characters",
      ],
      addressRules: [(v) => !!v || "Address is required"],
      loader: null,
      submit_load: false,
      remove_load: false,
    };
  },
  async fetch() {
    //this.users = await fetch("http://localhost:3000/api/clients").then((res) => res.json());
    this.users = await this.$http.$get("/api/clients");
  },
  watch: {
    async loader() {
      try {
        const l = this.loader;
        if (l == "submit_load") {
          if (this.clientName != "" && this.ClientAddres != "") {
            const newUser = {
              Name: this.clientName,
              Address: this.clientAddress,
            };
            /*
            this.loader = await fetch("/api/clients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newUser),
            }).then((res) => res.json());*/
            this.loader = await this.$http.$post("/api/clients", newUser);
            this.loader = null;
            this.submit_load = false;
          }
        } else {
          const deleteUser = {
            _id: this.users[l]._id,
          };
          console.log("deleting user");
          console.log(deleteUser);
          this.loader = await fetch("http://localhost:3000/api/clients", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deleteUser),
          }).then((res) => res.json());
          this.loader = null;
          this.submit_load = false;
        }

        this.loader = null;
      } catch (err) {
        console.log(err);
      }
    },
  },
};
</script>