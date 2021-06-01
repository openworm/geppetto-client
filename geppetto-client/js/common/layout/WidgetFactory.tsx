import * as React from 'react'

import { Widget } from './model';

export default class WidgetFactory {

  widgets: Map<string, Widget>;
  customBuilder: Function;

  constructor () {
    this.widgets = new Map();
    this.customBuilder = null;
  }

  /**
   * Widget configuration is the same we are using in the flexlayout actions
   *
   * @param { id, name, component, panelName, [instancePath], * } widgetConfig
   */

  factory (widgetConfig) {
    // With this lazy construction we avoid to trigger an update on every layout event.
    if (!this.widgets[widgetConfig.id]) {
      this.widgets[widgetConfig.id] = this.newWidget(widgetConfig);
    }
    return this.widgets[widgetConfig.id];
  }

  updateWidget (widgetConfig) {
    this.widgets[widgetConfig.id] = this.newWidget(widgetConfig);
    return this.widgets[widgetConfig.id];
  }

  setCustomBuilder (customFunction) {
    if (typeof customFunction === "function") {
      this.customBuilder = customFunction;
    }
  }

  newWidget (widgetConfig) {
    const component = widgetConfig.component;
    switch (component) {
    case "GenericComponent": {
        return <div></div>;
      }
    default: {
        if (this.customBuilder !== null) {
          this.customBuilder(widgetConfig);
        }
        // TODO: injector function from the application
      }
    }
  }
}
