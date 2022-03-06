import React, { SyntheticEvent, FormEvent, FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Divider, Form, FormProps, Grid, Header, Message, Segment, DropdownProps, Input, Dimmer, Loader, Item } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import {
    SecurityMode,
    EndpointCredentialType,
    Endpoint
} from '../../../main/models/industrialConnect';

const ConfigAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        iotCentralStore
    } = useStore();

    const [opcuaServerEndpoint, setOpcuaServerEndpoint] = useState('');
    const [securityMode, setSecurityMode] = useState<SecurityMode>(SecurityMode.Lowest);
    const [endpointCredentialType, setEndpointCredentialType] = useState<EndpointCredentialType>(EndpointCredentialType.Anonymous);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const appSubdomain = (location.state as any).appSubdomain;
    const deviceId = (location.state as any).deviceId;
    const deviceName = (location.state as any).deviceName;

    useAsyncEffect(async isMounted => {
        try {
            await iotCentralStore.getDeviceModules(deviceId);

            if (!isMounted()) {
                return;
            }
        }
        catch (ex) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Error',
                description: ex.message
            });
        }
    }, []);

    // @ts-ignore
    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
            case 'opcuaServerEndpoint':
                setOpcuaServerEndpoint(e.target.value);
                break;
            case 'username':
                setUsername(e.target.value);
                break;
            case 'password':
                setPassword(e.target.value);
                break;
        }
    };

    const testOpcuaConnection = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!opcuaServerEndpoint) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Please enter a valid opc endpoint uri'
            });

            return;
        }

        const opcEndpoint: Endpoint = {
            Uri: opcuaServerEndpoint,
            SecurityMode: securityMode,
            Credentials: {
                CredentialType: endpointCredentialType,
                Username: username,
                Password: password
            }
        };

        await iotCentralStore.testIndustrialConnectEndpoint(opcEndpoint, appSubdomain, deviceId);
    };

    const onSaveConfig = async () => {
        return;
    };

    const securityModeOptions = [
        {
            key: SecurityMode.Lowest,
            text: SecurityMode.Lowest,
            value: SecurityMode.Lowest
        },
        {
            key: SecurityMode.Best,
            text: SecurityMode.Best,
            value: SecurityMode.Best
        }
    ];

    const onSecurityModeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setSecurityMode(props.value as SecurityMode);
    };

    const EndpointCredentialTypeOptions = [
        {
            key: EndpointCredentialType.Anonymous,
            text: EndpointCredentialType.Anonymous,
            value: EndpointCredentialType.Anonymous
        },
        {
            key: EndpointCredentialType.Username,
            text: EndpointCredentialType.Username,
            value: EndpointCredentialType.Username
        }
    ];

    const onEndpointCredentialTypeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setEndpointCredentialType(props.value as EndpointCredentialType);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size={'large'} attached="top">
                        <Message.Header>Industrial Connector Gateway Device Configuration</Message.Header>
                    </Message>
                    <Segment attached="bottom">
                        <Item.Group>
                            <Item>
                                <Item.Image
                                    style={{ width: '32px', height: 'auto' }}
                                    src={'./assets/iotedge.png'}
                                />
                                <Item.Content>
                                    <Item.Header>{deviceName}</Item.Header>
                                    <Item.Extra>
                                        <b>Id: </b>{deviceId}
                                    </Item.Extra>
                                </Item.Content>
                            </Item>
                        </Item.Group>
                        <Header attached="top" as="h3" color={'blue'}>OPCUA server connection</Header>
                        <Segment attached="bottom">
                            <Form size={'small'} loading={iotCentralStore.waitingOnApiCall} onSubmit={testOpcuaConnection}>
                                <Form.Field width={16}>
                                    <label>Uri:</label>
                                    <Input
                                        placeholder="Example: opc.tcp://192.168.4.101:4840"
                                        value={opcuaServerEndpoint}
                                        onChange={(e) => onFieldChange(e, 'opcuaServerEndpoint')}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={4}
                                    label="Security mode:"
                                    selection
                                    options={securityModeOptions}
                                    defaultValue={securityMode}
                                    onChange={onSecurityModeChange}
                                />
                                <Form.Dropdown
                                    width={4}
                                    label="Security mode:"
                                    selection
                                    options={EndpointCredentialTypeOptions}
                                    defaultValue={endpointCredentialType}
                                    onChange={onEndpointCredentialTypeChange}
                                />
                                {
                                    endpointCredentialType === EndpointCredentialType.Username
                                        ? (
                                            <Segment basic compact attached={'bottom'}>
                                                <Form.Field width={16}>
                                                    <label>Username:</label>
                                                    <Input
                                                        value={username}
                                                        onChange={(e) => onFieldChange(e, 'username')}
                                                    />
                                                </Form.Field>
                                                <Form.Field width={16}>
                                                    <label>Password:</label>
                                                    <Input
                                                        value={password}
                                                        onChange={(e) => onFieldChange(e, 'password')}
                                                    />
                                                </Form.Field>
                                            </Segment>
                                        )
                                        : null
                                }
                                <Divider hidden />
                                <Button size={'tiny'} type='submit'>Test Connection</Button>
                            </Form>
                        </Segment>
                    </Segment>
                    <Dimmer active={iotCentralStore.waitingOnApiCall} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button size={'tiny'} color={'green'} floated={'right'} onClick={onSaveConfig}>Save Configuration</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default ConfigAdapterPage;
