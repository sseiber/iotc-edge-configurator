import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Menu, Icon } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';

const AuthenticationButton: FC = observer(() => {
    const {
        sessionStore
    } = useStore();

    let authenticationButton;

    switch (sessionStore.authenticationState) {
        case AuthenticationState.Authenticated:
            authenticationButton = (
                <Menu.Item href="/api/v1/auth/signout">
                    <Icon name="sign in alternate" />
                    <span>&nbsp;&nbsp;Sign out</span>
                </Menu.Item>
            );
            break;

        case AuthenticationState.Unauthenticated:
        case AuthenticationState.CouldNotAuthenticate:
            authenticationButton = (
                <Menu.Item href="/api/v1/auth/signin?redirectPath=/user">
                    <Icon name="sign in alternate" />
                    <span>&nbsp;&nbsp;Sign in</span>
                </Menu.Item>
            );
            break;

        case AuthenticationState.Authenticating:
            authenticationButton = (
                <Menu.Item disabled>Signing in...</Menu.Item>
            );
            break;
    }

    return authenticationButton;
});

export default AuthenticationButton;
