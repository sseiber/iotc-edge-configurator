import { createContext, useContext } from 'react';
import { ErrorStore } from './error';
import { MainStore } from './main';
import { SessionStore } from './session';
import { IotCentralStore } from './iotCentral';

export interface IStore {
    errorStore: ErrorStore;
    mainStore: MainStore;
    sessionStore: SessionStore;
    iotCentralStore: IotCentralStore;
}

export const store: IStore = {
    errorStore: new ErrorStore(),
    mainStore: new MainStore(),
    sessionStore: new SessionStore(),
    iotCentralStore: new IotCentralStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
