import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Message, Segment } from 'semantic-ui-react';
import { useStore } from '../stores/store';
import { AuthenticationState } from '../stores/session';

const HomePage: FC = observer(() => {
    const {
        sessionStore
    } = useStore();

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure</Message.Header>
                        <p>IoT Central Solution Builder</p>
                    </Message>
                    {
                        sessionStore.authenticationState !== AuthenticationState.Authenticated
                            ? (
                                <Segment basic>
                                    Use the signin link above to access your Azure subscription resources.
                                </Segment>
                            )
                            : null
                    }
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default HomePage;
