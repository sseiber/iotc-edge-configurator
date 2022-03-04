import React, { FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Dimmer, Grid, Label, Loader, Message } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import IIoTAdapterPanel from './IIoTAdapterPanel';

const IIoTAdapterPage: FC = observer(() => {
    const location = useLocation();
    const infoDialogContext = useInfoDialog();
    const {
        iotCentralStore
    } = useStore();

    const [loading, setLoading] = useState(false);

    const appId = (location.state as any).appId;
    const appName = (location.state as any).appName;
    const appLocation = (location.state as any).appLocation;
    const appSubdomain = (location.state as any).appSubdomain;

    useAsyncEffect(async isMounted => {
        setLoading(true);

        try {
            await iotCentralStore.getIotCentralDevices(appSubdomain);

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
        finally {
            setLoading(false);
        }

        setLoading(false);
    }, []);

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>IIoT Adapter Configuration</Message.Header>
                        <Message.Content>
                            <Label size={'tiny'} basic color={'grey'}>
                                Name:
                                <Label.Detail>{appName}</Label.Detail>
                            </Label>
                            <br />
                            <Label size={'tiny'} basic color={'grey'}>
                                Id:
                                <Label.Detail>{appId}</Label.Detail>
                            </Label>
                            <br />
                            <Label size={'tiny'} basic color={'grey'}>
                                Location:
                                <Label.Detail>{appLocation}</Label.Detail>
                            </Label>
                        </Message.Content>
                    </Message>
                    <Dimmer active={loading} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                    <IIoTAdapterPanel
                        devices={iotCentralStore.iotcDevices}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default IIoTAdapterPage;
