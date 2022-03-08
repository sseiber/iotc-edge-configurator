import React, { FC } from 'react';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { IIotCentralDevice } from '../../../main/models/iotCentral';
import IIoTAdapterPanelListItem from './IIoTAdapterPanelListItem';

interface IIoTAdapterPanelProps {
    appId: string;
    appSubdomain: string;
    devices: IIotCentralDevice[];
}

const IIoTAdapterPanel: FC<IIoTAdapterPanelProps> = (props: IIoTAdapterPanelProps) => {
    const {
        appId,
        appSubdomain,
        devices
    } = props;

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Header attached="top" as="h4" color={'blue'}>{`Devices`}</Header>
                    <Segment attached="bottom">
                        {
                            (devices?.length || 0) > 0
                                ? (
                                    <Item.Group divided>
                                        {
                                            devices.map((device) => {
                                                return (
                                                    <IIoTAdapterPanelListItem
                                                        key={device.id}
                                                        appId={appId}
                                                        appSubdomain={appSubdomain}
                                                        deviceId={device.id}
                                                        deviceName={device.displayName}
                                                    />
                                                );
                                            })
                                        }
                                    </Item.Group>
                                )
                                : (
                                    <Message warning>
                                        <Message.Header>No Industrial Connector gateway devices found.</Message.Header>
                                        <Message.Content>
                                            First create an IoT Edge gateway device using the Industrial Connector device template and then you can configure it here.
                                        </Message.Content>
                                    </Message>
                                )
                        }
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default IIoTAdapterPanel;
