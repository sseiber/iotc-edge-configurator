import React, { FC, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Dimmer, Grid, Loader, Message } from 'semantic-ui-react';
import { useStore } from '../../stores/store';
import { useInfoDialog, showInfoDialog } from '../../components/InfoDialogContext';
import IotCentralPanel from './IotCentralPanel';

const IoTCentralPage: FC = observer(() => {
    const {
        sessionStore,
        iotCentralStore
    } = useStore();
    const [loading, setLoading] = useState(false);
    const infoDialogContext = useInfoDialog();

    useAsyncEffect(async isMounted => {
        setLoading(true);

        try {
            await iotCentralStore.getIotCentralApps();

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
                        <Message.Header>Azure IoT Central Solution Builder</Message.Header>
                    </Message>
                    <Dimmer active={loading} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                    <IotCentralPanel
                        userDisplayName={sessionStore.displayName}
                        iotCentralApps={iotCentralStore.iotcApps}
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default IoTCentralPage;
