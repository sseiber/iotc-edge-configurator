import React, { ChangeEvent, SyntheticEvent, FormEvent, FC } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Divider, Form, FormProps, Grid, Header, Message, Segment, DropdownProps, Input, Dimmer, Loader, Item, Progress, Label } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import {
    IApiContext,
    SecurityMode,
    EndpointCredentialType,
    OpcNodeClass,
    OpcAttribute
} from '../../../main/models/industrialConnect';
import { createSelectOptionsFromEnum } from '../../utils';

const ConfigAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        mainStore,
        iotCentralStore,
        industrialConnectStore
    } = useStore();

    const appId = (location.state as any).appId;
    const appSubdomain = (location.state as any).appSubdomain;
    const deviceId = (location.state as any).deviceId;
    const deviceName = (location.state as any).deviceName;

    useAsyncEffect(
        async (isMounted) => {
            try {
                await iotCentralStore.getDeviceModules(deviceId);
                await mainStore.loadAdapterConfiguration(appId, deviceId);

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

        },
        async () => {
            await mainStore.saveAdapterConfig();
        },
        []
    );

    const onFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        switch (e.target.id) {
            case 'testConnectionUri':
                mainStore.updateAdapterConfig('testConnectionRequest.uri', e.target.value);
                mainStore.updateAdapterConfig('browseNodesRequest.opcEndpoint.uri', e.target.value);
                break;
            case 'testConnectionUsername':
                mainStore.updateAdapterConfig('testConnectionRequest.credentials.username', e.target.value);
                mainStore.updateAdapterConfig('browseNodesRequest.opcEndpoint.credentials.username', e.target.value);
                break;
            case 'testConnectionPassword':
                mainStore.updateAdapterConfig('testConnectionRequest.credentials.password', e.target.value);
                mainStore.updateAdapterConfig('browseNodesRequest.opcEndpoint.credentials.password', e.target.value);
                break;
            case 'browseNodesRequestStartNode':
                mainStore.updateAdapterConfig('browseNodesRequest.startNode', e.target.value);
                break;
            case 'browseNodesRequestDepth': {
                const value = e.target.value !== '' ? parseInt(e.target.value, 10) : 0;
                if (!isNaN(value)) {
                    mainStore.updateAdapterConfig('browseNodesRequest.depth', value);
                }
                break;
            }
        }
    };

    const testConnection = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!mainStore.adapterConfig.testConnectionRequest.uri) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Please enter a valid opc endpoint uri'
            });

            return;
        }

        await mainStore.saveAdapterConfig();

        const apiContext: IApiContext = {
            appSubdomain,
            deviceId,
            moduleName: iotCentralStore.mapDeviceModules.get(deviceId)[0].name
        };
        await industrialConnectStore.testConnection(apiContext, mainStore.adapterConfig.testConnectionRequest);
    };

    const fetchNodes = async (e: FormEvent, _formProps: FormProps) => {
        e.preventDefault();

        if (!mainStore.adapterConfig.browseNodesRequest.opcEndpoint.uri
            || !mainStore.adapterConfig.browseNodesRequest.startNode
            || !mainStore.adapterConfig.browseNodesRequest.requestedNodeClasses.length
            || !mainStore.adapterConfig.browseNodesRequest.requestedAttributes.length) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Test Connection',
                description: 'Some required parameters are missing for fetch nodes request'
            });

            return;
        }

        await mainStore.saveAdapterConfig();

        const apiContext: IApiContext = {
            appSubdomain,
            deviceId,
            moduleName: iotCentralStore.mapDeviceModules.get(deviceId)[0].name
        };
        await industrialConnectStore.fetchNodes(apiContext, mainStore.adapterConfig.browseNodesRequest);
    };

    const onSaveConfig = async () => {
        return;
    };

    const securityModeOptions = createSelectOptionsFromEnum(SecurityMode, false);

    const onSecurityModeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        mainStore.updateAdapterConfig('testConnectionRequest.securityMode', props.value as SecurityMode);
        mainStore.updateAdapterConfig('browseNodesRequest.opcEndpoint.securityMode', props.value as SecurityMode);
    };

    const endpointCredentialTypeOptions = createSelectOptionsFromEnum(EndpointCredentialType, false);

    const onEndpointCredentialTypeChange = (_e: SyntheticEvent, props: DropdownProps) => {
        mainStore.updateAdapterConfig('testConnectionRequest.credentials.credentialType', props.value as EndpointCredentialType);
        mainStore.updateAdapterConfig('browseNodesRequest.opcEndpoint.credentials.credentialType', props.value as EndpointCredentialType);
    };

    const nodeClassOptions = createSelectOptionsFromEnum(OpcNodeClass, false);

    const onNodeClassesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        mainStore.updateAdapterConfig('browseNodesRequest.requestedNodeClasses', props.value as OpcNodeClass[]);
    };

    const nodeAttributeOptions = createSelectOptionsFromEnum(OpcAttribute, false);

    const onNodeAttributesChange = (_e: SyntheticEvent, props: DropdownProps) => {
        mainStore.updateAdapterConfig('browseNodesRequest.requestedAttributes', props.value as OpcAttribute[]);
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
                            <Form size={'small'} onSubmit={testConnection}>
                                <Form.Field width={16}>
                                    <label>Uri:</label>
                                    <Input
                                        id="testConnectionUri"
                                        placeholder="Example: opc.tcp://192.168.4.101:4840"
                                        value={mainStore.adapterConfig.testConnectionRequest.uri}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={3}
                                    label="Security mode:"
                                    selection
                                    options={securityModeOptions}
                                    defaultValue={mainStore.adapterConfig.testConnectionRequest.securityMode}
                                    onChange={onSecurityModeChange}
                                />
                                <Form.Dropdown
                                    width={3}
                                    label="Credentials:"
                                    selection
                                    options={endpointCredentialTypeOptions}
                                    defaultValue={mainStore.adapterConfig.testConnectionRequest.credentials.credentialType}
                                    onChange={onEndpointCredentialTypeChange}
                                />
                                {
                                    mainStore.adapterConfig.testConnectionRequest.credentials.credentialType === EndpointCredentialType.Username
                                        ? (
                                            <Segment basic compact attached={'bottom'}>
                                                <Form.Field width={16}>
                                                    <label>Username:</label>
                                                    <Input
                                                        id="testConnectionUsername"
                                                        value={mainStore.adapterConfig.testConnectionRequest.credentials.username}
                                                        onChange={onFieldChange}
                                                    />
                                                </Form.Field>
                                                <Form.Field width={16}>
                                                    <label>Password:</label>
                                                    <Input
                                                        id="testConnectionPassword"
                                                        value={mainStore.adapterConfig.testConnectionRequest.credentials.password}
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
                                        industrialConnectStore.waitingOnEndpointVerification
                                            ? (
                                                <Grid.Column width={4} verticalAlign={'middle'}>
                                                    <Progress percent={100} active content="Testing connection" />
                                                </Grid.Column>
                                            )
                                            : (
                                                <Grid.Column width={4} verticalAlign={'middle'}>
                                                    <Label
                                                        size={'small'}
                                                        color={industrialConnectStore.endpointVerified ? 'green' : 'grey'}
                                                        content={industrialConnectStore.endpointVerified ? '\u00A0\u00A0\u00A0Verified' : '\u00A0\u00A0\u00A0Unverified'}
                                                        icon={industrialConnectStore.endpointVerified ? 'check circle' : 'delete'}
                                                    />
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
                            <Form size={'small'} onSubmit={fetchNodes}>
                                <Form.Field width={16}>
                                    <label>Starting node:</label>
                                    <Input
                                        id="browseNodesRequestStartNode"
                                        placeholder="Example: ns=0;i=85"
                                        value={mainStore.adapterConfig.browseNodesRequest.startNode}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Field width={2}>
                                    <label>Depth:</label>
                                    <Input
                                        id="browseNodesRequestDepth"
                                        value={mainStore.adapterConfig.browseNodesRequest.depth}
                                        onChange={onFieldChange}
                                    />
                                </Form.Field>
                                <Form.Dropdown
                                    width={6}
                                    label="Node classes:"
                                    multiple
                                    selection
                                    options={nodeClassOptions}
                                    value={mainStore.adapterConfig.browseNodesRequest.requestedNodeClasses}
                                    onChange={onNodeClassesChange}
                                />
                                <Form.Dropdown
                                    width={6}
                                    label="Node attributes:"
                                    multiple
                                    selection
                                    options={nodeAttributeOptions}
                                    value={mainStore.adapterConfig.browseNodesRequest.requestedAttributes}
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
