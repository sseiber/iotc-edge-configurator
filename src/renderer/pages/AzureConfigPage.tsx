import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Form, Grid, Input, Message } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { useInfoDialog, showInfoDialog } from '../components/InfoDialogContext';

const AzureConfigPage: FC = observer(() => {
    const navigate = useNavigate();
    const infoDialogContext = useInfoDialog();
    const {
        sessionStore
    } = useStore();

    const [clientId, setClientId] = useState('');
    const [tenantId, setTenantId] = useState('');
    const [redirectUri, setRedirectUri] = useState('');
    const [aadEndpointHost, setAadEndpointHost] = useState('');
    const [appProtocolName, setAppProtocolName] = useState('');

    useAsyncEffect(async isMounted => {
        const msalConfig = await sessionStore.getMsalConfig();

        if (!isMounted()) {
            return;
        }

        setClientId(msalConfig.clientId);
        setTenantId(msalConfig.tenantId);
        setRedirectUri(msalConfig.redirectUri);
        setAadEndpointHost(msalConfig.aadEndpointHost);
        setAppProtocolName(msalConfig.appProtocolName);
    }, []);

    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
            case 'clientId':
                setClientId(e.target.value);
                break;
            case 'tenantId':
                setTenantId(e.target.value);
                break;
            case 'redirectUri':
                setRedirectUri(e.target.value);
                break;
            case 'aadEndpointHost':
                setAadEndpointHost(e.target.value);
                break;
            case 'appProtocolName':
                setAppProtocolName(e.target.value);
                break;
        }
    };

    const onOk = async () => {
        if (!clientId
            || !tenantId
            || !redirectUri
            || !aadEndpointHost
            || !appProtocolName) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Azure resource configuration',
                description: 'Missing required parameters...'
            });
        }
        else {
            await sessionStore.setMsalConfig({
                clientId,
                tenantId,
                redirectUri,
                aadEndpointHost,
                appProtocolName
            });

            void sessionStore.signin('/iotcentral');
        }
    };

    const onCancel = () => {
        navigate('/');
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
                            <label>Client id (service principal client id/application id)</label>
                            <Input
                                value={clientId}
                                onChange={(e) => onFieldChange(e, 'clientId')}
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
                            <label>Redirect uri:</label>
                            <Input
                                value={redirectUri}
                                onChange={(e) => onFieldChange(e, 'redirectUri')}
                            />
                        </Form.Field>

                        <Form.Field>
                            <label>AAD endpoint host (cloud instance id):</label>
                            <Input
                                value={aadEndpointHost}
                                onChange={(e) => onFieldChange(e, 'aadEndpointHost')}
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
