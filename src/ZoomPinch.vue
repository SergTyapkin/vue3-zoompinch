<style scoped lang="stylus">
.root-draggable-component
  overflow hidden
  width 100%
  height 100%
  //cursor grab

  &.in-drag
    cursor grabbing

  &.in-scale
    //cursor zoom-in

    .transform-container
      transition transform 0.2s ease

  .transform-container
    position relative
    transform-origin 0 0
    transform translate(var(--translateX), var(--translateY)) scaleX(var(--scaleX)) scaleY(var(--scaleY))
    width fit-content
    height fit-content

  .debug
    font-size 1rem
    position fixed
    top 10px
    left 10px
    background #38383888
    padding 10px
    border-radius 5px
    border 2px solid white
    white-space pre
</style>

<template>
  <div
    class="root-draggable-component"
    :class="{
      'in-drag': isInDrag,
      'in-scale': isInScale,
    }"
    @mousedown.prevent.stop="onMouseDown"
    @touchstart="onTouchStart"
    @wheel.prevent.stop="onWheelScroll"
  >
    <div
      class="transform-container"
      :style="{
        '--scaleX': scalableX ? scale : 1,
        '--scaleY': scalableY ? scale : 1,
        '--translateX': -offsetX + 'px',
        '--translateY': -offsetY + 'px',
      }"
      ref="innerElement">
      <slot/>
    </div>

    <section class="debug" v-if="debug">
      <div>x: {{ offsetX }}</div>
      <div>y: {{ offsetY }}</div>
      <div>scale: {{ scale }}</div>
      <hr>
      <div>Min scale: {{ minScaleComputed }}</div>
      <div>Max scale: {{ maxScaleComputed }}</div>
      <hr>
      <div>moveOptions: {{JSON.stringify(moveOptions).replace(/([,{])/g, '$1\n').replace(/([}])/g, '\n$1')}}</div>
      <hr>
      <div>scaleOptions: {{JSON.stringify(scaleOptions).replace(/([,{])/g, '$1\n').replace(/([}])/g, '\n$1')}}</div>
      <hr>
      <div>innerElementSize: {{innerElementWidthComputed}}x{{innerElementHeightComputed}}</div>
    </section>
  </div>
</template>

<script lang="ts">
import {PropType} from 'vue';

const WHEEL_SCALE_SENSITIVITY = 0.003;
const WHEEL_SCALE_SPEEDUP = 1.5;
const WHEEL_TRANSLATION_SPEEDUP = 1.2;
const DELTA_LINE_MULTIPLIER = 8;
const DELTA_PAGE_MULTIPLIER = 24;
const MAX_WHEEL_DELTA = 24;
const DEFAULT_MAX_SCALE = 15;
const DEFAULT_MIN_SCALE = 0.05;
const SCALE_TRANSITION_DURATON_MS = 200;
const INERTIA_SENSIVITY = 0.5;
const INERTIA_DECREACE_MULTIPLIER = 0.6;
const INERTIA_MOVING_KILL_VAL = 0.02;

