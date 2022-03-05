import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Form, Grid, Input, Message } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { useInfoDialog, showInfoDialog } from '../components/InfoDialogContext';
import { AppNavigationPaths } from '../App';

const AzureConfigPage: FC = observer(() => {
    const navigate = useNavigate();
    const infoDialogContext = useInfoDialog();
    const {
        sessionStore
    } = useStore();

    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [tenantId, setTenantId] = useState('');
    const [subscriptionId, setSubscriptionId] = useState('');
    const [redirectUri, setRedirectUri] = useState('');
    const [aadAuthority, setAadAuthority] = useState('');
    const [appProtocolName, setAppProtocolName] = useState('');

    useAsyncEffect(async isMounted => {
        const msalConfig = await sessionStore.getMsalConfig();

        if (!isMounted()) {
            return;
        }

        setClientId(msalConfig.clientId);
        setClientSecret(msalConfig.clientSecret);
        setTenantId(msalConfig.tenantId);
        setSubscriptionId(msalConfig.subscriptionId);
        setRedirectUri(msalConfig.redirectUri);
        setAadAuthority(msalConfig.aadAuthority);
        setAppProtocolName(msalConfig.appProtocolName);
    }, []);

    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
            case 'clientId':
                setClientId(e.target.value);
                break;
            case 'clientSecret':
                setClientSecret(e.target.value);
                break;
            case 'tenantId':
                setTenantId(e.target.value);
                break;
            case 'subscriptionId':
                setSubscriptionId(e.target.value);
                break;
            case 'redirectUri':
                setRedirectUri(e.target.value);
                break;
            case 'aadAuthority':
                setAadAuthority(e.target.value);
                break;
            case 'appProtocolName':
                setAppProtocolName(e.target.value);
                break;
        }
    };

    const onOk = async () => {
        if (!clientId
            || !tenantId
            || !subscriptionId
            || !redirectUri
            || !aadAuthority
            || !appProtocolName) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Azure MSAL configuration',
                description: 'Some of the required parameters were missing or incorrectly formatted.'
            });
        }
        else {
            const proceed = await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'confirm',
                title: 'Azure MSAL configuration',
                description: 'Changing the configuration will sign out of your current session',
                actionLabel: 'Continue'
            });

            if (proceed) {
                await sessionStore.setMsalConfig({
                    clientId,
                    clientSecret,
                    tenantId,
                    subscriptionId,
                    redirectUri,
                    aadAuthority,
                    appProtocolName
                });

                await sessionStore.signout();
                navigate(AppNavigationPaths.Root);
            }
        }
    };

    const onCancel = () => {
        navigate(AppNavigationPaths.Root);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure Resource Credentials</Message.Header>
                    </Message>
                    <Form>
                        <Form.Field>
                            <label>Application (client) id:</label>
                            <Input
                                value={clientId}
                                onChange={(e) => onFieldChange(e, 'clientId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Client secret:</label>
                            <Input
                                value={clientSecret}
                                onChange={(e) => onFieldChange(e, 'clientSecret')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Tenant id:</label>
                            <Input
                                value={tenantId}
                                onChange={(e) => onFieldChange(e, 'tenantId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Subscription id:</label>
                            <Input
                                value={subscriptionId}
                                onChange={(e) => onFieldChange(e, 'subscriptionId')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Redirect uri:</label>
                            <Input
                                value={redirectUri}
                                onChange={(e) => onFieldChange(e, 'redirectUri')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>AAD authority endpoint:</label>
                            <Input
                                value={aadAuthority}
                                onChange={(e) => onFieldChange(e, 'aadAuthority')}
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>App protocol:</label>
                            <Input
                                value={appProtocolName}
                                onChange={(e) => onFieldChange(e, 'appProtocolName')}
                            />
                        </Form.Field>
                    </Form>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button color={'green'} onClick={onOk}>OK</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default AzureConfigPage;
