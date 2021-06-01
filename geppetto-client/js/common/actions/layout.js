import { WidgetStatus } from '../layout/model';

export const layoutActions = {
  SET_LAYOUT: 'SET_LAYOUT',
  SET_WIDGETS: 'SET_WIDGETS',
  UPDATE_WIDGET: 'UPDATE_WIDGET',
  ACTIVATE_WIDGET: 'ACTIVATE_WIDGET',
  ADD_WIDGET: 'ADD_WIDGET',
  ADD_WIDGETS: 'ADD_WIDGETS',
  RESET_LAYOUT: 'RESET_LAYOUT',
  DESTROY_WIDGET: 'DESTROY_WIDGET',
  ADD_PLOT_TO_EXISTING_WIDGET: 'ADD_PLOT_TO_EXISTING_WIDGET',
};

export const newWidget = ({ path, component, panelName, ...others }) => ({
  type: layoutActions.ADD_WIDGET,
  data: {
    id: path,
    instancePath: path,
    component: component,
    name: path,
    status: WidgetStatus.ACTIVE,
    panelName: panelName,
    ...others
  }
});

export const addWidget = widget => ({
  type: layoutActions.ADD_WIDGET,
  data: widget
});

export const addWidgets = widgets => ({
  type: layoutActions.ADD_WIDGETS,
  data: widgets
});

export const setWidgets = widgets => ({
  type: layoutActions.SET_WIDGETS,
  data: widgets
});

export const updateWidget = (newConf => ({
  type: layoutActions.UPDATE_WIDGET,
  data: newConf
}))

export const setLayout = (newLayout => ({
  type: layoutActions.SET_LAYOUT,
  data: newLayout
}))

export const minimizeWidget = id => ({
  type: layoutActions.UPDATE_WIDGET,
  data: {
    id,
    status: WidgetStatus.MINIMIZED
  }

});

export const maximizeWidget = id => ({
  type: layoutActions.UPDATE_WIDGET,
  data: {
    id,
    status: WidgetStatus.MAXIMIZED
  }
});
export const activateWidget = id => ({
  type: layoutActions.ACTIVATE_WIDGET,
  data: { id }

});

export const destroyWidget = id => ({
  type: layoutActions.DESTROY_WIDGET,
  data: { id }

});

export const resetLayout = { type: layoutActions.RESET_LAYOUT, };
