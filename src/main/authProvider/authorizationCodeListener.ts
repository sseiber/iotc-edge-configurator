export abstract class AuthorizationCodeListener {
    private internalHostname: string;

    // A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
    constructor(hostname: string) {
        this.internalHostname = hostname;
    }

    public get hostname(): string {
        return this.internalHostname;
    }

    public abstract registerProtocolAndStartListening(): Promise<string>;
    public abstract unregisterProtocol(): void;
}
