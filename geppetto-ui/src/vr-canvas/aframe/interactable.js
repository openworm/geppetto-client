/* eslint-disable no-underscore-dangle */
import { object } from 'prop-types';
import { BRING_CLOSER } from '../Events';

function clicked(target, detail) {
  const event = new CustomEvent('mesh_click', { detail: detail });
  target.dispatchEvent(event);
}

AFRAME.registerComponent('interactable', {
  schema: {
    id: { type: 'string' },
    reversed: { default: true },
    closerDistance: { default: 1 },
  },
  init: function () {
    const { el } = this;
    const { id } = this.data;
    const scene = document.getElementById(`${id}_scene`);
    const model = document.getElementById(`${id}_model`);
    const camera = document.getElementById(`${id}_camera`);
    this.rhand = false;
    this.lhand = false;
    this.handOldPos = { rhand: null, lhand: null };
    this.baseRotation = {
      rhand: { x: 0, y: 0, z: 0 },
      lhand: { x: 0, y: 0, z: 0 },
    };
    this.previousHandRotation = {
      rhand: { x: 0, y: 0, z: 0 },
      lhand: { x: 0, y: 0, z: 0 },
    };
    this.originalPosition = null;
    this.parent = null;

    el.addEventListener('mouseenter', () => {
      const event = new CustomEvent('mesh_hover', { detail: el });
      scene.dispatchEvent(event);
    });

    el.addEventListener('mouseleave', () => {
      const event = new CustomEvent('mesh_hover_leave', { detail: el });
      scene.dispatchEvent(event);
    });

    el.addEventListener('triggerdown', () => {
      clicked(scene, el);
    });

    el.addEventListener('click', () => {
      clicked(scene, el);
    });

    el.addEventListener('gripdown', (evt) => {
      if (evt.detail === `${id}_rightHand`) {
        this.rhand = document.getElementById(evt.detail);
        this.baseRotation.rhand = el.object3D.rotation;
        this.previousHandRotation.rhand = { ...this.rhand.object3D.rotation };
      } else if (evt.detail === `${id}_leftHand`) {
        this.lhand = document.getElementById(evt.detail);
        this.baseRotation.lhand = el.object3D.rotation;
        this.previousHandRotation.lhand = { ...this.lhand.object3D.rotation };
      }
    });

    el.addEventListener('gripup', (evt) => {
      // if (evt.detail === `${id}_rightHand`) {
      //   this.rhand = null;
      // } else if (evt.detail === `${id}_leftHand`) {
      //   this.lhand = null;
      // }
      this.rhand = null;
      this.lhand = null;
    });

    el.addEventListener(BRING_CLOSER, () => {
      const { closerDistance } = this.data;
      if (el.selected || el.id === `${id}_model`) {
        if (this.originalPosition) {
          if (el.id !== `${id}_model`) {
            model.object3D.attach(el.object3D);
          }
          el.object3D.position.set(
            this.originalPosition.x,
            this.originalPosition.y,
            this.originalPosition.z
          );
          this.originalPosition = null;
        } else {
          this.originalPosition = { ...el.object3D.position };
          const closerPosition = this.getCloserPosition(
            el.object3D,
            camera.object3D.position,
            closerDistance
          );
          scene.object3D.attach(el.object3D);
          el.object3D.position.set(
            closerPosition.x,
            closerPosition.y,
            closerPosition.z
          );
        }
      }
    });
  },
  getCloserPosition(obj, cameraPos, closerDistance) {
    const bbox = new THREE.Box3().setFromObject(obj);
    const center = bbox.getCenter();
    const position = obj.getWorldPosition();
    const xDiff = position.x - center.x;
    const zDiff = this.getZDist(cameraPos, position, bbox, 'z');
    const yDiff = this.getYDist(cameraPos, position, bbox, 'y');
    const cPos = { ...cameraPos };
    cPos.z -= zDiff + closerDistance;
    cPos.y += yDiff;
    cPos.x += xDiff;
    return cPos;
  },
  tick: function () {
    const { el } = this;
    const { reversed, id } = this.data;
    if (el.selected || el.id === `${id}_model`) {
      if (this.rhand && this.lhand) {
        if (this.handOldPos.rhand && this.handOldPos.lhand) {
          if (this.isExpanding()) {
            el.object3D.scale.addScalar(0.001);
          } else {
            el.object3D.scale.addScalar(-0.001);
          }
        }
        this.handOldPos.rhand = { ...this.rhand.object3D.position };
        this.handOldPos.lhand = { ...this.lhand.object3D.position };
      } else if (this.rhand) {
        let rotate = {
          x:
            this.rhand.object3D.rotation.x - this.previousHandRotation.rhand._x,
          y:
            this.rhand.object3D.rotation.y - this.previousHandRotation.rhand._y,
          // z: this.rhand.object3D.rotation.z - this.previousHandRotation._z,
        };
        if (reversed) {
          rotate = {
            x: rotate.x * -1,
            y: rotate.y * -1,
            z: rotate.z * -1,
          };
        }
        el.object3D.rotation.x = this.baseRotation.rhand.x + rotate.x;
        el.object3D.rotation.y = this.baseRotation.rhand.y + rotate.y;
        this.previousHandRotation.rhand = { ...this.rhand.object3D.rotation };
      } else if (this.lhand) {
        let rotate = {
          // eslint-disable-next-line no-underscore-dangle
          x:
            this.lhand.object3D.rotation.x - this.previousHandRotation.lhand._x,
          // eslint-disable-next-line no-underscore-dangle
          y:
            this.lhand.object3D.rotation.y - this.previousHandRotation.lhand._y,
          // z: this.rhand.object3D.rotation.z - this.previousHandRotation._z,
        };
        if (reversed) {
          rotate = {
            x: rotate.x * -1,
            y: rotate.y * -1,
            z: rotate.z * -1,
          };
        }
        el.object3D.rotation.x = this.baseRotation.lhand.x + rotate.x;
        el.object3D.rotation.y = this.baseRotation.lhand.y + rotate.y;
        this.previousHandRotation.lhand = { ...this.lhand.object3D.rotation };
      }
    }
  },

  isExpanding() {
    const rightXGrowing =
      this.rhand.object3D.position.x - this.handOldPos.rhand.x >= 0;
    const leftXDecreasing =
      this.lhand.object3D.position.x - this.handOldPos.lhand.x <= 0;
    return rightXGrowing && leftXDecreasing;
  },

  getZDist(cameraPos, objPos, objBox, axis) {
    const diff1 = Math.abs(cameraPos[axis] - objBox.min[axis]);
    const diff2 = Math.abs(cameraPos[axis] - objBox.max[axis]);
    const closerDist = diff1 < diff2 ? objBox.min[axis] : objBox.max[axis];
    return Math.abs(objPos[axis] - closerDist);
  },

  getYDist(cameraPos, objPos, objBox, axis) {
    const center = objBox.getCenter();
    const diff = Math.abs(objPos[axis] - center[axis]);
    if (cameraPos[axis] - diff < 0) {
      return objPos[axis] - objBox.min[axis] - cameraPos[axis];
    }
    return diff - cameraPos[axis];
  },

  convertToLocalCoordinates(newWorldPosition, obj) {
    const localPosition = obj.position;
    const worldPosition = obj.getWorldPosition();
    newWorldPosition.x =
      (newWorldPosition.x * localPosition.x) / worldPosition.x;
    newWorldPosition.y =
      (newWorldPosition.y * localPosition.y) / worldPosition.y;
    newWorldPosition.z =
      (newWorldPosition.z * localPosition.z) / worldPosition.z;
    return newWorldPosition;
  },
});
