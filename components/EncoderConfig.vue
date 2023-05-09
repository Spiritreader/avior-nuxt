<template>
  <v-container>
    <div>
      <h4 v-if="!isNew()" class="ml-3 pb-2">Encoder Configuration</h4>
      <h4 v-else class="ml-3 pb-2">Enter new encoder configuration</h4>
    </div>
      <v-alert v-model="showSaveHint" color="yellow" class="mx-3 mt-1" dismissible transition="fade-transition" text type="info">
        <div class="alert-text">To push changes to the client, you need to hit upload config</div>
      </v-alert>
    <div class="d-flex pb-1">
      <v-col cols="8" md="8" lg="5" xl="5" class="pr-0">
        <v-text-field
          :disabled="disabledTag"
          label="Tag"
          v-model="tagInternal"
          :placeholder="`Enter resolution tag`"
          hide-details
          outlined
        ></v-text-field>
      </v-col>
      <v-col>
        <v-btn @click="editAll()" cols="4" md="4" lg="7" xl="7" icon class="mt-3">
          <v-icon v-if="disabledTag">mdi-circle-edit-outline</v-icon>
          <v-icon color="green" v-else>mdi-checkbox-marked-circle-outline</v-icon>
        </v-btn>
        <v-btn v-if="allowNew" :disabled="isNew()" icon class="mt-3" @click="deleteConfirm = true">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </div>
    <div class="px-3 pt-3 pb-4">
      <v-text-field
        :disabled="disabledTag"
        v-model="outDirectory"
        :placeholder="`Enter resolution tag`"
        hide-details
        outlined
      ></v-text-field>
    </div>
    <div class="px-3 pt-3">
      <v-textarea
        :disabled="disabledTag"
        outlined
        auto-grow
        placeholder="One command per line please :)"
        name="PreArgumentsInput"
        label="Pre-Arguments"
        v-model="preArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        outlined
        label="Post-Arguments"
        placeholder="One command per line please :)"
        auto-grow
        name="PostArgumentsInput"
        v-model="postArgumentsString"
      ></v-textarea>
    </div>
    <div class="px-3">
      <v-textarea
        :disabled="disabledTag"
        outlined
        label="Stash"
        placeholder="Use this to store parameters you're currently not using :)"
        auto-grow
        name="StashInput"
        v-model="stashString"
      ></v-textarea>
    </div>
    <v-dialog v-if="deleteConfirm" v-model="deleteConfirm" max-width="500">
      <template v-slot:activator="{ on, attrs }">
        <v-btn class="mb-2" large icon color="red" v-bind="attrs" v-on="on">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Do you really want to delete the config for {{ tagInternal }}?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="darken-1" text @click="deleteConfirm = false">Cancel</v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="
              deleteConfirm = false;
              remove();
            "
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-container class="d-flex justify-center mt-0 pt-0"></v-container>
  </v-container>
</template>

<script>
export default {
  methods: {
    toggleSaveHint(e) {
      e.preventDefault();
      this.showSaveHint = !this.showSaveHint;
    },
    refresh() {
      if (!this.new) {
        this.disabledTag = true;
      } else {
        this.disabledTag = false;
      }
      this.preArgumentsString = "";
      this.postArgumentsString = "";
      this.stashString = "";
      console.log("mounted");
      console.log(this.content);
      this.tagInternal = this.tag;
      if (this.content.PreArguments) {
        this.content.PreArguments.forEach((l) => (this.preArgumentsString += l + "\n"));
      }

      if (this.content.PostArguments) {
        this.content.PostArguments.forEach((l) => (this.postArgumentsString += l + "\n"));
      }
      if (this.content.Stash) {
        this.content.Stash.forEach((l) => (this.stashString += l + "\n"));
      }
      this.outDirectory = this.content.OutDirectory;
      if (this.new) {
        this.disabledTag = false;
      }
    },
    isNew() {
      return this.new;
    },
    remove() {
      this.deleted = true;
    },
    editAll() {
      if (!this.disabledTag) {
        this.content.PreArguments = this.preArgumentsString
          .trim()
          .split("\n")
          .filter((e) => e);
        this.content.PostArguments = this.postArgumentsString
          .trim()
          .split("\n")
          .filter((e) => e);
        this.content.Stash = this.stashString.trim().split("\n");
        this.content.OutDirectory = this.outDirectory;
        console.log(this.content.PreArguments);
        this.$emit("newdata", {
          tag: this.tagInternal,
          content: this.content,
          id: this.id,
        });
        this.disabledTag = true;
        this.showSaveHint = true;
      } else {
        this.disabledTag = false;
      }
    },
  },
  mounted() {
    this.refresh();
  },
  data: () => ({
    showSaveHint: false,
    deleteConfirm: false,
    disabledTag: true,
    tagInternal: "",
    outDirectory: "",
    preArgumentsString: "",
    postArgumentsString: "",
    stashString: "",
    deleted: false,
  }),
  props: {
    allowNew: Boolean,
    new: Boolean,
    id: Number,
    tag: String,
    content: Object,
  },
  watch: {
    deleted: {
      handler: function () {
        this.$emit("deleted", this.tag);
      },
    },
    id: {
      handler: function () {
        this.refresh();
      },
    },
  },
};
</script>

<style lang="scss">
.alert-text {
  margin-top: 2px;
}
</style>
