import React, { FC } from 'react';
import { Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Menu, Grid, Image, Icon, Dropdown } from 'semantic-ui-react';
import { parse as qsParse } from 'query-string';
import { useStore } from './stores/store';
// import { AuthenticationState } from './stores/session';
// import AuthenticatedRoute from './components/AuthenticatedRoute';
import HomePage from './pages/HomePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InfoDialogServiceProvider } from './components/InfoDialogContext';

const App: FC = observer((props: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        sessionStore
    } = useStore();

    useAsyncEffect(async isMounted => {
        await sessionStore.getUserSessionInfo('');

        if (!isMounted()) {
            return;
        }

        let redirectPath = location.pathname;

        if (location.search) {
            const query = qsParse(location.search);

            redirectPath = query.redirectPath.toString() || `${redirectPath}${location.search}`;
        }

        navigate(redirectPath);
    }, []);

    let userNavItem = (
        <Menu.Item href="/">
            <Icon name="sign out alternate" />
            <span>&nbsp;&nbsp;Sign out</span>
        </Menu.Item>
    );

    if (sessionStore.displayName) {
        const trigger = (
            <span>
                <Icon name={'user'} /> {sessionStore.displayName}
            </span>
        );

        userNavItem = (
            <Dropdown item trigger={trigger}>
                <Dropdown.Menu>
                    <Dropdown.Item href="/">
                        <Icon name="sign out alternate" />
                        <span>&nbsp;&nbsp;Sign out</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown >
        );
    }

    const {
        children
    } = props;

    return (
        <ErrorBoundary>
            <InfoDialogServiceProvider>
                <Menu fixed="top" inverted color="grey" style={{ padding: '0em 5em' }}>
                    <Menu.Item as={Link} to={`/`} header>
                        <Image size="mini" src={`./assets/icons/64x64.png`} style={{ marginRight: '1.5em' }} />
                        Azure IoT Central Solution Builder
                    </Menu.Item>
                    <Menu.Menu position="right">
                        {userNavItem}
                    </Menu.Menu>
                </Menu>
                <Grid>
                    <Grid.Column>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                            {children}
                        </Routes>
                    </Grid.Column>
                </Grid>
                <Menu fixed="bottom" inverted color="grey" style={{ padding: '1em 5em' }} />
            </InfoDialogServiceProvider>
        </ErrorBoundary>
    );
});

export default App;
