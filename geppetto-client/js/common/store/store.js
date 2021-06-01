import {
  compose,
  createStore,
  applyMiddleware,
  combineReducers,
} from "redux";
import { callbacksMiddleware } from '../middleware/geppettoMiddleware';

import { initLayoutManager } from '../layout/LayoutManager';

// TO FIX: status is state
import geppettoLayoutReducer, { layoutInitialStatus } from '../reducer/geppettoLayout';
import geppettoClientReducer, { clientInitialStatus } from '../reducer/geppettoClient';

const initialState = {
  client: clientInitialStatus,
  layout: layoutInitialStatus
};

const staticReducers = {
  client: geppettoClientReducer,
  layout: geppettoLayoutReducer
}

const storeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export function createReducerManager (initialReducers) {
  // Create an object which maps keys to reducers
  const reducers = { ...initialReducers }

  // Create the initial combinedReducer
  let combinedReducer = combineReducers(reducers)

  // An array which is used to delete state keys when reducers are removed
  let keysToRemove = []

  return {
    getReducerMap: () => reducers,
    /*
     * The root reducer function exposed by this object
     * This will be passed to the store
     */
    reduce: (state, action) => {
      // If any reducers have been removed, clean up their state first
      if (keysToRemove.length > 0) {
        state = { ...state }
        for (let key of keysToRemove) {
          delete state[key]
        }
        keysToRemove = []
      }
      // Delegate to the combined reducer
      return combinedReducer(state, action)
    },

    // Adds a new reducer with the specified key
    add: (key, reducer) => {
      if (!key || reducers[key]) {
        return
      }
      // Add the reducer to the reducer mapping
      reducers[key] = reducer
      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers)
    },
  
    // Removes a reducer with the specified key
    remove: key => {
      if (!key || !reducers[key]) {
        return
      }
      // Remove it from the reducer mapping
      delete reducers[key]
      // Add the key to the list of keys to clean up
      keysToRemove.push(key)
      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers)
    }
  }
}

export default function newStore ( state = initialState) {
  const reduceManager = createReducerManager(staticReducers);

  const layoutManager = initLayoutManager(layoutInitialStatus)
  const middlewares = [callbacksMiddleware, layoutManager.middleware];

  const store = createStore(
    reduceManager.reduce,
    state,
    storeEnhancers(applyMiddleware(...middlewares))
  );

  store.reduceManager = reduceManager;
  return store;
}
