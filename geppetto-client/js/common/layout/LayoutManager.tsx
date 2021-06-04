import * as React from 'react';
import * as FlexLayout from "@geppettoengine/geppetto-ui/flex-layout/src/index";
import Actions from "@geppettoengine/geppetto-ui/flex-layout/src/model/Actions";
import DockLocation from "@geppettoengine/geppetto-ui/flex-layout/src/DockLocation";
import Model from "@geppettoengine/geppetto-ui/flex-layout/src/model/Model";
import { WidgetStatus, Widget, ExtendedNode, ComponentMap } from "./model";
import { withStyles, createStyles } from '@material-ui/core/styles'
import WidgetFactory from "./WidgetFactory";
import TabsetIconFactory from "./TabsetIconFactory";
import defaultLayoutConfiguration from "./defaultLayout";
import { widget2Node, isEqual } from "./utils";
import * as GeppettoActions from '../actions';

import {
  layoutActions,
  setLayout
} from "./actions";

import { MINIMIZED_PANEL } from '.';

const styles = (theme) => createStyles({
  container: {
    position: 'relative',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  spacer: { width: theme.spacing(1) },
  flexlayout: { position: 'relative', flexGrow: 1 }
});

let instance: LayoutManager = null;

/**
 * Wraps the FlexLayout component in order to allow a declarative specification (widgets).
 * of the layout and the components displayed.
 *
 * Handles layout state update and layout import and export.
 *
 * @memberof Control
 */
class LayoutManager {
  model: Model;
  widgetFactory: WidgetFactory;
  tabsetIconFactory: TabsetIconFactory;
  store;
  layoutManager = this;
  enableMinimize = false;

  /**
   * @constructor
   * @param model
   * @param widgetFactory
   * @param widgets
   * @param tabsetIconFactory
   * @param enableMinimize
   */
  constructor(
    model,
    componentMap: ComponentMap,
    tabsetIconFactory: TabsetIconFactory = null,
    enableMinimize = false
  ) {
    this.model = FlexLayout.Model.fromJson(
      model ? model : defaultLayoutConfiguration
    );

    this.widgetFactory = new WidgetFactory(componentMap);
    this.tabsetIconFactory = tabsetIconFactory
      ? tabsetIconFactory
      : new TabsetIconFactory();
    this.middleware = this.middleware.bind(this);
    this.factory = this.factory.bind(this);
    this.enableMinimize = enableMinimize;
  }

  /**
   * Adds a widget to the layout.
   *
   * @param {Widget} widgetConfiguration widget to add
   */
  addWidget(widgetConfiguration: Widget) {
    if (this.getWidget(widgetConfiguration.id)) {
      return this.updateWidget(widgetConfiguration);
    }
    const { model } = this;
    let tabset = model.getNodeById(widgetConfiguration.panelName);
    if (tabset === undefined) {
      this.createTabSet(widgetConfiguration.panelName);
    }
    this.model.doAction(
      Actions.addNode(
        widget2Node(widgetConfiguration),
        widgetConfiguration.panelName,
        DockLocation.CENTER,
        widgetConfiguration.pos ? widgetConfiguration.pos : -1
      )
    );
  }

  /**
   * Handle rendering of tab set.
   *
   * @param panel
   * @param renderValues
   */
  onRenderTabSet = (panel, renderValues) => {
    if (panel.getType() === "tabset" && this.enableMinimize) {
      if (panel.getId() != 'leftPanel' && panel.getChildren().length > 0) {
        renderValues.buttons.push(<div key={panel.getId()} className="fa fa-window-minimize customIconFlexLayout"
                                       onClick={() => {
                                         this.minimizeWidget(panel.getActiveNode().getId())
                                       }}/>);
      }
    }
  }

  /**
   * Layout wrapper component
   *
   * @memberof Component
   *
   */
  Component = (layoutManager: LayoutManager) => ({ classes }) => (
    <div className={classes.container}>
      <div className={classes.flexlayout}>
        <FlexLayout.Layout
          model={this.model}
          factory={this.factory}
          // iconFactory={layoutManager.iconFactory.bind(this)}
          onAction={action => layoutManager.onAction(action)}
          onRenderTab={(node, renderValues) => layoutManager.onRenderTabSet(node, renderValues)}
        />
      </div>
    </div>
  );

  /**
   * Get the layout component.
   * @memberof Control
   */
  getComponent = () => withStyles(styles)(this.Component(this));

  /**
   * Create a new tab set.
   *
   * @param {string} tabsetID the id of the tab set
   * @private
   */
  private createTabSet(tabsetID) {
    // In case the tabset doesn't exist
    const { model } = this;
    const rootNode = model.getNodeById("root");

    let hrow = new FlexLayout.RowNode(model, {});
    hrow._setWeight(100);

    const tabset = new FlexLayout.TabSetNode(model, { id: tabsetID });
    tabset._setWeight(80);

    hrow._addChild(tabset);

    rootNode.getChildren().forEach(child => {
      if (child['getWeight']) {
        const newWeight = (child as FlexLayout.TabSetNode).getWeight() / 2;
        child._setWeight(newWeight);
        hrow._addChild(child);
      }
    });

    rootNode._removeAll();
    rootNode._addChild(hrow, 0);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 1000);
  }

  /**
   * Export a session.
   */
  exportSession(): { [id: string]: any } {
    const confs = {};
    const components = this.widgetFactory.getComponents();
    for (const wid in components) {
      confs[wid] = components[wid].exportSession();
    }
    return confs;
  }

  /**
   * Import a widget session.
   *
   * @param {string} widgetId id of widget
   * @param conf widget configuration
   */
  importWidgetSession(widgetId: string, conf: any) {
    const component = this.widgetFactory.getComponent(widgetId);
    if (component) {
      try {
        component.importSession(conf);
      } catch (e) {
        console.error('Error importing session for', widgetId, e)
      }
    } else {
      // The component may not be yet initialized when loading the session
      setTimeout(() => this.importWidgetSession(widgetId, conf), 100);
    }
  }

  /**
   * Import complete session.
   *
   * @param confs configuration map
   */
  importSession(confs: { [id: string]: any }): void {
    const imported = new Set();
    for (const wid in confs) {
      this.importWidgetSession(wid, confs[wid]);
      imported.add(wid);
    }

    // Some components may have a current status here but no state exported in the session file
    for (const wid in this.widgetFactory.getComponents()) {
      if (!imported.has(wid)) {
        this.importWidgetSession(wid, null);
      }
    }
  }

  /**
   * Layout manager Redux middleware.
   * Sets the layout from Redux actions.
   *
   * @memberof Control
   * @memberof Control
   */
  middleware = (store) => (next) => (action) => {
    this.store = store;
    this.widgetFactory.setStore(store)
    
    let nextAction = true;
    let nextSetLayout = true;


    switch (action.type) {
      case layoutActions.ADD_WIDGET: {
        this.addWidget(action.data);
        break;
      }
      case layoutActions.ADD_WIDGETS: {
        this.addWidgets(action.data);
        break;
      }
      case layoutActions.UPDATE_WIDGET: {
        this.updateWidget(action.data);
        break;
      }

      case layoutActions.DESTROY_WIDGET: {
        const widget = action.data;
        this.deleteWidget(widget);
        break;
      }

      case layoutActions.ACTIVATE_WIDGET: {
        action.data.status = WidgetStatus.ACTIVE;
        const widget = this.getWidget(action.data.id)
        widget.status = WidgetStatus.ACTIVE;
        this.updateWidget(widget);
        break;
      }
      case layoutActions.SET_WIDGETS: {
        const newWidgets: Map<string, Widget> = action.data;
        for (let widget of this.getWidgets()) {
          if (!newWidgets[widget.id]) {
            this.deleteWidget(widget);
          }
        }
        this.addWidgets(Object.values(newWidgets));
        break;

      }

      case layoutActions.SET_LAYOUT: {
        if (!isEqual(this.model.toJson(), action.data)) {
          this.model = FlexLayout.Model.fromJson(action.data);
        }
        break;
      }
      case GeppettoActions.IMPORT_APPLICATION_STATE: {
        const incomingState = action.data.redux.layout;
        this.model = FlexLayout.Model.fromJson(incomingState);
        this.importSession(action.data.sessions);

        nextSetLayout = false;
      }

      default: {
        nextSetLayout = false;
      }
    }

    if (nextAction) {
      next(action);
    }
    if (nextSetLayout) {
      next(setLayout(this.model.toJson()));
    }

  };

  /**
   * Add a list of widgets.
   *
   * @param {Array<Widget>} newWidgets list of widgets
   * @private
   */
  private addWidgets(newWidgets: Array<Widget>) {
    let actives = [];
    for (let widget of newWidgets) {
      if (widget.status == WidgetStatus.ACTIVE) {
        actives.push(widget.id);
      }
      this.addWidget(widget);
    }

    for (const active of actives) {
      this.model.doAction(FlexLayout.Actions.selectTab(active));
    }
  }

  /**
   * Delete a widget.
   *
   * @param widget
   * @private
   */
  private deleteWidget(widget: any) {
    this.model.doAction(Actions.deleteTab(widget.id));
  }

  /**
   * Return widgets.
   *
   * @private
   */
  private getWidgets(): Widget[] {
    return Object.values(this.store.getState().widgets)
  }

  /**
   * Handles state update related to actions in the flex layout
   * (e.g. select or move tab)
   *
   * @memberof Control
   * @param action
   */
  onAction(action) {
    const oldModel = this.model.toJson();
    let defaultAction = true;
    switch (action.type) {
      case Actions.SET_ACTIVE_TABSET:
        break;
      case Actions.SELECT_TAB:
        break;
      case Actions.DELETE_TAB: {
        if (this.getWidget(action.data.node).hideOnClose) {
          this.minimizeWidget(action.data.node);
          defaultAction = false;
        }
        break;
      }
      case Actions.MAXIMIZE_TOGGLE:
        // this.onActionMaximizeWidget(action);
        break;
      case Actions.ADJUST_SPLIT:
        break;
      case Actions.ADD_NODE: {
        // action.data.index = this.findWidgetInsertionIndex(action);
        break;
      }
      case Actions.MOVE_NODE: {

        break;
      }
      default: {
        this.model.doAction(action);
      }
    }
    if (defaultAction) {
      this.model.doAction(action);
    }


    const newModel = this.model.toJson();
    if (!isEqual(oldModel, newModel)) {
      this.store.dispatch(setLayout(newModel));
    }


    window.dispatchEvent(new Event("resize"));
  }

  /**
   * Return the id of a tabset based on passed action.
   *
   * @param action
   * @private
   */
  private getTabsetId(action) {
    const widgetId = action.data.fromNode;
    return this.model
      .getNodeById(widgetId)
      .getParent()
      .getId();
  }

  /**
   * Find a maximized widget.
   *
   * @private
   */
  private findMaximizedWidget() {
    return this.getWidgets().find(
      (widget) => widget && widget.status == WidgetStatus.MAXIMIZED
    );
  }

  /**
   * Get specific widget.
   *
   * @param id
   * @private
   */
  private getWidget(id): Widget {
    return this.store.getState().widgets[id]
  }

  /**
   * Update maximized widget based on action.
   *
   * @param action
   * @private
   */
  private updateMaximizedWidget(action) {
    const { model } = this;
    const maximizedWidget = this.findMaximizedWidget();
    // check if the current maximized widget is the same than in the action dispatched
    if (maximizedWidget && maximizedWidget.id == action.data.node) {
      // find if there exists another widget in the maximized panel that could take its place
      const panelChildren = model.getActiveTabset().getChildren();
      const index = panelChildren.findIndex(
        (child) => child.getId() == action.data.node
      );
    }
  }

  /**
   * Minimize a widget.
   *
   * @param widgetId
   * @private
   */
  private minimizeWidget(widgetId) {
    var updatedWidget = { ...this.getWidget(widgetId) };
    if (updatedWidget === undefined) {
      return;
    }
    updatedWidget.status = WidgetStatus.MINIMIZED;
    updatedWidget.defaultPanel = updatedWidget.panelName;
    updatedWidget.panelName = MINIMIZED_PANEL;
    this.updateWidget(updatedWidget);
    // this.model.doAction(FlexLayout.Actions.moveNode(widgetId, "border_bottom", FlexLayout.DockLocation.CENTER, 0));
  }

  /**
   * Update a widget.
   *
   * @param widget
   * @private
   */
  private updateWidget(widget: Widget) {
    const { model } = this;
    if (!widget) {
      debugger;
    }
    const previousWidget = this.getWidget(widget.id);
    if (previousWidget.status != widget.status) {
      if (previousWidget.status == WidgetStatus.MINIMIZED) {
        this.restoreWidget(widget);
      } else {
        this.moveWidget(widget);
      }
    }
    this.widgetFactory.updateWidget(widget);
    model.doAction(Actions.updateNodeAttributes(widget.id, widget2Node(widget)));
    if (widget.status == WidgetStatus.ACTIVE) {
      model.doAction(FlexLayout.Actions.selectTab(widget.id));
    }
  }

  /**
   * Create widget for node.
   *
   * @param node
   */
  factory(node) {
    return this.widgetFactory.factory(node.getConfig());
  }

  /**
   * Create icon for node.
   *
   * @param node
   */
  iconFactory(node) {
    // TODO move to newest flexlayout-react to add this functionality when needed
    return this.tabsetIconFactory.factory(node.getConfig());
  }

  /**
   * Restore widget.
   *
   * @param widget
   * @private
   */
  private restoreWidget(widget: Widget) {
    const { model } = this;
    widget.panelName = widget.defaultPanel;
    const panelName = widget.panelName;
    let tabset = model.getNodeById(panelName);
    if (tabset === undefined) {
      this.createTabSet(panelName);
    }
    this.moveWidget(widget);
  }

  private moveWidget(widget) {
    const { model } = this;
    model.doAction(
      FlexLayout.Actions.moveNode(
        widget.id,
        widget.panelName,
        FlexLayout.DockLocation.CENTER,
        widget.pos
      )
    );
    // Resize of canvas and SVG images
    window.dispatchEvent(new Event("resize"));
  }
}

export function initLayoutManager(model, componentMap: ComponentMap, iconFactory: TabsetIconFactory) {
  instance = new LayoutManager(model, componentMap, iconFactory);
  return instance;
}

export const getLayoutManagerInstance = () => instance;
