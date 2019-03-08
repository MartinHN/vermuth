<template>
  <div >
    <h1>SequencerView</h1>
    <Sequencer/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Sequencer from '@/components/Sequencer.vue'; // @ is an alias to /src

@Component({
  components: {
    Sequencer,
  },
})
export default class SequencerView extends Vue {}
</script>
