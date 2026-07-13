<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="miniVariant">
      <v-list>
        <!-- `exact` matters: without it every route prefix-matches to="/" and
             Overview stays highlighted on every page. -->
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          exact
        >
          <template #prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title v-text="item.title" />
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-btn icon @click.stop="miniVariant = !miniVariant">
        <v-icon>mdi-{{ `chevron-${miniVariant ? "right" : "left"}` }}</v-icon>
      </v-btn>
      <img
        class="ml-1"
        width="30"
        src="/dryicons_love_file_icon_6200.png"
        alt="Avior"
      />
      <v-toolbar-title class="ml-4" v-text="title" />
      <v-spacer />
    </v-app-bar>
    <v-main>
      <v-container class="max-container-width">
        <router-view />
      </v-container>
    </v-main>
    <!--
      VFooter is the one layout component that KEEPS `app` in Vuetify 4: it is
      opt-in to the layout (VAppBar / VNavigationDrawer are layout items
      unconditionally, which is why `app` is gone from those). Without `app` the
      footer is a plain flex child with `flex: 1 0 auto` and stretches to fill
      the page. `absolute` is the Vuetify 4 equivalent of the old
      `:absolute="!fixed"` with `fixed` hard-coded to false: the footer sits at
      the bottom of the content instead of being pinned to the viewport.
    -->
    <v-footer app absolute>
      <span>&copy; {{ new Date().getFullYear() }} Walzen Group</span>
      <span class="mx-2">
        <a href="https://dryicons.com/icon/love-file-icon-6200">Icon</a>
      </span>
      <v-icon color="grey-lighten-1" size="20">mdi-git</v-icon>
      <a
        class="code-font ml-1"
        :href="`https://github.com/spiritreader/avior-nuxt/commit/${commitHash}`"
      >
        {{ commitHash }}
      </a>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface NavItem {
  icon: string;
  title: string;
  to: string;
}

const commitSha = ref<string | undefined>(import.meta.env.VITE_COMMIT_SHA);

// The source says `drawer: false`, but Vuetify 2's `v-navigation-drawer
// app` auto-opened on desktop regardless of that initial value, so the
// real app ships with the drawer OPEN. Vuetify 4 honours v-model
// literally, so reproducing the observable behaviour means `true`.
const drawer = ref(true);

const items = ref<NavItem[]>([
  {
    icon: "mdi-eye-settings-outline",
    title: "Overview",
    to: "/",
  },
  {
    icon: "mdi-file-tree",
    title: "Job Manager",
    to: "/jobs",
  },
  {
    icon: "mdi-cog-outline",
    title: "Client Configuration",
    to: "/config",
  },
  {
    icon: "mdi-card-bulleted-settings",
    title: "Global Configuration",
    to: "/globalconfig",
  },
  {
    icon: "mdi-remote",
    title: "Frontend Settings",
    to: "/settings",
  },
]);

const miniVariant = ref(false);
const right = ref(true);
const rightDrawer = ref(false);
const title = ref("Avior");

const commitHash = computed(() => {
  if (commitSha.value) {
    return commitSha.value.substring(0, 7);
  } else {
    return "dev";
  }
});
</script>
<style>
/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #1b1b1b;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

::-webkit-scrollbar-corner {
  background: #555;
}

.max-container-width {
  max-width: 1200px;
}

.code-font {
  font-family: "Fira Code", Fira Code, monospace;
}
</style>
