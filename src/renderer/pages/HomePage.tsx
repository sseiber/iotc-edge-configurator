import React, { FC, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'use-async-effect';
import { Dimmer, Grid, Loader, Message } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { iiotAdapterCommand } from '../stores/iiotAdapter';

const HomePage: FC = observer(() => {
    const {
        iiotAdapterStore
    } = useStore();

    const [loading, setLoading] = useState(false);

    useAsyncEffect(async isMounted => {
        setLoading(true);

        await iiotAdapterStore.iotcRequest(iiotAdapterCommand.TestConnection_v1, {
            OpcEndpoint: {
                Uri: 'opc.tcp://192.168.4.123:4980',
                SecurityMode: 'Lowest',
                Credentials: {
                    CredentialType: 'anonymous'
                }
            }
        });

        if (!isMounted()) {
            return;
        }

        setLoading(false);
    }, []);

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure IoT Central</Message.Header>
                        <p>Azure IoT Central Solution Builder</p>
                    </Message>
                    <Dimmer active={loading} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default HomePage;
