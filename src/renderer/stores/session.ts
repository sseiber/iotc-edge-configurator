// import { makeAutoObservable, runInAction } from 'mobx';
// FIX: xxx
const runInAction = (func: any) => {
    return func();
};

import { getUserSession } from '../apis/session';

export class SessionStore {
    // FIX: xxx
    // constructor() {
    //     makeAutoObservable(this);
    // }

    public userId = '';
    public displayName = '';
    public email = '';
    public authProvider = '';
    public redirectPath: string;

    public serviceError = '';

    public get isProduction(): boolean {
        return process.env.NODE_ENV === 'production';
    }

    // @ts-ignore (userId)
    public async getUserSessionInfo(userId: string): Promise<void> {
        try {
            const response = await getUserSession();
            const responsePayload = response.payload;

            if (responsePayload && responsePayload.status === 200) {
                runInAction(() => {
                    // this.authenticationState = AuthenticationState.Authenticated;
                    this.userId = response.payload.userId;
                    this.displayName = response.payload.displayName;
                    this.email = response.payload.email;
                    this.authProvider = response.payload.authProvider;
                });
            }
            else {
                runInAction(() => {
                    this.serviceError = responsePayload.statusMessage || response.message;
                });
            }

            // this.authenticationState = AuthenticationState.CouldNotAuthenticate;
        }
        catch (ex) {
            runInAction(() => {
                // this.authenticationState = AuthenticationState.CouldNotAuthenticate;
                this.userId = '';
                this.displayName = '';
                this.email = '';
                this.authProvider = '';

                this.serviceError = `An error occurred while attempting to get the currenet user session: ${ex.message}`;
            });
        }
    }
}
