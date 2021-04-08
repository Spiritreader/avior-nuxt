<template>
  <div class="d-flex">
    <div v-if="allowNew" class="d-flex align-center justify-center">
      <v-btn @click="editTag()" icon class="ml-2">
        <v-icon v-if="disabledTag">mdi-circle-edit-outline</v-icon>
        <v-icon color="green" v-else>mdi-checkbox-marked-circle-outline</v-icon>
      </v-btn>
    </div>
    <v-container>
      <v-row>
        <v-col class="py-2" xs="6" sm="4" md="3" lg="2" xl="2">
          <v-text-field
            :disabled="disabledTag"
            label="Tag"
            v-model="tagInternal"
            :placeholder="`Enter ${tagName}`"
            hide-details
            outlined
          ></v-text-field>
        </v-col>
        <v-col class="py-2 pr-1" xs="6" sm="8" md="9" lg="10" xl="10">
          <v-text-field
            label="Resolution"
            v-model="contentInternal"
            :placeholder="`Enter ${contentName}`"
            hide-details
            outlined
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
    <div v-if="allowNew" class="d-flex align-center justify-center pr-2">
      <v-btn icon color="red" @click="remove()">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    remove() {
      this.deleted = true;
    },
    editTag() {
      if (!this.disabledTag) {
        this.$emit("newtagdata", { tag: this.tagInternal, id: this.id });
        this.disabledTag = true;
      } else {
        this.disabledTag = false;
      }
    },
  },
  mounted() {
    this.tagInternal = this.tag;
    this.contentInternal = this.content;
    if (this.new) {
      this.disabledTag = false;
    }
  },
  data: () => ({
    disabledTag: true,
    tagInternal: "",
    contentInternal: "",
    deleted: false,
  }),
  props: {
    allowNew: Boolean,
    new: Boolean,
    id: Number,
    tag: String,
    content: String,
    tagName: String,
    contentName: String,
  },
  watch: {
    deleted: {
      handler: function () {
        this.$emit("deleted", this.tag);
      },
    },
    contentInternal: {
      handler: function () {
        this.$emit("newcontentdata", {
          tag: this.tag,
          content: this.contentInternal,
        });
      },
    },
  },
};
</script>