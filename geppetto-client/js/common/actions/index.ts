import { Action } from "redux";
export * from "./actions";
export * from "./layout";

export interface GeppettoAction extends Action<string> {
    data: any
}