<style lang="stylus">
html
  overflow-x hidden
  overflow-y hidden

*
  box-sizing border-box
  margin 0
  padding 0

body
  position relative
  overflow-x hidden
  overflow-y scroll
  width 100vw
  height 100vh
  margin 0
  padding 0
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #fff
  text-rendering optimizeLegibility
  color-scheme dark
  background #1b1b1b
  border none
  outline none
  font-synthesis none
  -webkit-overflow-scrolling touch
  font-family Roboto, Arial, SansSerif, Monospace

#app
  display flex
  padding 30px
  width 100%
  height 100%
  min-height 100vh
  gap 20px
  @media(max-width: 700px)
    flex-direction column
</style>

<style lang="stylus" scoped>
.zoom-pinch-element
  border-radius 15px
  box-shadow 0 0 20px black
  position relative
  height calc(100vh - 60px)
  flex 1
  &.with-bg
    background #2b2b2b linear-gradient(-20deg, mix(red, transparent, 30%), mix(black, transparent, 30%))
    &::before
      content ""
      position absolute
      inset 0
      opacity 0.1
      background url(./earth-icon.svg)
      background-size 300px 300px
  .image
    width 2000px
    height 1000px
    background #383838

.options
  flex 1
  max-width 400px
  border-radius 15px
  padding 20px
  box-shadow 0 0 20px black
  background #2b2b2b
  height fit-content
  padding-bottom 80px

  section
    border-bottom 1px solid #4b4b4b
    padding 20px 0
    header
      font-size 1.8rem
      letter-spacing 0.5px
    label
      color #c2c2c2
      display flex
      justify-content space-between
      align-items center
      gap 10px
      font-size 1rem
      transition color 0.2s ease
      padding 5px 0
      cursor pointer
      &:hover
        color #fff
        input:not([disabled])
          background #4f4f4f
      small
        color #838383
        white-space wrap
        flex 1
      input
        align-self stretch
        padding 5px 8px
        border-radius 5px
        background #3d3d3d
        border none
        font-size 1rem
        transition background 0.2s ease
        &[type=checkbox]
          width 1.5rem
        &[disabled]
          opacity 0.3
  button
    margin-top 20px
    padding 10px
    border-radius 5px
    border none
    outline none
    font-size 1.5rem
    background #a90000
    cursor pointer
    transition background 0.2s ease
    margin-right 10px
    &:hover
      background #d20000
</style>

