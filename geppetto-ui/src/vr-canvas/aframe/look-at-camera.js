AFRAME.registerComponent('look-at-camera', {
  schema: { id: { type: 'string' }, },

  tick: function () {
    const { el } = this;
    const { id } = this.data;
    const camera = document.getElementById(`${id}_camera`);
    el.object3D.lookAt(camera.object3D.position);
  },
});
