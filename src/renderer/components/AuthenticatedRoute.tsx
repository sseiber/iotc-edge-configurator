import React, { FC } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';

interface IAuthenticatedRoute {
    path: string;
    element: React.FC;
}

const AuthenticatedRoute: FC<IAuthenticatedRoute> = observer((props: IAuthenticatedRoute) => {
    const {
        path,
        element
    } = props;

    const {
        sessionStore
    } = useStore();

    if (sessionStore.authenticationState === AuthenticationState.Authenticated) {
        return (
            <Route path={path} element={element} />
        );
    }

    return (
        <Route path="*" element={<Navigate to="/" replace />} />
    );
});

export default AuthenticatedRoute;
