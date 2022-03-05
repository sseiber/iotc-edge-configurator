import { createContext, useContext } from 'react';
import { ErrorStore } from './error';
import { SessionStore } from './session';
import { IotCentralStore } from './iotCentral';

export interface IStore {
    errorStore: ErrorStore;
    sessionStore: SessionStore;
    iotCentralStore: IotCentralStore;
}
export const store: IStore = {
    errorStore: new ErrorStore(),
    sessionStore: new SessionStore(),
    iotCentralStore: new IotCentralStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
