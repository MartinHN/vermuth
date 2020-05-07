<template>
  <v-app id="app">
    <div id="fixHead">
      <div id="nav" ref="navBar">
        <v-btn
          depressed
          small
          fab
          dark
          :color="serverStatusColor"
          class="mx-2"
          @click="showDrawer=!showDrawer"
        >+</v-btn>
        <router-link to="/">Dashboard</router-link>

        <router-link to="/Sequencer">Sequencer</router-link>
        <router-link to="/Presets">Presets</router-link>

        <router-link to="/Patch">Patch</router-link>
      </div>
    </div>

    <div id="menuBtn">
      <v-navigation-drawer
        v-model="showDrawer"
        color="white"
        :expand-on-hover="false"
        :mini-variant="false"
        :right="false"
        :permanent="false"
        src
        absolute
        dark
      >
        <v-list dense nav class="pt-12">
          <ServerState id="serverState" />
          <v-list-item>
            <router-link to="/Config" @click.native="showDrawer=false">Config</router-link>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </div>
    <div id="navContent">
      <Modal v-if="loadingSession">
        <v-progress-circular indeterminate />
      </Modal>
      <keep-alive>
        <!-- don't care about caching page mem, it's fast-->
        <router-view />
      </keep-alive>
    </div>
    <input
      ref="fakeSessionFileInput"
      type="file"
      name="name"
      style="display: none;"
      @change="loadLocally($event.target.files)"
    />
  </v-app>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State, Action, Getter, Mutation, namespace } from "vuex-class";
import rootState from "@API/RootState";
import Server from "./api/Server";
import dmxClient from "./api/DMXClient";
import ServerState from "./components/ServerState.vue";

import Modal from "@/components/Utils/Modal.vue";
import Store from "./store";

let originalFaviconNode: any;
let redFaviconNode: any;

@Component({
  components: { ServerState, Modal }
})
export default class App extends Vue {
  get routePathList() {
    const routePaths = Array.from((this.$refs.navBar as HTMLElement).childNodes)
      .map((e: any) => e.pathname)
      .filter(e => !!e);
    console.log(routePaths);
    return routePaths;
  }

  // @Mutation('addFixture') public addFixture!: FixtureMethods['addFixture'];
  public metaFromRoot: any = rootState.meta; // assign value to local vue reactive data
  @State("savedStatus") public savedStatus!: string;

  @Getter("isConnected") public isConnected!: string;

  @Action("SAVE_SESSION") public SAVE_SESSION!: () => void;
  @Action("SAVE_LOCALLY") public SAVE_LOCALLY!: () => void;
  @Action("SET_SESSION_STATE") public SET_SESSION_STATE!: (o: any) => void;

  public showDrawer = false;
  public mounted() {
    rootState.meta = this.metaFromRoot; // inject reactiveness in rootState
    Server.connect(this.$store, window.location.hostname);
    this.removeOldIco();
    originalFaviconNode = this.loadIconNode("favicon.ico");
    redFaviconNode = this.loadIconNode("favicon_red.ico");
    this.changeFavIcon(false);
    window.addEventListener("keydown", this.processKey);
  }
  public destroyed() {
    window.removeEventListener("keydown", this.processKey);
  }

  @Watch("isConnected")
  public changeFavIcon(value: boolean) {
    const oldLink = document.getElementById("dynamic-favicon");
    const head = document.head || document.getElementsByTagName("head")[0];
    if (oldLink) {
      head.removeChild(oldLink);
    }
    const newLink = value ? originalFaviconNode : redFaviconNode;
    head.appendChild(newLink);
  }

  public get serverStatusColor() {
    return this.isConnected
      ? this.dmxIsConnected
        ? "green"
        : "orange"
      : "red";
  }
  public get dmxIsConnected() {
    return dmxClient.__connected;
  }

  public get loadingSession() {
    return !!this.metaFromRoot.loadingJSONName;
  }
  public loadLocally(files: FileList) {
    if (files && files.length === 1) {
      const file = files[0];
      const fileReader = new FileReader();
      fileReader.addEventListener("load", (event: any) => {
        this.SET_SESSION_STATE(JSON.parse(event.target.result));
      });
      fileReader.readAsText(file);
    }
  }
  public getRouteIdx() {
    const path = (this.$router as any).history.current.path;
    return this.routePathList.findIndex(e => e === path);
  }
  public nav(left: boolean) {
    let nI = this.getRouteIdx();
    const rl = this.routePathList;
    if (left) {
      nI = (nI + 1) % rl.length;
    } else {
      nI = nI - 1;
      if (nI < 0) {
        nI += rl.length;
      }
    }
    this.$router.push(this.routePathList[nI]);
  }

  private removeOldIco() {
    const head = document.head || document.getElementsByTagName("head")[0];
    const links = Array.from(head.getElementsByTagName("link"));
    for (const l of links) {
      if (
        l.rel === "icon" &&
        (l.href.includes("32x32") || l.href.includes("16x16"))
      ) {
        head.removeChild(l);
      }
    }
  }

  private loadIconNode(src: string) {
    const link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "shortcut icon";
    link.href = src;
    const head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(link);
    return link;
  }
  private processKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.nav(false);
        return;
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.nav(true);
        return;
      }
      const key = event.key.toLowerCase();

      switch (key) {
        case "s":
          event.preventDefault();
          if (event.shiftKey) {
            this.SAVE_LOCALLY();
          } else {
            // alert('ctrl-s');
            this.SAVE_SESSION();
          }

          break;
        case "o":
          event.preventDefault();
          (this.$refs.fakeSessionFileInput as HTMLElement).click();
          // event.preventDefault();
          // alert('ctrl-f');
          break;
        case ",":
          event.preventDefault();
          this.$router.push("/Config");
          break;
        case "g":
          // event.preventDefault();
          // alert('ctrl-g');
          break;
      }
    }
  }
}
</script>
<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: grey;
  min-height: 100%;
  min-width: 100%;

  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
#fixHead {
  z-index: 1000;
  background-color: white;
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 40px;
}
#navContent {
  padding: 50px 0 0 0;
}
#nav {
  padding: 0px;
  height: 100%;
  display: flex;

  justify-content: space-around;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
  flex: 1 1 0;
  height: 100%;
  text-align: center;
}

#nav a.router-link-exact-active {
  color: #42b983;
  background: grey;
}
#savedStatus {
  flex: 0 0 30px;
  /*display:inline-block;*/
  /*align-content: left;*/
}
#serverState {
  flex: 0 0 10px;
}
</style>