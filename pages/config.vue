<template>
  <v-container>
    <v-row class="mb-6" justify="center" no-gutters>
      <v-col class="client-dropdown">
        <v-select :items="items" label="Client" outlined></v-select>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    items: ["Foo", "Bar", "Fizz", "Buzz"],
  }),
};
</script>

<style lang="scss">
.client-dropdown {
  max-width: 500px;
}
</style>
