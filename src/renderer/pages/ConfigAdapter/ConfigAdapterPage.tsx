import React, { FC, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Form, Grid, Message, Segment } from 'semantic-ui-react';

const ConfigAdapterPage: FC = observer(() => {
    const [_opcuaServer, setOpcuaServer] = useState('');

    // @ts-ignore
    const onFieldChange = (e: any, fieldId: string) => {
        switch (fieldId) {
            case 'opcuaServer':
                setOpcuaServer(e.target.value);
                break;
        }
    };

    const testOpcuaConnection = () => {
        return;
    };

    const onSaveConfig = async () => {
        return;
    };

    return (
        <Grid style={{ padding: '5em 5em' }}>
            <Grid.Row>
                <Grid.Column>
                    <Message size="huge">
                        <Message.Header>Industrial Connector Configuration</Message.Header>
                    </Message>
                    <Segment attached="bottom">
                        <Form onSubmit={testOpcuaConnection}>
                            <Form.Group>
                                <Form.Field
                                    width={16}
                                    label="OPCUA server connection"
                                    placeholder="Example: opc.tcp://192.168.4.101:4840"
                                    control='input'
                                />
                            </Form.Group>
                            <Button type='submit'>Test Connection</Button>
                        </Form>
                    </Segment>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    <Button color={'green'} floated={'right'} onClick={onSaveConfig}>Save Configuration</Button>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
});

export default ConfigAdapterPage;
