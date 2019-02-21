<template>
  <div class="about">
    <h1>PatchView</h1>
    <channel-patch/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ChannelPatch from '@/components/ChannelPatch.vue'; // @ is an alias to /src

@Component({
  components: {
    ChannelPatch,
  },
})
export default class PatchView extends Vue {}
</script>
