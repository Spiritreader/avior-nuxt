<template>
  <v-container>
    <div class="d-flex asfasdfasdf flex-wrap"></div>
    <v-row>
      <v-card class="mx-auto" width="100%">
        <v-list>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>

            <v-list-item-title class="text-wrap">{{selectedJobs}}</v-list-item-title>
          </v-list-item>
          <v-list-group sub-group v-for="client in clients">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title><v-icon :color="client.Online ? 'green' : 'red'">mdi-power</v-icon> {{ client.Name }}</v-list-item-title>
                <v-list-item-subtitle>{{ jobs.length }}</v-list-item-subtitle>
              </v-list-item-content>
            </template>

            <v-list-item-group v-for="(job, i) in jobs" v-model="selectedJobs" multiple>
              <v-list-item class="my-2" :key="`job-${i}`" :value="job">
                <template v-slot:default="{ active }">
                  <v-list-item-action>
                    <v-checkbox :input-value="active" color="primary"></v-checkbox>
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title class="text-wrap" v-text="getJobName(job)"></v-list-item-title>
                    <v-list-item-subtitle class="text-wrap">{{ job.Path }}</v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-list-item>
            </v-list-item-group>
          </v-list-group>
        </v-list>
      </v-card>
    </v-row>
  </v-container>
</template>


<script>
export default {
  computed: {

  },
  methods: {
    getClientJob: function(job) {
      // this might return undefined if there is no client matching the AssignedClient.ID of the job
      return clients.find((c) => c.ID === job.AssignedClient.ID)
    },
    getJobName: function (job) {
      let jobName = job.Name;
      if (job.Subtitle !== "") {
        jobName += " - " + job.Subtitle;
      }
      return jobName;
    },
    addSelectedJob: function (job) {
      if (this.selectedJobs.includes(job)) {
        this.selectedJobs.splice(this.selectedJobs.indexOf(job), 1);
      } else {
        this.selectedJobs.push(job);
      }
    },
  },
  data: () => ({
    selectedJobs: [],
    jobs: [
      {
        ID: "5f57a7c21844fc19dcd89e23",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\Die wunderbare Welt der Weine (7 10)_2020-09-08-17-18-00-arte HD (AC3,deu).ts",
        Name: "Die wunderbare Welt der Weine (7/10)",
        Subtitle: "England - Ein königlicher Sekt",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ae721280b6d431584127c19",
          DB: null,
        },
      },
      {
        ID: "5f57b2771844fc1cf04478a0",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\Tierkinder der Wildnis_2020-09-08-17-48-00-arte HD (AC3,deu).ts",
        Name: "Tierkinder der Wildnis",
        Subtitle: "Ravi, der Bartaffe",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ae721280b6d431584127c19",
          DB: null,
        },
      },
      {
        ID: "5f57bc9a1844fc18c46efd76",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\Tierkinder der Wildnis_2020-09-08-18-28-00-arte HD (AC3,deu).ts",
        Name: "Tierkinder der Wildnis",
        Subtitle: "Lyca, die Wildhündin",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ae721280b6d431584127c19",
          DB: null,
        },
      },
      {
        ID: "5f57e0511844fc1b30ac278e",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\In aller Freundschaft (903)_2020-09-08-20-58-00-Das Erste HD (AC3,deu).ts",
        Name: "In aller Freundschaft (903)",
        Subtitle: "Ungeklärtes Fernsehserie Deutschland 2020",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ae721280b6d431584127c19",
          DB: null,
        },
      },
      {
        ID: "5f57bc9a1844fc18c46efd76",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\Tierkinder der Wildnis_2020-09-08-18-28-00-arte HD (AC3,deu).ts",
        Name: "Tierkinder der Wildnis",
        Subtitle: "Lyca, die Wildhündin",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ac68ded1b20cb0a14f9643d",
          DB: null,
        },
      },
      {
        ID: "5f57e0511844fc1b30ac278e",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\In aller Freundschaft (903)_2020-09-08-20-58-00-Das Erste HD (AC3,deu).ts",
        Name: "In aller Freundschaft (903)",
        Subtitle: "Ungeklärtes Fernsehserie Deutschland 2020",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ac68ded1b20cb0a14f9643d",
          DB: null,
        },
      },
      {
        ID: "5f57bc9a1844fc18c46efd76",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\Tierkinder der Wildnis_2020-09-08-18-28-00-arte HD (AC3,deu).ts",
        Name: "Tierkinder der Wildnis",
        Subtitle: "Lyca, die Wildhündin",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ac68e354f0c3f34089d4ca2",
          DB: null,
        },
      },
      {
        ID: "5f57e0511844fc1b30ac278e",
        Path:
          "\\\\UMS\\wd_usb_8tb\\Recording\\In aller Freundschaft (903)_2020-09-08-20-58-00-Das Erste HD (AC3,deu).ts",
        Name: "In aller Freundschaft (903)",
        Subtitle: "Ungeklärtes Fernsehserie Deutschland 2020",
        CustomParameters: null,
        AssignedClient: {
          Ref: "clients",
          ID: "5ac68e354f0c3f34089d4ca2",
          DB: null,
        },
      },
    ],
    clients: [
      {
        ID: "5ae721280b6d431584127c19",
        Name: "PHOENIX",
        AvailabilityStart: "0:00",
        AvailabilityEnd: "0:00",
        MaximumJobs: 200,
        Priority: 4,
        Online: true,
        IgnoreOnline: true,
      },
      {
        ID: "5ac68ded1b20cb0a14f9643d",
        Name: "VDR",
        AvailabilityStart: "0:00",
        AvailabilityEnd: "0:00",
        MaximumJobs: 10,
        Priority: 2,
        Online: false,
        IgnoreOnline: false,
      },
      {
        ID: "5ac7367f0a355938ac674153",
        Name: "MMDG",
        AvailabilityStart: "0:00",
        AvailabilityEnd: "0:00",
        MaximumJobs: 5,
        Priority: 1,
        Online: false,
        IgnoreOnline: false,
      },
      {
        ID: "5ac68e354f0c3f34089d4ca2",
        Name: "VAVA",
        AvailabilityStart: "0:00",
        AvailabilityEnd: "0:00",
        MaximumJobs: 100,
        Priority: 0,
        Online: true,
        IgnoreOnline: false,
      },
      {
        ID: "5d6ac573dddbd2679ca3d295",
        Name: "VDR-U",
        AvailabilityStart: "0:00",
        AvailabilityEnd: "0:00",
        MaximumJobs: 5,
        Priority: 0,
        Online: false,
        IgnoreOnline: false,
      },
    ],
  }),
};
</script>