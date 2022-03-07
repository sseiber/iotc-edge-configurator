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
    IEndpoint,
    OpcNodeClass,
    OpcAttribute,
    IBrowseNodesRequest
    // ITestConnectionConfig,
    // IBrowseNodesConfig,
    // IAdapterConfiguration
} from '../../../main/models/industrialConnect';

const ConfigAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        iotCentralStore
    } = useStore();

    const [opcEndpointUri, setOpcEndpointUri] = useState('');
    const [securityMode, setSecurityMode] = useState<SecurityMode>(SecurityMode.Lowest);
    const [endpointCredentialType, setEndpointCredentialType] = useState<EndpointCredentialType>(EndpointCredentialType.Anonymous);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [startNode, setStartNode] = useState('');
    const [nodeDepth, setNodeDepth] = useState(1);
    const [nodeClasses, setNodeClasses] = useState<OpcNodeClass[]>([]);
    const [nodeAttributes, setNodeAttributes] = useState<OpcAttribute[]>([]);

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

    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
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

    const endpointCredentialTypeOptions = [
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

    const nodeClassOptions = [
        {
            key: OpcNodeClass.Object,
            text: OpcNodeClass.Object,
            value: OpcNodeClass.Object
        },
        {
            key: OpcNodeClass.Variable,
            text: OpcNodeClass.Variable,
            value: OpcNodeClass.Variable
        }
    ];

    const onNodeClassesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        setNodeClasses(props.value as OpcNodeClass[]);
    };

    const nodeAttributeOptions = [
        {
            key: OpcAttribute.NodeClass,
            text: OpcAttribute.NodeClass,
            value: OpcAttribute.NodeClass
        },
        {
            key: OpcAttribute.BrowseName,
            text: OpcAttribute.BrowseName,
            value: OpcAttribute.BrowseName
        },
        {
            key: OpcAttribute.DisplayName,
            text: OpcAttribute.DisplayName,
            value: OpcAttribute.DisplayName
        },
        {
            key: OpcAttribute.Description,
            text: OpcAttribute.Description,
            value: OpcAttribute.Description
        },
        {
            key: OpcAttribute.DataType,
            text: OpcAttribute.DataType,
            value: OpcAttribute.DataType
        },
        {
            key: OpcAttribute.Value,
            text: OpcAttribute.Value,
            value: OpcAttribute.Value
        },
        {
            key: OpcAttribute.ValueRank,
            text: OpcAttribute.ValueRank,
            value: OpcAttribute.ValueRank
        },
        {
            key: OpcAttribute.ArrayDimensions,
            text: OpcAttribute.ArrayDimensions,
            value: OpcAttribute.ArrayDimensions
        },
        {
            key: OpcAttribute.UserAccessLevel,
            text: OpcAttribute.UserAccessLevel,
            value: OpcAttribute.UserAccessLevel
        }
    ];

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
                            <Form size={'small'} loading={iotCentralStore.waitingOnApiCall} onSubmit={testOpcuaConnection}>
                                <Form.Field width={16}>
                                    <label>Uri:</label>
                                    <Input
                                        placeholder="Example: opc.tcp://192.168.4.101:4840"
                                        value={opcEndpointUri}
                                        onChange={(e) => onFieldChange(e, 'opcEndpointUri')}
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
                        {/*
                            Browse Nodes Segment
                        */}
                        <Header attached="top" as="h3" color={'blue'}>Browse OPCUA Server</Header>
                        <Segment attached="bottom">
                            <Form size={'small'} loading={iotCentralStore.waitingOnApiCall} onSubmit={browseNodes}>
                                <Form.Field width={16}>
                                    <label>Starting node:</label>
                                    <Input
                                        placeholder="Example: ns=0;i=85"
                                        value={startNode}
                                        onChange={(e) => onFieldChange(e, 'startNode')}
                                    />
                                </Form.Field>
                                <Form.Field width={2}>
                                    <label>Depth:</label>
                                    <Input
                                        value={nodeDepth}
                                        onChange={(e) => onFieldChange(e, 'nodeDepth')}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={4}
                                    label="Node classes:"
                                    selection
                                    options={nodeClassOptions}
                                    onChange={onNodeClassesChange}
                                />
                                <Form.Dropdown
                                    width={4}
                                    label="Node attributes:"
                                    selection
                                    options={nodeAttributeOptions}
                                    onChange={onNodeAttributesChange}
                                />
                                <Divider hidden />
                                <Button size={'tiny'} type='submit'>Browse Nodes</Button>
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
