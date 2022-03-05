import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Button, Dimmer, Grid, Loader, Message } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import IotCentralPanel from './IotCentralPanel';

const IoTCentralPage: FC = observer(() => {
    const {
        sessionStore,
        iotCentralStore
    } = useStore();
    const infoDialogContext = useInfoDialog();

    useAsyncEffect(async isMounted => {
        try {
            await iotCentralStore.getIotCentralApps(false);

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
        void iotCentralStore.getIotCentralApps(true);
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure IoT Central Solution Builder</Message.Header>
                    </Message>
                    <Dimmer active={iotCentralStore.waitingOnApiCall} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                    <IotCentralPanel
                        userDisplayName={sessionStore.displayName}
                        iotCentralApps={iotCentralStore.apps}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button color={'green'} floated={'left'} onClick={onRefresh}>Refesh list</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default IoTCentralPage;