<template>
  <section class="options">
    <section>
      <header>Controls</header>
      <label>Mouse <input type="checkbox" v-model="zoomPinchOptions.mouse"></label>
      <label>Touch <input type="checkbox" v-model="zoomPinchOptions.touch"></label>
      <label>Gesture <small>use for wheel = move and touchpad gestures</small><input type="checkbox" v-model="zoomPinchOptions.gesture"></label>
    </section>
    <section>
      <header>Constraints</header>
      <label>Movable X <input type="checkbox" v-model="zoomPinchOptions.movableX"></label>
      <label>Movable Y <input type="checkbox" v-model="zoomPinchOptions.movableY"></label>
      <label>Scalable X <input type="checkbox" v-model="zoomPinchOptions.scalableX"></label>
      <label>Scalable Y <input type="checkbox" v-model="zoomPinchOptions.scalableY"></label>
      <label>Min scale <input type="number" v-model="zoomPinchOptions.minScale" :disabled="zoomPinchOptions.minScaleIsObjectFitFill || zoomPinchOptions.minScaleIsObjectFitContains"></label>
      <label>Max scale <input type="number" v-model="zoomPinchOptions.maxScale"></label>
      <label>Min scale is like <br>object-fit: fill <small>(overlaps minScale)</small><input type="checkbox" v-model="zoomPinchOptions.minScaleIsObjectFitFill" :disabled="zoomPinchOptions.minScaleIsObjectFitContains"></label>
      <label>Min scale is like <br>object-fit: contains <small>(overlaps minScale, object-fit: fill)</small><input type="checkbox" v-model="zoomPinchOptions.minScaleIsObjectFitContains"></label>
    </section>
    <section>
      <header>Offsets</header>
      <label>Offsets scalable <input type="checkbox" v-model="zoomPinchOptions.isOffsetsScalable"></label>
      <label>Left <input type="number" v-model="zoomPinchOptions.offsets.left"></label>
      <label>Top <input type="number" v-model="zoomPinchOptions.offsets.top"></label>
      <label>Right <input type="number" v-model="zoomPinchOptions.offsets.right"></label>
      <label>Bottom <input type="number" v-model="zoomPinchOptions.offsets.bottom"></label>
    </section>
    <section>
      <header>Features</header>
      <label>Local storage name <input type="text" v-model="zoomPinchOptions.localStorageUniqueName"></label>
      <label>Smooth scale <input type="checkbox" v-model="zoomPinchOptions.smoothScale"></label>
      <label>Mouse inertia <input type="checkbox" v-model="zoomPinchOptions.mouseInertiaEnabled"></label>
      <label>Touch inertia <input type="checkbox" v-model="zoomPinchOptions.touchInertiaEnabled"></label>
    </section>
    <section>
      <header>Default values</header>
      <label>x <input type="number" v-model="zoomPinchOptions.defaultX" :disabled="zoomPinchOptions.defaultCentered"></label>
      <label>y <input type="number" v-model="zoomPinchOptions.defaultY" :disabled="zoomPinchOptions.defaultCentered"></label>
      <label>Centered <small>(overlaps x, y)</small> <input type="checkbox" v-model="zoomPinchOptions.defaultCentered"></label>
      <label>scale <input type="number" v-model="zoomPinchOptions.defaultScale"></label>
      <label>Reset on defaults changed <input type="checkbox" v-model="zoomPinchOptions.resetOnDefaultsChanged"></label>
    </section>
    <section>
      <header>Service</header>
      <label>Wheel sensitivity <input type="number" v-model="zoomPinchOptions.wheelSensitivityMultiplier"></label>
      <label>Reset on inner size changed <input type="checkbox" v-model="zoomPinchOptions.resetOnInnerSizeChanged"></label>
      <label>Inner element width <input type="number" v-model="zoomPinchOptions.innerElementWidth"></label>
      <label>Inner element height <input type="number" v-model="zoomPinchOptions.innerElementHeight"></label>
      <label>Debug <input type="checkbox" v-model="zoomPinchOptions.debug"></label>
      <label>With custom background <input type="checkbox" v-model="withBackground"></label>
    </section>

    <button @click="resetZoomPinch">Reset</button>
  </section>

  <ZoomPinch
    :local-storage-unique-name="zoomPinchOptions.localStorageUniqueName"

    :mouse="zoomPinchOptions.mouse"
    :touch="zoomPinchOptions.touch"
    :gesture="zoomPinchOptions.gesture"

    :debug="zoomPinchOptions.debug"
    :smooth-scale="zoomPinchOptions.smoothScale"

    :movable-x="zoomPinchOptions.movableX"
    :movable-y="zoomPinchOptions.movableY"
    :scalable-x="zoomPinchOptions.scalableX"
    :scalable-y="zoomPinchOptions.scalableY"
    :min-scale="zoomPinchOptions.minScale"
    :min-scale-is-object-fit-fill="zoomPinchOptions.minScaleIsObjectFitFill"
    :min-scale-is-object-fit-contains="zoomPinchOptions.minScaleIsObjectFitContains"
    :max-scale="zoomPinchOptions.maxScale"

    :offsets="zoomPinchOptions.offsets"
    :is-offsets-scalable="zoomPinchOptions.isOffsetsScalable"

    :mouse-inertia-enabled="zoomPinchOptions.mouseInertiaEnabled"
    :touch-inertia-enabled="zoomPinchOptions.touchInertiaEnabled"

    :default-x="zoomPinchOptions.defaultX"
    :default-y="zoomPinchOptions.defaultY"
    :default-scale="zoomPinchOptions.defaultScale"
    :default-centered="zoomPinchOptions.defaultCentered"
    :reset-on-defaults-changed="zoomPinchOptions.resetOnDefaultsChanged"
    :reset-on-inner-size-changed="zoomPinchOptions.resetOnInnerSizeChanged"
    :inner-element-width="zoomPinchOptions.innerElementWidth"
    :inner-element-height="zoomPinchOptions.innerElementHeight"
    ref="zoompinch"
    class="zoom-pinch-element"
    :class="{'with-bg': withBackground}"
  >
    <img class="image" src="./example-bus.svg" alt="" />
  </ZoomPinch>
</template>

<script lang="ts">
import ZoomPinch from "../src/ZoomPinch.vue";

export default {
  components: {ZoomPinch},

  data() {
    return {
      zoomPinchOptions: {
        localStorageUniqueName: '',
        scalableX: true,
        scalableY: true,
        movableX: true,
        movableY: true,
        wheelSensitivityMultiplier: 1,
        maxScale: 10,
        minScale: 0.2,
        minScaleIsObjectFitFill: false,
        minScaleIsObjectFitContains: false,
        offsets: {
          left: 200,
          top: 200,
          right: 200,
          bottom: 200,
        },
        defaultX: 300,
        defaultY: 300,
        defaultScale: 1,
        defaultCentered: true,

        isOffsetsScalable: true,
        mouseInertiaEnabled: true,
        touchInertiaEnabled: true,
        resetOnDefaultsChanged: true,
        resetOnInnerSizeChanged: true,

        innerElementWidth: undefined,
        innerElementHeight: undefined,

        debug: true,
        mouse: true,
        touch: true,
        gesture: false,
        smoothScale: true,
      },

      withBackground: true,
    }
  },

  methods: {
    resetZoomPinch() {
      (this.$refs.zoompinch as typeof ZoomPinch).reset();
    },
  }
};
</script>
