import React, { FC } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Menu, Grid, Image, Icon, Dropdown } from 'semantic-ui-react';
import { useAsyncEffect } from 'use-async-effect';
import { useStore } from './stores/store';
import { InfoDialogServiceProvider } from './components/InfoDialogContext';
import { AppNavigationPaths } from '../main/contextBridgeTypes';
import { AuthenticationState } from './stores/session';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import HomePage from './pages/HomePage';
import AzureConfigPage from './pages/AzureConfigPage';
import IoTCentralPage from './pages/IoTCentral/IoTCentralPage';
import IIoTAdapterPage from './pages/IIoTAdapter/IIoTAdapterPage';
import ConfigAdapterPage from './pages/ConfigAdapter/ConfigAdapterPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { log } from './utils';

const ModuleName = 'App';

const App: FC = observer((props: any) => {
    const params = useParams();
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

        if (sessionStore.authenticationState === AuthenticationState.Authenticated) {
            log([ModuleName, 'info'], `Would redirect to: ${params.redirectpath || location.pathname}`);

            navigate(AppNavigationPaths.IoTCentral);
        }
        else {
            sessionStore.redirectPath = location.pathname;
        }
    }, []);

    const onClickSignin = async () => {
        const msalConfig = await sessionStore.getMsalConfig();
        if (!msalConfig
            || !msalConfig.clientId
            || !msalConfig.tenantId
            || !msalConfig.subscriptionId
            || !msalConfig.redirectUri
            || !msalConfig.aadAuthority
            || !msalConfig.appProtocolName) {
            navigate(AppNavigationPaths.AzureConfig);
        }
        else {
            void sessionStore.signin(AppNavigationPaths.IoTCentral);
        }
    };

    const onEditAzureConfig = () => {
        navigate(AppNavigationPaths.AzureConfig);
    };

    const onClickSignout = async () => {
        await sessionStore.signout();
    };

    const logoMenuTitle = sessionStore.authenticationState === AuthenticationState.Authenticated ? `IoT Central apps` : `Azure IoT Central`;
    const logoMenuLink = sessionStore.authenticationState === AuthenticationState.Authenticated ? AppNavigationPaths.IoTCentral : AppNavigationPaths.Root;
    const userNavItem = sessionStore.authenticationState === AuthenticationState.Authenticated
        ? (
            <Dropdown item trigger={(
                <span>
                    <Icon name={'user'} /> {sessionStore.displayName}
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignout}>
                        <Icon name="sign out alternate" />
                        <span>&nbsp;&nbsp;Sign out</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown >
        )
        : (
            // <Menu.Item onClick={onClickSignin}>
            //     <Icon name="sign in alternate" />
            //     <span>&nbsp;&nbsp;Sign in</span>
            // </Menu.Item>
            <Dropdown item trigger={(
                <span>
                    <Icon name={'sign in alternate'} /> Action
                </span>
            )}>
                <Dropdown.Menu>
                    < Dropdown.Item onClick={onEditAzureConfig}>
                        <Icon name="edit" />
                        <span>&nbsp;&nbsp;Edit Azure config</span>
                    </Dropdown.Item>
                    < Dropdown.Item onClick={onClickSignin}>
                        <Icon name="sign in alternate" />
                        <span>&nbsp;&nbsp;Sign in</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );

    const {
        children
    } = props;

    return (
        <ErrorBoundary>
            <InfoDialogServiceProvider>
                <Menu fixed="top" inverted color="grey" style={{ padding: '0em 5em' }}>
                    <Menu.Item as={Link} to={logoMenuLink} header>
                        <Image size="mini" src={`./assets/icons/64x64.png`} style={{ marginRight: '1.5em' }} />
                        {logoMenuTitle}
                    </Menu.Item>
                    <Menu.Menu position="right">
                        {userNavItem}
                    </Menu.Menu>
                </Menu>
                <Grid>
                    <Grid.Column>
                        <Routes>
                            <Route path={AppNavigationPaths.Root} element={<HomePage />} />
                            <Route path={AppNavigationPaths.AzureConfig} element={<AzureConfigPage />} />
                            <Route path={AppNavigationPaths.IoTCentral}
                                element={
                                    <AuthenticatedRoute redirectTo={AppNavigationPaths.Root}>
                                        <IoTCentralPage />
                                    </AuthenticatedRoute>
                                }
                            />
                            <Route path={AppNavigationPaths.IIoTAdapter}
                                element={
                                    <AuthenticatedRoute redirectTo={AppNavigationPaths.Root}>
                                        <IIoTAdapterPage />
                                    </AuthenticatedRoute>
                                }
                            />
                            <Route path={AppNavigationPaths.ConfigAdapter}
                                element={
                                    <AuthenticatedRoute redirectTo={AppNavigationPaths.Root}>
                                        <ConfigAdapterPage />
                                    </AuthenticatedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to={AppNavigationPaths.Root} replace />} />
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
