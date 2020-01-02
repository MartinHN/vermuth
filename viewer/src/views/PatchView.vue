<template>
  <div class="about">
    <h1>PatchView</h1>
    <FixturePatch></FixturePatch>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FixturePatch from '@/components/FixturePatch.vue'; // @ is an alias to /src

@Component({
  components: {
    FixturePatch,
  },
})
export default class PatchView extends Vue {}
</script>
