<template>
  <div class="home">    
    <ChannelRack />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ChannelRack from '@/components/ChannelRack.vue'; // @ is an alias to /src

@Component({
  components: {
    ChannelRack,
  },
})
export default class Home extends Vue {}
</script>
