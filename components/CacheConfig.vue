<template>
  <v-container>
    <v-subheader class="mx-0 px-0">Cache Config</v-subheader>
    <v-row justify="start" class="px-3 mb-0">
      <v-checkbox v-model="redisFields.enabled" hide-details :label="`Enable Job Caching`"></v-checkbox>
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
              outlined
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
              outlined
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
              outlined
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
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="6" lg="6" class="mb-1 pb-0">
            <v-text-field
              :disabled="!redisFields.enabled"
              label="Channel Prefix"
              v-model="redisFields.prefix"
              placeholder="Prefix used to discern instancese"
              hide-details
              outlined
            ></v-text-field>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

  <script>
export default {
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (this.redisConfig) {

        const redisFields = {
          // fill with redisConfig
          enabled: this.redisConfig.Enabled,
          url: this.redisConfig.Host,
          pass: this.redisConfig.Password,
          db: this.redisConfig.DB,
          ttl: this.redisConfig.CacheTtl / 60000000000,
          prefix: this.redisConfig.ChannelPrefix,
        }
        this.redisFields = redisFields;
      }
    },
    addElement(event) {},
    removeElement(index) {
      this.list.splice(index, 1);
    },
  },
  data: () => ({
    redisFields: {
      enabled: false,
      url: "",
      pass: "",
      db: "",
      ttl: 1440,
      prefix: "",
    },
    showPw: false,
  }),
  props: {
    //  "Redis": {
    //    "Enabled": true,
    //    "Host": "10.10.10.96:6379",
    //    "Password": "",
    //    "DB": 0,
    //    "CacheTtl": 86400000000000,
    //    "ChannelPrefix": "avior"
    //  },
    redisConfig: Object,
  },
  watch: {
    redisFields: {
      handler: function () {
        const newRedisConfig = {
          Enabled: this.redisFields.enabled,
          Host: this.redisFields.url,
          Password: this.redisFields.pass,
          DB: this.redisFields.db,
          CacheTtl: this.redisFields.ttl * 60000000000,
          ChannelPrefix: this.redisFields.prefix,
        }
        this.$emit("newdata", newRedisConfig);
      },
      deep: true,
    },
  },
};
</script>
