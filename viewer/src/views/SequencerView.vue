<template>
  <div >
    <h1>SequencerView</h1>
    <!-- <CurveEditor /> -->
    <Sequencer/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
// import CurveEditor from '@/components/Editors/CurveEditor.vue';
import Sequencer from '@/components/Sequencer.vue'; // @ is an alias to /src

@Component({
  components: {
    Sequencer,
    // CurveEditor,
  },
})
export default class SequencerView extends Vue {

}
</script>
