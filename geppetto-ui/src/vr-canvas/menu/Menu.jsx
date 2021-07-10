import React, { Component } from 'react';
import PropTypes from 'prop-types';
import 'aframe';
import 'aframe-slice9-component';
import '../aframe/menu-interactable';
import '../aframe/look-at-camera';
import { randomColor } from '../utilities/utils';

import {
  BACK_MENU,
  VISUAL_GROUPS,
  RUN_SIMULATION,
  FLIP_CAMERA,
} from '../Events';
import mainMenu from './mainMenu';
import {
  MAIN_MENU,
  VISUAL_GROUPS_MENU,
  NEW_DATA_MENU,
  SETTINGS_MENU,
} from './menuStates';

class Menu extends Component {
  render() {
    const { id, currentMenu, currentModel } = this.props;
    let menu;
    let menuTitle;
    let back = false;
    if (currentMenu === MAIN_MENU.id) {
      menu = mainMenu(currentModel);
      menuTitle = MAIN_MENU.title;
    } else if (currentMenu === VISUAL_GROUPS_MENU.id) {
      const visualGroupsMenu = [];
      // eslint-disable-next-line no-eval
      const visualGroups = eval(
        'network_CA1PyramidalCell.CA1_CG[0].getVisualGroups()'
      );
      for (let i = 0; i < visualGroups.length; i++) {
        const vg = visualGroups[i];
        visualGroupsMenu.push({
          text: vg.wrappedObj.name,
          color: randomColor(),
          event: VISUAL_GROUPS,
          evtDetail: i,
        });
      }
      menu = visualGroupsMenu;
      menuTitle = VISUAL_GROUPS_MENU.title;
      back = true;
    } else if (currentMenu === NEW_DATA_MENU.id) {
      menu = [
        {
          text: 'Pipette',
          color: randomColor(),
          event: RUN_SIMULATION,
          evtDetail: null,
        },
      ];
      menuTitle = NEW_DATA_MENU.title;
      back = true;
    } else if (currentMenu === SETTINGS_MENU.id) {
      menu = [
        {
          text: 'Flip Camera X',
          color: randomColor(),
          event: FLIP_CAMERA,
          evtDetail: 'x',
        },
        {
          text: 'Flip Camera Y',
          color: randomColor(),
          event: FLIP_CAMERA,
          evtDetail: 'y',
        },
        {
          text: 'Flip Camera Z',
          color: randomColor(),
          event: FLIP_CAMERA,
          evtDetail: 'z',
        },
      ];
      menuTitle = SETTINGS_MENU.title;
      back = true;
    }

    const buttonsMap = [];

    const shrink = menu.length > 6;
    let yPos = shrink ? 1.4 : 0;
    for (const b of menu) {
      buttonsMap.push({
        ...b,
        position: `0 ${yPos} 0.01`,
        width: b.text.length > 20 ? 1.9 : 1.3,
      });
      yPos -= shrink ? 0.4 : 0.5;
    }

    const titleYPos = shrink ? 1.8 : 1.2;

    const arrowButton = back ? (
      <a-triangle
        color="#FFF"
        class="collidable"
        mixin="button"
        position="-0.8 2.15 0.02"
        rotation="0 0 90"
        scale="0.15 0.15 0.15"
        menu-interactable={`id: ${id}; event: ${BACK_MENU}; evtDetail: ${null}`}
      />
    ) : null;

    return (
      <a-entity
        id="entity_menu"
        position="4 1.6 -3"
        look-at-camera={`id: ${id}`}
      >
        <a-entity
          id="menuBackground"
          mixin="slice"
          slice9="height: 5; width: 2; color: #171717"
        />

        {arrowButton}

        <a-entity
          id="title"
          text={`value: ${menuTitle}; color: #FAFAFA; width: 4; align: center`}
          position={`0 ${titleYPos} 0.01`}
        />

        {buttonsMap.map((button) => (
          <a-entity
            key={button.evtDetail}
            class="collidable"
            mixin="button"
            text={`value: ${button.text}; color: ${button.color}`}
            position={button.position}
            slice9={`width: ${button.width}; height: 0.3; color: #030303`}
            menu-interactable={`id: ${id}; event: ${button.event}; evtDetail: ${button.evtDetail}`}
          />
        ))}
      </a-entity>
    );
  }
}

Menu.propTypes = {
  id: PropTypes.string.isRequired,
  currentMenu: PropTypes.string.isRequired,
  currentModel: PropTypes.object.isRequired,
};

export default Menu;