export default {
  emits: [
    'clickClean', // (elementX, elementY) click only if it wasn't dragging. Default "click" can be emitted many times and after dragging
    'drag', // (deltaX, deltaY) - emits when user drags screen
    'scale', // (scaleDelta) - emits when user scales screen
    'move', // (deltaX, deltaY) - emits when screen moves by drag or scale
  ],

  props: {
    mouse: {
      type: Boolean,
      default: true,
    },
    touch: {
      type: Boolean,
      default: true,
    },
    gesture: {
      type: Boolean,
      default: false,
    },
    localStorageUniqueName: {
      type: String,
      default: undefined,
    },
    scalableX: {
      type: Boolean,
      default: true,
    },
    scalableY: {
      type: Boolean,
      default: true,
    },
    movableX: {
      type: Boolean,
      default: true,
    },
    movableY: {
      type: Boolean,
      default: true,
    },
    wheelSensitivityMultiplier: {
      type: Number,
      default: 1,
    },
    maxScale: {
      type: Number,
      default: DEFAULT_MAX_SCALE,
    },
    minScale: {
      type: Number,
      default: DEFAULT_MIN_SCALE,
    },
    minScaleIsObjectFitFill: Boolean,
    minScaleIsObjectFitContains: Boolean,
    innerElementWidth: {
      type: Number,
      default: undefined,
    },
    innerElementHeight: {
      type: Number,
      default: undefined,
    },
    offsets: {
      type: Object as PropType<{ left?: number; top?: number; right?: number; bottom?: number }>,
      default: {},
    },
    defaultX: {
      type: Number,
      default: undefined,
    },
    defaultY: {
      type: Number,
      default: undefined,
    },
    defaultScale: {
      type: Number,
      default: undefined,
    },
    defaultCentered: {
      type: Boolean,
      default: false,
    },

    isOffsetsScalable: {
      type: Boolean,
      default: true,
    },
    mouseInertiaEnabled: {
      type: Boolean,
      default: true,
    },
    touchInertiaEnabled: {
      type: Boolean,
      default: true,
    },
    smoothScale: {
      type: Boolean,
      default: true,
    },
    resetOnInnerSizeChanged: {
      type: Boolean,
      default: true,
    },
    resetOnDefaultsChanged: {
      type: Boolean,
      default: true,
    },
    debug: Boolean,
  },

  data() {
    return {
      isInDrag: false,
      isInScale: false,

      scale: 1,
      offsetX: 0,
      offsetY: 0,

      moveOptions: {
        startOffset: {
          x: undefined as undefined | number,
          y: undefined as undefined | number,
        },
        startPos: {
          x: undefined as undefined | number,
          y: undefined as undefined | number,
        },
        currentMoveDelta: {
          x: undefined as undefined | number,
          y: undefined as undefined | number,
        },
        lastUpdatedTime: undefined as undefined | number,
        firstTouchIdentifier: undefined as undefined | number,
        isInInertialMoving: false,
      },

      scaleOptions: {
        touchCurrentDelta: undefined as undefined | number,
        currentCompensatingDelta: {
          x: undefined as undefined | number,
          y: undefined as undefined | number,
        },
      },

      resizeObserver: undefined as ResizeObserver | undefined,
      innerResizeObserver: undefined as ResizeObserver | undefined,
      scaleTimeoutObject: undefined as NodeJS.Timeout | undefined,

      innerElementWidthComputed: -1,
      innerElementHeightComputed: -1,
      minScaleComputed: undefined as undefined | number,
      maxScaleComputed: undefined as undefined | number,
    };
  },

  computed: {
    LocalStorageNames() {
      return {
        scale: this.$props.localStorageUniqueName + '-scale',
        offsetX: this.$props.localStorageUniqueName + '-offset-x',
        offsetY: this.$props.localStorageUniqueName + '-offset-y',
      }
    },
  },

  mounted() {
    window.addEventListener('gesturestart', this.onGestureStart);
    // @ts-expect-error
    window.addEventListener('gesturechange', this.onGestureChange);
    window.addEventListener('gestureend', this.onGestureEnd);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, {passive: false});
    this.resizeObserver = new ResizeObserver(this.updatePos);
    this.resizeObserver.observe(this.$el);
    this.innerResizeObserver = new ResizeObserver(this.updateInnerElementSizes);
    this.innerResizeObserver.observe(this.$refs.innerElement as HTMLElement);

    this.reset();
  },
  unmounted() {
    window.removeEventListener('gesturestart', this.onGestureStart);
    // @ts-expect-error
    window.removeEventListener('gesturechange', this.onGestureChange);
    window.removeEventListener('gestureend', this.onGestureEnd);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    this.$el && this.resizeObserver?.unobserve(this.$el);
    this.$refs.innerElement && this.innerResizeObserver?.unobserve(this.$refs.innerElement as HTMLElement);
  },

  methods: {
    // ------ Gesture events ---------
    onGestureStart(e: Event) {
      if (!this.gesture) {
        return;
      }
      e.preventDefault();
    },
    onGestureChange(e: Event & { scale: number }) {
      if (!this.gesture) {
        return;
      }
      e.preventDefault();
      // scale = this.dragCurrentLastScale * e.scale;
      this.setScale(e.scale, 0, 0, true);
    },
    onGestureEnd(e: Event) {
      if (!this.gesture) {
        return;
      }
      e.preventDefault();
    },

    // ------ Mouse events ---------
    onMouseDown(e: MouseEvent) {
      if (!this.mouse) {
        return;
      }
      this.handlerMoveStart(e.pageX, e.pageY);
    },
    onMouseMove(e: MouseEvent) {
      if (!this.mouse) {
        return;
      }
      this.handlerMove(e.pageX, e.pageY);
    },
    onMouseUp(e: MouseEvent) {
      if (!this.mouse) {
        return;
      }
      if (this.mouseInertiaEnabled) {
        this.startInertia();
      }
      this.handlerMoveEnd(e.pageX, e.pageY);
    },
    onWheelScroll(e: WheelEvent) {
      if (!this.mouse) {
        return;
      }
      if (!this.scalableX && !this.scalableY) {
        return;
      }
      // Normallize wheel
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && dx === 0) {
        [dx, dy] = [dy, dx];
      }
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        dx *= DELTA_LINE_MULTIPLIER;
        dy *= DELTA_LINE_MULTIPLIER;
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        dx *= DELTA_PAGE_MULTIPLIER;
        dy *= DELTA_PAGE_MULTIPLIER;
      }
      function limit(delta: number, max_delta: number) {
        return Math.sign(delta) * Math.min(max_delta, Math.abs(delta));
      }
      dx = limit(dx, MAX_WHEEL_DELTA);
      dy = limit(dy, MAX_WHEEL_DELTA);

      if (e.ctrlKey) { // gesture scale
        const scale = dy <= 0
          ? 1 - (WHEEL_SCALE_SPEEDUP * dy) / 100
          : 1 / (1 + (WHEEL_SCALE_SPEEDUP * dy) / 100);
        this.handlerScaleMultiply(scale, e.pageX, e.pageY);
      } else {
        if (!this.gesture) {
          let scaleDelta = -1 * e.deltaY * WHEEL_SCALE_SENSITIVITY * this.wheelSensitivityMultiplier;
          if (scaleDelta) {
            this.handlerScaleAdd(scaleDelta, e.pageX, e.pageY);
          }
        } else {
          const {
            x: allowedX,
            y: allowedY
          } = this.isCanMoveBy(dx * WHEEL_TRANSLATION_SPEEDUP, dy * WHEEL_TRANSLATION_SPEEDUP, this.offsetX, this.offsetY);
          this.offsetX += allowedX;
          this.offsetY += allowedY;
        }
      }
    },

    // ------ Touch events --------
    onTouchStart(e: TouchEvent) {
      if (!this.touch) {
        return;
      }
      if (e.touches.length > 1) {
        return;
      }
      this.moveOptions.firstTouchIdentifier = e.touches[0].identifier;
      this.handlerMoveStart(e.touches[0].pageX, e.touches[0].pageY);
    },
    onTouchMove(e: TouchEvent) {
      if (!this.touch) {
        return;
      }
      const bBox = this.$el.getBoundingClientRect();
      if (this.isInDrag || Array.from(e.touches).some(t => t.pageX > bBox.left && t.pageX < bBox.right && t.pageY > bBox.top && t.pageY < bBox.bottom)) {
        e.preventDefault();
      }

      if (!this.isInDrag) {
        return;
      }
      if (e.touches.length > 1) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dX = t2.pageX - t1.pageX;
        const dY = t2.pageY - t1.pageY;
        const delta = Math.sqrt(dX * dX + dY * dY);
        if (!this.scaleOptions.touchCurrentDelta) {
          this.scaleOptions.touchCurrentDelta = delta;
        }
        this.handlerScaleMultiply(
          delta / this.scaleOptions.touchCurrentDelta,
          e.touches[0].pageX,
          e.touches[0].pageY,
          true,
          true,
        );
        this.scaleOptions.touchCurrentDelta = delta;
      }
      this.handlerMove(e.touches[0].pageX, e.touches[0].pageY);
    },
    onTouchEnd(e: TouchEvent) {
      if (!this.touch) {
        return;
      }
      this.scaleOptions.touchCurrentDelta = undefined;
      if (Array.from(e.changedTouches).findIndex(t => t.identifier === this.moveOptions.firstTouchIdentifier) === -1) {
        return;
      }
      this.moveOptions.firstTouchIdentifier = undefined;
      if (this.touchInertiaEnabled) {
        this.startInertia();
      }
      this.handlerMoveEnd(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    },

    // ----- HANDLERS --------
    handlerMoveStart(x: number, y: number) {
      this.isInDrag = true;
      this.moveOptions.startPos.x = x;
      this.moveOptions.startPos.y = y;
      this.moveOptions.startOffset.x = this.offsetX;
      this.moveOptions.startOffset.y = this.offsetY;
    },
    handlerMoveEnd(x: number, y: number) {
      const bBox = this.$el.getBoundingClientRect();
      if (
        this.isInDrag && !this.moveOptions.currentMoveDelta.x && !this.moveOptions.currentMoveDelta.y &&
        x > bBox.left && x < bBox.right && y > bBox.top && y < bBox.bottom
      ) {
        this.$emit('clickClean', x - bBox.left, y - bBox.top); // emit clean click
      }

      this.isInDrag = false;
      if (!this.moveOptions.currentMoveDelta.x && !this.moveOptions.currentMoveDelta.y) { // not moved
        return;
      }

      this.moveOptions.startPos.x = undefined;
      this.moveOptions.startPos.y = undefined;
      this.moveOptions.currentMoveDelta.x = undefined;
      this.moveOptions.currentMoveDelta.y = undefined;
      this.scaleOptions.currentCompensatingDelta.x = undefined;
      this.scaleOptions.currentCompensatingDelta.y = undefined;
      this.scaleOptions.touchCurrentDelta = undefined;
    },
    handlerMove(x: number, y: number) {
      if (!this.isInDrag) {
        return;
      }

      let deltaX = this.moveOptions.startPos.x! - x;
      let deltaY = this.moveOptions.startPos.y! - y;
      const {x: allowedDeltaX, y: allowedDeltaY} = this.isCanMoveBy(
        deltaX,
        deltaY,
        this.moveOptions.startOffset.x!,
        this.moveOptions.startOffset.y!,
      );
      this.moveOptions.currentMoveDelta.x = allowedDeltaX;
      this.moveOptions.currentMoveDelta.y = allowedDeltaY;
      this.moveOptions.lastUpdatedTime = Date.now();
      this.offsetX =
        this.moveOptions.startOffset.x! +
        this.moveOptions.currentMoveDelta.x +
        (this.scaleOptions.currentCompensatingDelta.x ?? 0);
      this.offsetY =
        this.moveOptions.startOffset.y! +
        this.moveOptions.currentMoveDelta.y +
        (this.scaleOptions.currentCompensatingDelta.y ?? 0);

      if (this.movableX || this.movableY) {
        this.$emit('drag', deltaX, deltaY);
        this.$emit('move', deltaX, deltaY);
      }
    },

    handlerScaleMultiply(scaleDelta: number, pageX: number, pageY: number, isNoAnimation = false, isAddToVariable = false) {
      if (this.maxScaleComputed && this.scale * scaleDelta > this.maxScaleComputed) {
        scaleDelta = this.maxScaleComputed / this.scale;
      }
      if (this.minScaleComputed && this.scale * scaleDelta < this.minScaleComputed) {
        scaleDelta = this.minScaleComputed / this.scale;
      }

      let compensatingX = 0;
      let compensatingY = 0;
      const bBox = this.$el.getBoundingClientRect();
      const onElementX = pageX - bBox.x;
      const onElementY = pageY - bBox.y;
      if (this.movableX && this.scalableX) {
        compensatingX = (onElementX + this.offsetX) * (scaleDelta - 1);
      }
      if (this.movableY && this.scalableY) {
        compensatingY = (onElementY + this.offsetY) * (scaleDelta - 1);
      }
      this.setScale(this.scale * scaleDelta, compensatingX, compensatingY, isNoAnimation, isAddToVariable);
    },
    handlerScaleAdd(scaleDelta: number, pageX: number, pageY: number, isNoAnimation = false) {
      if (this.scale > 1) {
        scaleDelta *= Math.sqrt(this.scale);
      } else {
        scaleDelta *= this.scale * this.scale;
      }

      if (this.maxScaleComputed && this.scale + scaleDelta > this.maxScaleComputed) {
        scaleDelta = this.maxScaleComputed - this.scale;
      }
      if (this.minScaleComputed && this.scale + scaleDelta < this.minScaleComputed) {
        scaleDelta = this.minScaleComputed - this.scale;
      }

      let compensatingX = 0;
      let compensatingY = 0;
      const bBox = this.$el.getBoundingClientRect();
      const onElementX = pageX - bBox.x;
      const onElementY = pageY - bBox.y;
      if (this.movableX && this.scalableX) {
        compensatingX = ((onElementX + this.offsetX) / this.scale) * scaleDelta;
      }
      if (this.movableY && this.scalableY) {
        compensatingY = ((onElementY + this.offsetY) / this.scale) * scaleDelta;
      }
      this.setScale(this.scale + scaleDelta, compensatingX, compensatingY, isNoAnimation);
    },

    // ------- UTILS ---------
    startInertia() {
      if (this.moveOptions.isInInertialMoving) {
        return;
      }
      const fakeMove = (speedX: number, speedY: number) => {
        this.moveOptions.isInInertialMoving = true;
        requestAnimationFrame(() => {
          const dx = speedX;
          const dy = speedY;
          const {x: allowedDX, y: allowedDY} = this.isCanMoveBy(dx, dy, this.offsetX, this.offsetY);
          this.offsetX += allowedDX;
          this.offsetY += allowedDY;
          speedX *= INERTIA_DECREACE_MULTIPLIER;
          speedY *= INERTIA_DECREACE_MULTIPLIER;
          if (Math.abs(speedX) < INERTIA_MOVING_KILL_VAL && Math.abs(speedY) < INERTIA_MOVING_KILL_VAL) {
            this.moveOptions.isInInertialMoving = false;
            return;
          }
          fakeMove(speedX, speedY);
        });
      }
      const dT = Date.now() - (this.moveOptions.lastUpdatedTime ?? 0);
      const speedX = (this.moveOptions.currentMoveDelta.x ?? 0) / dT * INERTIA_SENSIVITY;
      const speedY = (this.moveOptions.currentMoveDelta.y ?? 0) / dT * INERTIA_SENSIVITY;
      if (dT && isFinite(speedX) && isFinite(speedY)) {
        fakeMove(speedX || 0, speedY || 0);
      }
    },

    loadNumberFromLocalStorage<T>(fieldName: string, defaultValue: T): number | T {
      const savedStr = localStorage.getItem(fieldName);
      const savedValue = Number(savedStr);
      if (!this.localStorageUniqueName || savedStr === null || isNaN(savedValue)) {
        return defaultValue;
      }
      return savedValue;
    },

    setScale(scale: number, compensatingX: number, compensatingY: number, isNoAnimation = false, isAddToVariable = false) {
      const scaleDelta = scale - this.scale;
      this.scale = scale;
      let {x: allowedDeltaX, y: allowedDeltaY} = this.isCanMoveBy(
        compensatingX,
        compensatingY,
        this.offsetX,
        this.offsetY,
      );
      if (isAddToVariable) {
        this.scaleOptions.currentCompensatingDelta.x = (this.scaleOptions.currentCompensatingDelta.x ?? 0) + allowedDeltaX;
        this.scaleOptions.currentCompensatingDelta.y = (this.scaleOptions.currentCompensatingDelta.y ?? 0) + allowedDeltaY;
      } else {
        this.offsetX += allowedDeltaX;
        this.offsetY += allowedDeltaY;
      }

      this.$emit('scale', scaleDelta);
      this.$emit('move', allowedDeltaX, allowedDeltaY);
      if (!isNoAnimation && this.smoothScale) {
        this.isInScale = true;
        clearTimeout(this.scaleTimeoutObject);
        this.scaleTimeoutObject = setTimeout(() => {
          this.isInScale = false;
        }, SCALE_TRANSITION_DURATON_MS);
      }
    },

    isCanMoveBy(dX: number, dY: number, startPosX: number, startPosY: number) {
      const offsets = {
        left: this.offsets.left,
        right: this.offsets.right,
        top: this.offsets.top,
        bottom: this.offsets.bottom,
      };

      const minX = -(offsets.left ?? 0) * (this.isOffsetsScalable ? this.scale : 1);
      const maxX =
        this.innerElementWidthComputed * this.scale - this.$el.clientWidth + (offsets.right ?? 0) * (this.isOffsetsScalable ? this.scale : 1);
      const minY = -(offsets.top ?? 0) * (this.isOffsetsScalable ? this.scale : 1);
      const maxY =
        this.innerElementHeightComputed * this.scale - this.$el.clientHeight + (offsets.bottom ?? 0) * (this.isOffsetsScalable ? this.scale : 1);

      let canMoveOnX = dX;
      const scaleX = this.scalableX ? this.scale : 1;
      if (
        !this.movableX ||
        !this.scalableX ||
        this.innerElementWidthComputed * scaleX <
        this.$el.clientWidth - (offsets.left ?? 0) * scaleX - (offsets.right ?? 0) * scaleX
      ) {
        canMoveOnX = -(this.$el.clientWidth - this.innerElementWidthComputed * scaleX) / 2 - startPosX;
      } else if (offsets.left !== undefined && startPosX + dX < minX) {
        canMoveOnX = minX - startPosX;
      } else if (offsets.right !== undefined && startPosX + dX > maxX) {
        canMoveOnX = maxX - startPosX;
      }

      let canMoveOnY = dY;
      const scaleY = this.scalableY ? this.scale : 1;
      if (
        !this.movableY ||
        !this.scalableY ||
        this.innerElementHeightComputed * scaleY <
        this.$el.clientHeight - (offsets.top ?? 0) * scaleY - (offsets.bottom ?? 0) * scaleY
      ) {
        canMoveOnY = -(this.$el.clientHeight - this.innerElementHeightComputed * scaleY) / 2 - startPosY;
      } else if (offsets.top !== undefined && startPosY + dY < minY) {
        canMoveOnY = minY - startPosY;
      } else if (offsets.bottom !== undefined && startPosY + dY > maxY) {
        canMoveOnY = maxY - startPosY;
      }
      return {x: canMoveOnX, y: canMoveOnY};
    },
    updateInnerElementSizes() {
      this.innerElementWidthComputed = this.innerElementWidth || (this.$refs.innerElement as HTMLElement)?.clientWidth || -1;
      this.innerElementHeightComputed = this.innerElementHeight || (this.$refs.innerElement as HTMLElement)?.clientHeight || -1;
      this.updateMinMaxScales();
      this.reset();
    },
    updateMinMaxScales() {
      let minScale = this.minScale;
      if (this.minScaleIsObjectFitContains) {
        minScale = Math.min(
          this.$el?.clientHeight / this.innerElementHeightComputed,
          this.$el?.clientWidth / this.innerElementWidthComputed,
        );
      } else if (this.minScaleIsObjectFitFill) {
        minScale = Math.max(
          this.$el?.clientHeight / this.innerElementHeightComputed,
          this.$el?.clientWidth / this.innerElementWidthComputed,
        );
      }
      this.minScaleComputed = minScale;
      this.maxScaleComputed = this.maxScale;
      this.scale = this.getScaleLimited(this.scale);
      this.updatePos();
    },

    getScaleLimited(scale: number) {
      return Math.max(Math.min(scale, this.maxScaleComputed ?? Infinity), this.minScaleComputed ?? -Infinity);
    },

    updatePos() {
      const {x, y} = this.isCanMoveBy(0, 0, this.offsetX, this.offsetY);
      this.offsetX += x;
      this.offsetY += y;
    },

    reset() {
      const scale = this.loadNumberFromLocalStorage(this.LocalStorageNames.scale, this.$props.defaultScale || 1);
      const defaultX = this.defaultCentered ? (this.innerElementWidthComputed * this.scale - this.$el.clientWidth) / 2 : this.$props.defaultX ?? 0;
      const defaultY = this.defaultCentered ? (this.innerElementHeightComputed * this.scale - this.$el.clientHeight) / 2 : this.$props.defaultY ?? 0;
      const loadedOffsetX = this.loadNumberFromLocalStorage(this.LocalStorageNames.offsetX, defaultX);
      const loadedOffsetY = this.loadNumberFromLocalStorage(this.LocalStorageNames.offsetY, defaultY);

      this.scale = this.getScaleLimited(scale);

      const {x: allowedDeltaX, y: allowedDeltaY} = this.isCanMoveBy(loadedOffsetX, loadedOffsetY, 0, 0);
      this.offsetX = allowedDeltaX;
      this.offsetY = allowedDeltaY;
    },
    getScale() {
      return this.scale;
    },
    getTranslate() {
      return {x: this.offsetX, y: this.offsetY};
    },
  },

  watch: {
    defaultX() {
      if (this.resetOnDefaultsChanged) {
        this.offsetX = this.defaultX ?? this.offsetX;
        this.updatePos();
      }
    },
    defaultY() {
      if (this.resetOnDefaultsChanged) {
        this.offsetY = this.defaultY ?? this.offsetY;
        this.updatePos();
      }
    },
    defaultCentered() {
      if (this.resetOnDefaultsChanged) {
        this.reset();
      }
    },
    defaultScale() {
      if (this.resetOnDefaultsChanged) {
        if (this.defaultScale || this.defaultScale === 0) {
          this.setScale(this.getScaleLimited(this.defaultScale), 0, 0);
        }
      }
    },
    resetOnDefaultsChanged() {
      if (this.resetOnDefaultsChanged) {
        this.reset();
      }
    },
    minScale() {
      this.updateMinMaxScales();
    },
    maxScale() {
      this.updateMinMaxScales();
    },
    minScaleIsObjectFitContains() {
      this.updateMinMaxScales();
    },
    minScaleIsObjectFitFill() {
      this.updateMinMaxScales();
    },
    offsetX() {
      if (this.localStorageUniqueName) {
        localStorage.setItem(this.LocalStorageNames.offsetX, String(this.offsetX));
      }
    },
    offsetY() {
      if (this.localStorageUniqueName) {
        localStorage.setItem(this.LocalStorageNames.offsetY, String(this.offsetY));
      }
    },
    scale() {
      if (this.localStorageUniqueName) {
        localStorage.setItem(this.LocalStorageNames.scale, String(this.scale));
      }
    },
    offsets() {
      if (this.resetOnDefaultsChanged) {
        this.updatePos();
      }
    },
    isOffsetsScalable() {
      this.updatePos();
    },
    resetOnInnerSizeChanged() {
      if (this.resetOnInnerSizeChanged) {
        this.reset();
      }
    },
    innerElementWidth() {
      if (this.resetOnInnerSizeChanged) {
        this.reset();
      }
    },
    innerElementHeight() {
      if (this.resetOnInnerSizeChanged) {
        this.reset();
      }
    },
  },
};
</script>
