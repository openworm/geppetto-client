import { MENU_CLICK } from '../Events';

function clicked(target, event, detail) {
  const evt = new CustomEvent(MENU_CLICK, {
    detail: {
      event: event,
      detail: detail,
    },
  });
  target.dispatchEvent(evt);
}

AFRAME.registerComponent('menu-interactable', {
  schema: {
    id: { type: 'string' },
    event: { type: 'string' },
    evtDetail: { type: 'string' },
  },
  init: function () {
    const { el } = this;
    const { id, event, evtDetail } = this.data;
    this.scene = document.getElementById(`${id}_scene`);

    el.addEventListener(
      'triggerdown',
      clicked.bind(this, this.scene, event, evtDetail)
    );

    el.addEventListener(
      'click',
      clicked.bind(this, this.scene, event, evtDetail)
    );
  },

  remove: function () {
    const { el } = this;

    el.removeEventListener('click', clicked);
    el.removeEventListener('triggerdown', clicked);
  },
});
