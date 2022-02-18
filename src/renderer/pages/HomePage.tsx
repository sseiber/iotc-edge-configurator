import React, { FC, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dimmer, Grid, Loader, Message } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { useInfoDialog, showInfoDialog } from '../components/InfoDialogContext';

const HomePage: FC = observer(() => {
    const {
        sessionStore
    } = useStore();
    const infoDialogContext = useInfoDialog();

    const [loading, setLoading] = useState(false);

    const onClickButton = async () => {
        let errorMessage;

        try {
            setLoading(true);

            await sessionStore.setMsalConfig();

            // @ts-ignore
            const signinResult = await sessionStore.signin();

            setLoading(false);
        }
        catch (ex) {
            errorMessage = ex.message;
        }

        if (errorMessage) {
            await showInfoDialog(infoDialogContext, {
                catchOnCancel: true,
                variant: 'info',
                title: 'Error',
                description: errorMessage
            });
        }
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure IoT Central</Message.Header>
                        <p>Azure IoT Central Solution Builder - this is the home page</p>
                    </Message>
                    <Dimmer active={loading} inverted>
                        <Loader>Pending...</Loader>
                    </Dimmer>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button
                        floated="right"
                        size="small"
                        color={'green'}
                        onClick={onClickButton}
                    >
                        Claim Token
                    </Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default HomePage;
