import { makeAutoObservable, runInAction } from 'mobx';

export enum ErrorTypes {
    ExceptionError = 'ExceptionError',
    MessageError = 'MessageErorr'
}

export interface IErrorResult {
    result: boolean;
    type: ErrorTypes;
    error: any;
}

export class ErrorStore {
    constructor() {
        makeAutoObservable(this);
    }

    public shouldShowInternal = false;
    public title = 'Error';
    public message: string;

    public get shouldShow(): boolean {
        return this.shouldShowInternal;
    }

    public set shouldShow(value: boolean) {
        runInAction(() => {
            this.shouldShowInternal = value;
        });
    }

    public showExceptionError(error: Error): void {
        runInAction(() => {
            this.shouldShowInternal = true;
            this.message = `Unexpected error: ${error.message}`;
        });
    }

    public showError(title: string, message: string): void {
        runInAction(() => {
            this.shouldShowInternal = true;
            this.title = title;
            this.message = message;
        });
    }
}
