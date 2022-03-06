import React, { FC } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Dimmer, Grid, Item, Loader, Message, Segment } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import IIoTAdapterPanel from './IIoTAdapterPanel';

const IIoTAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        iotCentralStore
    } = useStore();

    const appId = (location.state as any).appId;
    const appName = (location.state as any).appName;
    const appLocation = (location.state as any).appLocation;
    const appSubdomain = (location.state as any).appSubdomain;

    useAsyncEffect(async isMounted => {
        try {
            await iotCentralStore.getIotCentralDevices(appId, false);

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

    const onRefresh = () => {
        void iotCentralStore.getIotCentralDevices(appId, true);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size={'large'} attached="top">
                        <Message.Header>Industrial Connector App Configuration</Message.Header>
                    </Message>
                    <Segment attached="bottom">
                        <Item.Group>
                            <Item>
                                <Item.Image
                                    style={{ width: '48px', height: 'auto' }}
                                    src={'./assets/icons/64x64.png'}
                                />
                                <Item.Content>
                                    <Item.Header>{appName}</Item.Header>
                                    <Item.Extra>
                                        <b>Id: </b>{appId}<br />
                                        <b>Subdomain: </b>{appSubdomain}<br />
                                        <b>Location: </b>{appLocation}
                                    </Item.Extra>
                                </Item.Content>
                            </Item>
                        </Item.Group>
                        <IIoTAdapterPanel
                            appSubdomain={appSubdomain}
                            devices={iotCentralStore.mapAppDevices.get(appId)}
                        />
                    </Segment>
                    <Dimmer active={iotCentralStore.waitingOnApiCall} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button size={'tiny'} color={'green'} floated={'left'} onClick={onRefresh}>Refesh list</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default IIoTAdapterPage;
