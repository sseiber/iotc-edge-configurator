import React, { FC } from 'react';
// FIX:
// import { observer } from 'mobx-react-lite';
import { Grid, Message } from 'semantic-ui-react';

const HomePage: FC = () => {
    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Azure IoT Central</Message.Header>
                        <p>Azure IoT Central Solution Builder</p>
                    </Message>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default HomePage;
