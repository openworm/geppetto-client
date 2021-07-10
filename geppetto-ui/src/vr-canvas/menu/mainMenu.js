import { MENU_CLICK } from '../Events';
import { VISUAL_GROUPS_MENU, NEW_DATA_MENU, SETTINGS_MENU } from './menuStates';

export default function mainMenu (model) {
  const newData = {
    event: MENU_CLICK,
    evtDetail: NEW_DATA_MENU.id,
    text: 'New Data',
    color: '#e0cb49',
  };
  const visualGroups = {
    event: MENU_CLICK,
    evtDetail: VISUAL_GROUPS_MENU.id,
    text: 'Apply Color Map',
    color: '#48BAEA',
  };
  const settings = {
    event: MENU_CLICK,
    evtDetail: SETTINGS_MENU.id,
    text: 'Settings',
    color: '#fff',
  };

  const ret = [];

  if (model.simulation) {
    ret.push(newData);
  }
  if (model.visualGroups) {
    ret.push(visualGroups);
  }
  ret.push(settings);
  return ret;
}
