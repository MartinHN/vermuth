<template>
  <transition name="modal">
    <div class="modal-mask" @mousedown="checkOuterClick($event)">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header" @click="$emit('close')">
            <slot name="header">
              <!-- default header -->
            </slot>
          </div>

          <div class="modal-body" style="height: 90%">
            <slot name="body">
              <!-- default body -->
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <!-- default footer -->
              <button class="modal-default-button" @click="$emit('close')">
                <!-- OK -->
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({})
export default class Modal extends Vue {
  public checkOuterClick(e: MouseEvent) {
    if (e) {
      const clickedEl = e.target as HTMLElement;
      if (
        ["modal-mask", "modal-wrapper"].some((el) =>
          clickedEl.classList.contains(el)
        )
      ) {
        this.$emit("close");
      }
    }
  }
}
</script>


<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 90%;
  height: 90%;
  overflow-y: scroll;
  margin: 0px auto;
  padding: 10px 10px;
  background-color: #404040;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header {
  margin-top: 0;
  color: #42b983;
  width: 100%;
}
.modal-header .close {
  display: inline-block;
  background: red;
  color: red;
  width: 10%;
  height: 10%;
  min-height: 20px;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
