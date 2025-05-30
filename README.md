# Modals and Popups Vue.js components
![Static Badge](https://img.shields.io/badge/Vue.js-components-green)
![npm](https://img.shields.io/npm/dt/%40sergtyapkin%2Fmodals-popups)

Modals and popups components for your Vue.js app

----

Usage: In your entrypoint .vue component (may be `App.vue`):
```VUE

<template>
  <!-- Router component -->

  <Popups ref="popups"></Popups>
  <Modals ref="modals"></Modals>
</template>

<script>
  import {getCurrentInstance} from "vue";
  import {Modals, Popups} from "@sergtyapkin/modals-popups";

  export default {
    components: {Modals, Popups},

    mounted() {
      const global = getCurrentInstance().appContext.config.globalProperties;

      global.$modals = this.$refs.modals;
      global.$popups = this.$refs.popups;
      global.$app = this;
    },
  };
</script>
```

Now you can use in any child components:
```JS
this.$modals.alert(title, description='');
this.$modals.prompt(title, description='', defaultText='');
this.$modals.confirm(title, description='');
// Returns:
// 'modals.alert' -> null (window closed) / true ('OK' pressed)
// 'modals.prompt' -> null (window closed) / 'some text' ('OK' pressed)
// 'modals.confirm' -> null (window closed) / false ('No' pressed) / true ('Yes' pressed)

this.$popups.error(title, description='', timeToDisappear=3000);
this.$popups.alert(title, description='', timeToDisappear=3000);
this.$popups.success(title, description='', timeToDisappear=3000);
// Returns undefined
```
