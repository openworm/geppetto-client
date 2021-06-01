import { layoutActions } from '../actions/layout';

export const layoutInitialStatus = {
  "global": {
    "sideBorders": 8,
    "tabSetHeaderHeight": 26,
    "tabSetTabStripHeight": 26,
    "enableEdgeDock": false,
    "borderBarSize": 0
  },
  "borders": [
    {
      "type":"border",
      "location": "bottom",
      "children": []
    }
  ],
  "layout": {
    "type": "tabset",
    "weight": 100,
    "id": "root",
    "children": []
  }
};

function removeUndefined (obj) {
  return Object.keys(obj).forEach(key => obj[key] === undefined ? delete obj[key] : '');
}

export default function geppettoLayoutReducer ( state = {}, action ) {
  return ({
    ...state,
    ...layoutReducer(state, action)
  });
}

function layoutReducer (state, action) {
  switch (action.type) {
  case layoutActions.SET_LAYOUT: {
    return { ...state, ...action.data }
  }
  default:
    return state
  }
}
