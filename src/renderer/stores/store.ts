import { createContext, useContext } from 'react';
import { ErrorStore } from './error';
import { MainStore } from './main';
import { SessionStore } from './session';
import { IotCentralStore } from './iotCentral';
import { IndustrialConnectStore } from './industrialConnect';

export interface IStore {
    errorStore: ErrorStore;
    mainStore: MainStore;
    sessionStore: SessionStore;
    iotCentralStore: IotCentralStore;
    industrialConnectStore: IndustrialConnectStore;
}

export const store: IStore = {
    errorStore: new ErrorStore(),
    mainStore: new MainStore(),
    sessionStore: new SessionStore(),
    iotCentralStore: new IotCentralStore(),
    industrialConnectStore: new IndustrialConnectStore()
};

export const StoreContext = createContext(store);
export const useStore = (): IStore => {
    return useContext(StoreContext);
};
