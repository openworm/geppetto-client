const MAX_DELTA = 0.2;
const CLAMP_VELOCITY = 0.00001;
const KEYS = [
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
];
const KEYCODE_TO_CODE = {
  '38': 'ArrowUp',
  '37': 'ArrowLeft',
  '40': 'ArrowDown',
  '39': 'ArrowRight',
  '87': 'KeyW',
  '65': 'KeyA',
  '83': 'KeyS',
  '68': 'KeyD',
};
const { bind, shouldCaptureKeyEvent } = AFRAME.utils;

function isEmptyObject(keys) {
  let key;
  for (key in keys) {
    return false;
  }
  return true;
}

AFRAME.registerComponent('rig-wasd-controls', {
  schema: {
    acceleration: { default: 65 },
    adAxis: { default: 'x', oneOf: ['x', 'y', 'z'] },
    adEnabled: { default: true },
    adInverted: { default: false },
    easing: { default: 20 },
    enabled: { default: true },
    fly: { default: false },
    wsAxis: { default: 'z', oneOf: ['x', 'y', 'z'] },
    wsEnabled: { default: true },
    wsInverted: { default: false },
    orientationEl: { type: 'selector' },
  },
  init: function () {
    this.keys = {};
    this.wheel = {};

    this.position = {};
    this.velocity = new THREE.Vector3();

    // Bind methods and add event listeners.
    this.onBlur = bind(this.onBlur, this);
    this.onFocus = bind(this.onFocus, this);
    this.onKeyDown = bind(this.onKeyDown, this);
    this.onKeyUp = bind(this.onKeyUp, this);
    this.onWheel = bind(this.onWheel, this);
    this.onVisibilityChange = bind(this.onVisibilityChange, this);
    this.attachVisibilityEventListeners();
    this.getOrientationElement();
  },
  tick: function (time, delta) {
    const { data } = this;
    const { el } = this;
    const { position } = this;
    const { velocity } = this;

    if (
      !velocity[data.adAxis] &&
      !velocity[data.wsAxis] &&
      isEmptyObject(this.keys) &&
      isEmptyObject(this.wheel)
    ) {
      return;
    }

    // Update velocity.
    // eslint-disable-next-line no-param-reassign
    delta /= 1000;
    this.updateVelocity(delta);

    if (!velocity[data.adAxis] && !velocity[data.wsAxis]) {
      return;
    }

    // Get movement vector and translate position.
    const currentPosition = el.getAttribute('position');
    const movementVector = this.getMovementVector(delta);
    position.x = currentPosition.x + movementVector.x;
    position.y = currentPosition.y + movementVector.y;
    position.z = currentPosition.z + movementVector.z;
    el.setAttribute('position', position);
  },

  remove: function () {
    this.removeKeyEventListeners();
    this.removeVisibilityEventListeners();
  },

  play: function () {
    this.attachKeyEventListeners();
  },

  pause: function () {
    this.keys = {};
    this.removeKeyEventListeners();
  },

  getOrientationElement() {
    // If a orientation element was defined explicitly use it
    if (this.data.orientationEl) {
      this.orientationEl = this.data.orientationEl;
      return;
    }

    // If there is a camera on this element assume its the orientation element
    if (this.el.getAttribute('camera')) {
      this.orientationEl = this.el;
      return;
    }

    // If we still haven't found a camera, search through this elements children
    const childCamera = this.el.querySelector('[camera]');
    if (childCamera) {
      this.orientationEl = childCamera;
      return;
    }

    // No cameras found, just use this element
    this.orientationEl = this.el;
  },

  updateVelocity: function (delta) {
    let adSign;
    const { data } = this;
    const { keys } = this;
    const { velocity } = this;
    let wsSign;

    const { adAxis, wsAxis, acceleration } = data;

    // If FPS too low, reset velocity.
    if (delta > MAX_DELTA) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      return;
    }

    // Decay velocity.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] -= velocity[adAxis] * data.easing * delta;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] -= velocity[wsAxis] * data.easing * delta;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < CLAMP_VELOCITY) {
      velocity[adAxis] = 0;
    }
    if (Math.abs(velocity[wsAxis]) < CLAMP_VELOCITY) {
      velocity[wsAxis] = 0;
    }

    if (!data.enabled) {
      return;
    }

    // Update velocity using keys pressed.
    if (data.adEnabled) {
      adSign = data.adInverted ? -1 : 1;
      if (keys.KeyA || keys.ArrowLeft) {
        velocity[adAxis] -= adSign * acceleration * delta;
      }
      if (keys.KeyD || keys.ArrowRight) {
        velocity[adAxis] += adSign * acceleration * delta;
      }
    }
    if (data.wsEnabled) {
      wsSign = data.wsInverted ? -1 : 1;
      if (keys.KeyW || keys.ArrowUp || this.wheel.up) {
        velocity[wsAxis] -= wsSign * acceleration * delta;
        delete this.wheel.up;
      }
      if (keys.KeyS || keys.ArrowDown || this.wheel.down) {
        velocity[wsAxis] += wsSign * acceleration * delta;
        delete this.wheel.down;
      }
    }
  },
  getMovementVector: (function () {
    const directionVector = new THREE.Vector3(0, 0, 0);
    const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    return function (delta) {
      const rotation = this.orientationEl.getAttribute('rotation'); // this.el.getAttribute('rotation');
      const { velocity } = this;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);

      // Absolute.
      if (!rotation) {
        return directionVector;
      }

      const xRotation = this.data.fly ? rotation.x : 0;

      // Transform direction relative to heading.
      rotationEuler.set(
        THREE.Math.degToRad(xRotation),
        THREE.Math.degToRad(rotation.y),
        0
      );
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })(),

  attachVisibilityEventListeners: function () {
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  },

  removeVisibilityEventListeners: function () {
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  },

  attachKeyEventListeners: function () {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('wheel', this.onWheel);
  },

  removeKeyEventListeners: function () {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('wheel', this.onWheel);
  },

  onBlur: function () {
    this.pause();
  },

  onFocus: function () {
    this.play();
  },

  onVisibilityChange: function () {
    if (document.hidden) {
      this.onBlur();
    } else {
      this.onFocus();
    }
  },

  onKeyDown: function (event) {
    if (!shouldCaptureKeyEvent(event)) {
      return;
    }
    const code = event.code || KEYCODE_TO_CODE[event.keyCode];
    if (KEYS.indexOf(code) !== -1) {
      this.keys[code] = true;
    }
  },

  onKeyUp: function (event) {
    const code = event.code || KEYCODE_TO_CODE[event.keyCode];
    delete this.keys[code];
  },

  onWheel: function (event) {
    if (event.deltaY > 0) {
      this.wheel.down = true;
    } else if (event.deltaY < 0) {
      this.wheel.up = true;
    }
  },
});
