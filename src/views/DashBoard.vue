<template>
  <div class="home">    
    <FixtureRack />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FixtureRack from '@/components/FixtureRack.vue'; // @ is an alias to /src

@Component({
  components: {
    FixtureRack,
  },
})
export default class Home extends Vue {}
</script>
