<template>
  <div class="about">
    <h1>StateView</h1>
    <StateComponent/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import StateComponent from '@/components/StateComponent.vue'; // @ is an alias to /src

@Component({
  components: {
    StateComponent,
  },
})
export default class StateView extends Vue {}
</script>
