import { Reducer } from 'redux';

import { IMPORT_APPLICATION_STATE, GeppettoAction } from '../actions'

export const reducerDecorator = (subReducer: Reducer) => (state, action: GeppettoAction) => {
  if (action.type === IMPORT_APPLICATION_STATE) {
    state = action.data.redux;
  }
  return subReducer(state, action)

}
