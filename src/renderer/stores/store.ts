import { createContext, useContext } from 'react';
import { ErrorStore } from './error';
import { SessionStore } from './session';
import { IiotAdapterStore } from './iiotAdapter';

export interface IStore {
    errorStore: ErrorStore;
    sessionStore: SessionStore;
    iiotAdapterStore: IiotAdapterStore;
}
export const store: IStore = {
    errorStore: new ErrorStore(),
    sessionStore: new SessionStore(),
    iiotAdapterStore: new IiotAdapterStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
