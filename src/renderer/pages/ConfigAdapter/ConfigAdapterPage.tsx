import React, { SyntheticEvent, FormEvent, FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Divider, Form, FormProps, Grid, Header, Message, Segment, DropdownProps, Input, Dimmer, Loader, Item, Progress, Label } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import {
    SecurityMode,
    EndpointCredentialType,
    IEndpoint,
    OpcNodeClass,
    OpcAttribute,
    IBrowseNodesRequest
    // ITestConnectionConfig,
    // IBrowseNodesConfig,
    // IAdapterConfiguration
} from '../../../main/models/industrialConnect';
import { createSelectOptionsFromEnum } from '../../utils';

const ConfigAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        mainStore,
        iotCentralStore
    } = useStore();

    const appId = (location.state as any).appId;
    const appSubdomain = (location.state as any).appSubdomain;
    const deviceId = (location.state as any).deviceId;
    const deviceName = (location.state as any).deviceName;

    const deviceConfig = mainStore.getCachedDeviceConfiguration(appId, deviceId);

    const [opcEndpointUri, setOpcEndpointUri] = useState(deviceConfig.testConnection.opcEndpointUri);
    const [securityMode, setSecurityMode] = useState<SecurityMode>(deviceConfig.testConnection.securityMode);
    const [endpointCredentialType, setEndpointCredentialType] = useState<EndpointCredentialType>(deviceConfig.testConnection.credentials.CredentialType);
    const [username, setUsername] = useState(deviceConfig.testConnection.credentials.Username);
    const [password, setPassword] = useState(deviceConfig.testConnection.credentials.Password);
    const [startNode, setStartNode] = useState(deviceConfig.browseNodes.startNode);
    const [nodeDepth, setNodeDepth] = useState(deviceConfig.browseNodes.depth);
    const [nodeClasses, setNodeClasses] = useState<OpcNodeClass[]>(deviceConfig.browseNodes.requestedNodeClasses);
    const [nodeAttributes, setNodeAttributes] = useState<OpcAttribute[]>(deviceConfig.browseNodes.requestedAttributes);

    useAsyncEffect(async isMounted => {
        try {
            await mainStore.openAdapterConfiguration();
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

    const onFieldChange = (e: any) => {
        switch (e.target.id) {
            case 'opcEndpointUri':
                setOpcEndpointUri(e.target.value);
                break;
            case 'username':
                setUsername(e.target.value);
                break;
            case 'password':
                setPassword(e.target.value);
                break;
            case 'startNode':
                setStartNode(e.target.value);
                break;
            case 'nodeDepth':
                setNodeDepth(e.target.value);
                break;
        }
    };

    const testOpcuaConnection = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!opcEndpointUri) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Please enter a valid opc endpoint uri'
            });

            return;
        }

        const opcEndpoint: IEndpoint = {
            Uri: opcEndpointUri,
            SecurityMode: securityMode,
            Credentials: {
                CredentialType: endpointCredentialType,
                Username: username,
                Password: password
            }
        };

        await iotCentralStore.testIndustrialConnectEndpoint(opcEndpoint, appSubdomain, deviceId);
    };

    const browseNodes = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!startNode || !nodeClasses.length || !nodeAttributes.length) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Some required parameters are missing for BrowseNodes'
            });

            return;
        }

        const browseNodesRequest: IBrowseNodesRequest = {
            OpcEndpoint: {
                Uri: opcEndpointUri,
                SecurityMode: securityMode,
                Credentials: {
                    CredentialType: endpointCredentialType,
                    Username: username,
                    Password: password
                }
            },
            StartNode: startNode,
            Depth: nodeDepth,
            RequestedNodeClasses: nodeClasses,
            RequestedAttributes: nodeAttributes
        };

        await iotCentralStore.browseNodes(browseNodesRequest, appSubdomain, deviceId);
    };

    const onSaveConfig = async () => {
        return;
    };

    const securityModeOptions = createSelectOptionsFromEnum(SecurityMode);

    const onSecurityModeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setSecurityMode(props.value as SecurityMode);
    };

    const endpointCredentialTypeOptions = createSelectOptionsFromEnum(EndpointCredentialType);

    const onEndpointCredentialTypeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setEndpointCredentialType(props.value as EndpointCredentialType);
    };

    const nodeClassOptions = createSelectOptionsFromEnum(OpcNodeClass);

    const onNodeClassesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setNodeClasses(props.value as OpcNodeClass[]);
    };

    const nodeAttributeOptions = createSelectOptionsFromEnum(OpcAttribute);

    const onNodeAttributesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setNodeAttributes(props.value as OpcAttribute[]);
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
                        {/*
                            Test Connection Segment
                        */}
                        <Header attached="top" as="h3" color={'blue'}>OPCUA server connection</Header>
                        <Segment attached="bottom">
                            <Form size={'small'} onSubmit={testOpcuaConnection}>
                                <Form.Field width={16}>
                                    <label>Uri:</label>
                                    <Input
                                        id="opcEndpointUri"
                                        placeholder="Example: opc.tcp://192.168.4.101:4840"
                                        value={opcEndpointUri}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={3}
                                    label="Security mode:"
                                    selection
                                    options={securityModeOptions}
                                    defaultValue={securityMode}
                                    onChange={onSecurityModeChange}
                                />
                                <Form.Dropdown
                                    width={3}
                                    label="Credentials:"
                                    selection
                                    options={endpointCredentialTypeOptions}
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
                                                        id="username"
                                                        value={username}
                                                        onChange={onFieldChange}
                                                    />
                                                </Form.Field>
                                                <Form.Field width={16}>
                                                    <label>Password:</label>
                                                    <Input
                                                        id="password"
                                                        value={password}
                                                        onChange={onFieldChange}
                                                    />
                                                </Form.Field>
                                            </Segment>
                                        )
                                        : null
                                }
                                <Divider hidden />
                                <Grid>
                                    <Grid.Column width={3}>
                                        <Button fluid size={'tiny'} type="submit" content="Test Connection" />
                                    </Grid.Column>
                                    {
                                        iotCentralStore.waitingIndustrialConnectCall
                                            ? (
                                                <Grid.Column width={4} verticalAlign={'middle'}>
                                                    <Progress percent={100} active content="Testing connection" />
                                                </Grid.Column>
                                            )
                                            : (
                                                <Grid.Column width={4} verticalAlign={'middle'}>
                                                    <Label size={'small'} color={iotCentralStore.connectionGood ? 'green' : 'grey'}>{iotCentralStore.connectionGood ? 'Verified' : 'Unverified'}</Label>
                                                </Grid.Column>
                                            )
                                    }
                                </Grid>
                            </Form>
                        </Segment>
                        {/*
                            Browse Nodes Segment
                        */}
                        <Header attached="top" as="h3" color={'blue'}>Browse OPCUA Server</Header>
                        <Segment attached="bottom">
                            <Form size={'small'} onSubmit={browseNodes}>
                                <Form.Field width={16}>
                                    <label>Starting node:</label>
                                    <Input
                                        id="startNode"
                                        placeholder="Example: ns=0;i=85"
                                        value={startNode}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Field width={2}>
                                    <label>Depth:</label>
                                    <Input
                                        id="nodeDepth"
                                        value={nodeDepth}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={6}
                                    label="Node classes:"
                                    multiple
                                    selection
                                    options={nodeClassOptions}
                                    defaultValue={nodeClasses}
                                    onChange={onNodeClassesChange}
                                />
                                <Form.Dropdown
                                    width={6}
                                    label="Node attributes:"
                                    multiple
                                    selection
                                    options={nodeAttributeOptions}
                                    defaultValue={nodeAttributes}
                                    onChange={onNodeAttributesChange}
                                />
                                <Divider hidden />
                                <Button size={'tiny'} type='submit'>Browse Nodes</Button>
                            </Form>
                        </Segment>
                    </Segment>
                    <Dimmer active={iotCentralStore.waitingIotCentralCall} inverted>
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
