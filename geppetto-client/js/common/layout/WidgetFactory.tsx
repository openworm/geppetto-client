import * as React from 'react';
import { Store } from 'redux';

import { WidgetComponent, Widget, ComponentMap } from './model';

import { updateWidget } from './actions';

/**
 * Widget Factory. All components shown in the main flexible layout are instantiated here.
 *
 * @memberof Control
 */
class WidgetFactory {

  /**
   * Dict of widgets.
   */
  private widgets = {};

  private componentMap: ComponentMap = {};

  private store: Store<any>;

  // didn't found a way to make standard refs work here, so using a custom callback
  private refs: { [id: string]: React.RefObject<WidgetComponent> } = {};

  constructor(componentMap: ComponentMap) {
    this.widgets = {};
    this.componentMap = componentMap;
  }

  setStore(store: Store<any>) {
    this.store = store;
  }

  addComponentMapping(key, component) {
    this.componentMap[key] = component;
  }

  updateComponentMapping(componentMap: ComponentMap) {
    this.componentMap = { ...this.componentMap, ...componentMap }
  }


  private WidgetToComponent = ({ widgetConfig }: { widgetConfig: Widget }) => {
    this.refs[widgetConfig.id] = React.createRef();
    const Component = this.componentMap[widgetConfig.component] as any;
    const proto = Component.WrappedComponent ? Component.WrappedComponent.prototype: Component.prototype;
    const ref = proto.importSession ? {ref: this.refs[widgetConfig.id]}: {};

    // Note: the sessionChange is an option that is available to save components sessions within the widget itself
    // It's a more reacty way than using references and also works for functional components, but it's not 
    // possible to push a session update top-down, so it's the component that would need to know when its internal 
    // session data changed. Note that the session save/load is not a preferable way to implement application state
    // logic persistence, it's rather a workaround to catch what may escape form React/Redux control (e.g. canvas data)
    const sessionChange = (session) => {
      this.store.dispatch(updateWidget({ ...widgetConfig, session }));
    }
    return Component ?
      <Component
        key={widgetConfig.id}
        
        session={widgetConfig.session}
        onSessionChange={sessionChange}
        {...widgetConfig.config}
        {...ref}
      /> :
      <div>Error on widget configuration {widgetConfig.id}: no component matching "{widgetConfig.component}"</div>

  }

  /**
   * Widget configuration is the same we are using in the flexlayout actions
   *
   * { id, name, component, panelName, [instancePath], * } widgetConfig
   */
  factory(widgetConfig) {
    if (!this.widgets[widgetConfig.id]) {
      this.widgets[widgetConfig.id] = this.newWidget(widgetConfig);
    }

    return this.widgets[widgetConfig.id];
  }

  /**
   * Retrieves all components
   */
  getComponents(): { [id: string]: WidgetComponent } {
    const confs: { [id: string]: WidgetComponent } = {};
    for (const wid in this.refs) {
      const component = this.refs[wid].current;
      if (component && component.exportSession) {
        confs[wid] = component;
      }
    }
    return confs;
  }

  /**
   * Returns widget matching `widgetId`.
   *
   * @param {string} widgetId specific widget id
   */
  getComponent(widgetId: string) {
    return this.refs[widgetId]?.current;
  }

  /**
   * Updates a widget.
   *
   * @param widgetConfig
   */
  updateWidget(widgetConfig) {
    this.widgets[widgetConfig.id] = this.newWidget(widgetConfig);
    return this.widgets[widgetConfig.id];
  }

  /**
   * Creates a new widget according to `widgetConfig`.
   *
   * @param widgetConfig
   */
  private newWidget(widgetConfig) {
    const { WidgetToComponent } = this;
    return <WidgetToComponent widgetConfig={widgetConfig} />
  }
}

export default WidgetFactory;