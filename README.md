# Best Zoom-pinch Vue.js component

![Static Badge](https://img.shields.io/badge/Vue.js-components-green)
![npm](https://img.shields.io/npm/dt/%40sergtyapkin%2Fvue3-zoompinch)

# [LIVE DEMO]()

🔥 Light and fast Vue.js component for zoom-pinch, pan and translate inner element like in Google maps with really
much customable settings

> ![TIP]
> Component can store it's state into localStorage and restore state from it.
> To use it, just set the `localStorageUniqueName` prop!

> ![IMPORTANT]
> By default `gesture` controls are not enabled and wheel scrolling is scaling.
> If you want to enable touchpad gestures and moving by wheel scrolling, enable `gesture`

> ![IMPORTANT]
> Automatically uses:
> ```CSS
> width: 100%;
> height: 100%;
> ```
----

## 👉 Usage:

```VUE

<template>
  <!-- ... -->
  <ZoomPinch>
    <!-- Any of your own inner HTML element. For example <img> -->
  </ZoomPinch>
</template>
```

## ⚙️ Props

All props are not required 🙃

#### Controls

| Prop    | Type    | Default | Comments |
|---------|---------|---------|----------|
| mouse   | boolean | false   |          |
| touch   | boolean | false   |          |
| gesture | boolean | true    |          |

#### Constraints

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

#### Features

| Prop                   | Type    | Default   | Comments |
|------------------------|---------|-----------|----------|
| localStorageUniqueName | string? | undefined |          |
| smoothScale            | boolean | true      |          |
| mouseInertiaEnabled    | boolean | true      |          |
| touchInertiaEnabled    | boolean | true      |          |

#### Default values

| Prop            | Type    | Default | Comments                        |
|-----------------|---------|---------|---------------------------------|
| defaultX        | number? | 0       |                                 |
| defaultY        | number? | 0       |                                 |
| defaultCentered | boolean | false   | Overlaps `defaultX`, `defaultY` |
| defaultScale    | number? | 1       |                                 |

#### Service

| Prop                       | Type    | Default   | Comments                                    |
|----------------------------|---------|-----------|---------------------------------------------|
| wheelSensitivityMultiplier | number  | 1         |                                             |
| resetOnInnerSizeChanged    | boolean | true      |                                             |
| resetOnDefaultsChanged     | boolean | true      |                                             |
| innerElementWidth          | number? | undefined | Overrides inner element width               |
| innerElementHeight         | number? | undefined | Overrides inner element height              |
| debug                      | boolean | false     | Draws a fixed window with `x`, `y`, `scale` |


