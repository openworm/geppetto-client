import * as redux from "redux";
import { callbacksMiddleware } from './middleware/geppettoMiddleware';

import { initLayoutManager } from './layout/LayoutManager';
import EventManager from './EventManager';
import { layoutInitialState, LayoutState, layout, widgets } from './reducer/geppettoLayout';
import geppettoClientReducer, { clientInitialState, ClientState } from './reducer/geppettoClient';
import { WidgetMap, ComponentMap } from "./layout/model";
import TabsetIconFactory from "./layout/TabsetIconFactory";
import { reducerDecorator } from "./reducer/reducerDecorator"
import { GeppettoAction } from "@geppettoengine/geppetto-client/geppetto-client/js/common/actions";

declare var window: any;

interface GeppettoState{
  client: ClientState,
  layout: LayoutState,
  widgets: WidgetMap
}

const initialState: GeppettoState = {
  client: clientInitialState,
  layout: layoutInitialState,
  widgets: {}
};

const staticReducers = {
  client: geppettoClientReducer,
  layout,
  widgets
}

const storeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || redux.compose;


export function createStore( 
  reducers: redux.ReducersMapObject, 
  state: any, 
  enhancers: redux.Middleware[], 
  layout: {iconFactory?: TabsetIconFactory, baseLayout?: LayoutState, componentMap: ComponentMap}={componentMap: {}}): redux.Store<any, GeppettoAction> {

  const layoutManager = initLayoutManager(layout.baseLayout || layoutInitialState, layout.componentMap, layout.iconFactory)
  const allMiddlewares = [...enhancers, callbacksMiddleware, layoutManager.middleware];

  
 
  const store = redux.createStore(
    reducerDecorator(redux.combineReducers({...staticReducers, ...reducers})),
    {...initialState, ...state },
    storeEnhancers(redux.applyMiddleware(...allMiddlewares))
  );
  EventManager.setStore(store);

  return store;
}

export default createStore;
