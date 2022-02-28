import React, { FC } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Menu, Grid, Image, Icon, Dropdown } from 'semantic-ui-react';
import { useStore } from './stores/store';
import { InfoDialogServiceProvider } from './components/InfoDialogContext';
import { AuthenticationState } from './stores/session';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import HomePage from './pages/HomePage';
import AzureConfigPage from './pages/AzureConfigPage';
import IoTCentralPage from './pages/IoTCentral/IoTCentralPage';
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

            navigate('/iotcentral');
        }
        else {
            sessionStore.redirectPath = location.pathname;
        }
    }, []);

    const onClickSignin = async () => {
        const msalConfig = await sessionStore.getMsalConfig();
        if (!msalConfig
            || !msalConfig.clientId
            || !msalConfig.clientSecret
            || !msalConfig.tenantId
            || !msalConfig.subscriptionId
            || !msalConfig.redirectUri
            || !msalConfig.aadEndpointHost
            || !msalConfig.appProtocolName) {
            navigate('/azureconfig');
        }
        else {
            void sessionStore.signin('/iotcentral');
        }
    };

    const onEditAzureConfig = () => {
        navigate('/azureconfig');
    };

    const onClickSignout = async () => {
        await sessionStore.signout();
    };

    const logoMenuTitle = sessionStore.authenticationState === AuthenticationState.Authenticated ? `Apps` : `Azure IoT Central`;
    const logoMenuLink = sessionStore.authenticationState === AuthenticationState.Authenticated ? '/iotcentral' : '/';
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
                            <Route path="/" element={<HomePage />} />
                            <Route path="/azureconfig" element={<AzureConfigPage />} />
                            <Route path="/iotcentral"
                                element={
                                    <AuthenticatedRoute redirectTo="/">
                                        <IoTCentralPage />
                                    </AuthenticatedRoute>
                                }
                            />
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
