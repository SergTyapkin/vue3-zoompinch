# Zoom-pinch Vue.js component

![Static Badge](https://img.shields.io/badge/Vue.js-components-green)
![npm](https://img.shields.io/npm/dt/%40sergtyapkin%2Fvue3-zoompinch)
![GithubCI](https://github.com/sergtyapkin/vue3-zoompinch/actions/workflows/deploy.yaml/badge.svg)

# [LIVE DEMO](https://sergtyapkin.github.io/vue3-zoompinch/)

🔥 Super easy light-weight and fast Vue.js component for zoom-pinch-pan-move inner element like in Google maps with really
much customable settings

> [!TIP]
> Component can store it's state into localStorage and restore state from it.
> To use it, just set the `localStorageUniqueName` prop!

> [!IMPORTANT]
> By default `gesture` controls are not enabled and wheel scrolling is scaling.
> If you want to enable touchpad gestures and moving by wheel scrolling, enable `gesture`

> [!IMPORTANT]
> Automatically uses:
> ```CSS
> width: 100%;
> height: 100%;
> ```

**Navigation:** <br>
[![Static Badge](https://img.shields.io/badge/Usage-blue)](#usage)
[![Static Badge](https://img.shields.io/badge/Props-blue)](#props)
[![Static Badge](https://img.shields.io/badge/Emits-blue)](#emits)
[![Static Badge](https://img.shields.io/badge/Methods-blue)](#methods)

---
<br>
<br>
<br>

# Usage
main.ts:
```JS
import '@sergtyapkin/vue3-zoompinch/style.css';
```
Any *.vue file:
```VUE
<template>
  <!-- ... -->
  <ZoomPinch
    centered
    mouse
    touch
    gesture
    :min-scale="0.2"
    :max-scale="10"
    @drag="(dx, dy) => yourOnDrag(dx, dy)"
    @move="(dx, dy) => yourOnMove(dx, dy)"
    @scale="(scaleDelta) => yourOnScale(scaleDelta)"
    @click-clean="(x, y) => yourOnClick(x, y)"
  >
    <!-- Any of your own inner HTML element. For example <img> -->
  </ZoomPinch>
</template>
```
```VUE
<script lang="ts">
  import ZoomPinch from '@sergtyapkin/vue3-zoompinch';
  
  export default {
    components: {ZoomPinch},
    
    methods: {
      yourOnDrag(dx: number, dy: number) {console.log("Dragged by:", dx, dy)},
      yourOnMove(dx: number, dy: number) {console.log("Moved by:", dx, dy)},
      yourOnScale(scaleDelta: number) {console.log("Scaled by:", scaleDelta)},
      yourOnClick(x: number, y: number) {console.log("Clicked on:", x, y)},
    }
  }
</script>
```


---
<br>
<br>
<br>

# Props

> [!TIP]
> All props are not required 🙃

## Controls

| Prop    | Type    | Default | Comments |
|---------|---------|---------|----------|
| mouse   | boolean | false   |          |
| touch   | boolean | false   |          |
| gesture | boolean | true    |          |

## Constraints

| Prop                        | Type                                                                                     | Default                                                         | Comments                                                                                                           |
|-----------------------------|------------------------------------------------------------------------------------------|-----------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| movableX                    | boolean                                                                                  | true                                                            |                                                                                                                    |
| movableY                    | boolean                                                                                  | true                                                            |                                                                                                                    |
| scalableX                   | boolean                                                                                  | true                                                            |                                                                                                                    |
| scalableY                   | boolean                                                                                  | true                                                            |                                                                                                                    |
| minScale                    | number?                                                                                  | undefined                                                       |                                                                                                                    |
| maxScale                    | number?                                                                                  | undefined                                                       |                                                                                                                    |
| minScaleIsObjectFitFill     | boolean                                                                                  | false                                                           | Sets minScale as like you write to inner object "object-fit: fill". Overlaps minScale                              |
| minScaleIsObjectFitContains | boolean                                                                                  | false                                                           | Sets minScale as like you write to inner object "object-fit: contains". Overlaps minScale, minScaleIsObjectFitFill |
| offsets                     | {<br/> left: number?,<br/> top: number?,<br/> right: number?,<br/> bottom: number?<br/>} | {<br/>left: 0,<br/> top: 0,<br/> right: 0,<br/> bottom: 0<br/>} |                                                                                                                    |
| isOffsetsScalable           | boolean                                                                                  | true                                                            | Offsets will scales as like them is a part of inner object                                                         |

## Features

| Prop                   | Type    | Default   | Comments |
|------------------------|---------|-----------|----------|
| localStorageUniqueName | string? | undefined |          |
| smoothScale            | boolean | true      |          |
| mouseInertiaEnabled    | boolean | true      |          |
| touchInertiaEnabled    | boolean | true      |          |

## Default values

| Prop            | Type    | Default | Comments                        |
|-----------------|---------|---------|---------------------------------|
| defaultX        | number? | 0       |                                 |
| defaultY        | number? | 0       |                                 |
| defaultCentered | boolean | false   | Overlaps `defaultX`, `defaultY` |
| defaultScale    | number? | 1       |                                 |

## Service

| Prop                       | Type    | Default   | Comments                                    |
|----------------------------|---------|-----------|---------------------------------------------|
| wheelSensitivityMultiplier | number  | 1         |                                             |
| resetOnInnerSizeChanged    | boolean | true      |                                             |
| resetOnDefaultsChanged     | boolean | true      |                                             |
| innerElementWidth          | number? | undefined | Overrides inner element width               |
| innerElementHeight         | number? | undefined | Overrides inner element height              |
| debug                      | boolean | false     | Draws a fixed window with `x`, `y`, `scale` |


---
<br>
<br>
<br>

# Emits
```JS
drag(dx: number, dy: number)
// Emits only when user drags and moves inner element 
```
```JS
move(dx: number, dy: number)
// Emits when user moves inner element or it moves with scaling
```
```JS
scale(scaleDelta: number)
// Emits with scaling
```
```JS
clickClear(x: number, y: number)
// Emits only if user clicks on element without any dragging
```

---
<br>
<br>
<br>

# Methods
```JS
reset(): void
// Reset translation and scale to defaults
```
```JS
getScale(): number
// Returns current scale
```
```JS
getTranslate(): {x: number, y: number}
// Returns current translation
```
