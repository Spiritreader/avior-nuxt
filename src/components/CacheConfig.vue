<template>
  <v-container>
    <v-list-subheader class="mx-0 px-0">Cache Config</v-list-subheader>
    <!--
      The checkbox has to sit flush with the "Cache Config" subheader above it and the
      Redis URL field below it. Two things push it in under Vuetify 4:

      The row's px-3 used to be cancelled by .v-row's -12px margin, which v4 dropped, so
      those 12px now count. And v4's checkbox reserves an 8px ripple gutter inside the
      control, so its glyph no longer starts at the component's own left edge.

      ml-n2 takes back the 8px. Measured: glyph, subheader and text field now share a
      left edge, as they do in the reference.
    -->
    <v-row justify="start" class="mb-0">
      <v-checkbox
        v-model="redisFields.enabled"
        hide-details
        class="ml-n2"
        :label="`Enable Job Caching`"
      ></v-checkbox>
    </v-row>
    <v-expand-transition>
      <div v-if="redisFields.enabled">
        <v-row justify="start" class="pt-6">
          <v-col cols="12" sm="7" md="7" lg="7" class="mb-1 pb-0">
            <v-text-field
              :disabled="!redisFields.enabled"
              label="Redis URL"
              v-model="redisFields.url"
              placeholder="Enter a redis URL without protocol"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="3" md="3" lg="3" class="mb-1 pb-0">
            <v-text-field
              label="Redis Password"
              :disabled="!redisFields.enabled"
              placeholder="Enter your redis password"
              v-model="redisFields.pass"
              :type="showPw ? 'text' : 'password'"
              hide-details
              variant="outlined"
              @click:append="showPw = !showPw"
              :append-icon="showPw ? 'mdi-eye' : 'mdi-eye-off'"
            ></v-text-field>
          </v-col>
          <v-col cols="6" sm="2" md="2" lg="2" class="mb-1 pb-0">
            <v-text-field
              :disabled="!redisFields.enabled"
              type="number"
              label="Redis DB ID"
              v-model="redisFields.db"
              placeholder="Database ID"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row class="pb-1">
          <v-col cols="12" sm="6" md="6" lg="6" class="mb-1 pb-0">
            <v-text-field
              :disabled="!redisFields.enabled"
              type="number"
              label="Cache TTL"
              suffix="minute(s)"
              v-model="redisFields.ttl"
              placeholder="Time until the cache is invalidated"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="6" lg="6" class="mb-1 pb-0">
            <v-text-field
              :disabled="!redisFields.enabled"
              label="Channel Prefix"
              v-model="redisFields.prefix"
              placeholder="Prefix used to discern instancese"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

  <script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { RedisConfig } from "@/types";

interface RedisFields {
  enabled: boolean;
  url: string;
  pass: string;
  /** The DB text-field writes a string here; the daemon sends a number. Both are live. */
  db: number | string;
  /** Minutes. The text-field writes a string here, which the watcher coerces on multiply. */
  ttl: number;
  prefix: string;
}

const props = defineProps<{
  //  "Redis": {
  //    "Enabled": true,
  //    "Host": "10.10.10.96:6379",
  //    "Password": "",
  //    "DB": 0,
  //    "CacheTtl": 86400000000000,
  //    "ChannelPrefix": "avior"
  //  },
  redisConfig?: RedisConfig;
}>();

const emit = defineEmits<{
  newdata: [config: RedisConfig];
}>();

const redisFields = ref<RedisFields>({
  enabled: false,
  url: "",
  pass: "",
  db: "",
  ttl: 1440,
  prefix: "",
});
const showPw = ref(false);

function init() {
  if (props.redisConfig) {
    const fields: RedisFields = {
      // fill with redisConfig
      enabled: props.redisConfig.Enabled,
      url: props.redisConfig.Host,
      pass: props.redisConfig.Password,
      db: props.redisConfig.DB,
      ttl: props.redisConfig.CacheTtl / 60000000000,
      prefix: props.redisConfig.ChannelPrefix,
    };
    redisFields.value = fields;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addElement(event: Event) {}

// NOTE: `list` is not a prop of this component. Calling removeElement throws --
// exactly as it did before the port. Nothing calls it; kept verbatim.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function removeElement(index: number) {
  const self = props as unknown as { list: unknown[] };
  self.list.splice(index, 1);
}

onMounted(() => {
  init();
});

watch(
  redisFields,
  () => {
    const newRedisConfig: RedisConfig = {
      Enabled: redisFields.value.enabled,
      Host: redisFields.value.url,
      Password: redisFields.value.pass,
      DB: redisFields.value.db,
      CacheTtl: redisFields.value.ttl * 60000000000,
      ChannelPrefix: redisFields.value.prefix,
    };
    emit("newdata", newRedisConfig);
  },
  { deep: true }
);
</script>
