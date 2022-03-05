import React, { FC } from 'react';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { IIotCentralApp } from '../../../main/models/iotCentral';
import IotCentralPanelListItem from './IotCentralPanelListItem';

interface IIotCentralPanelProps {
    userDisplayName: string;
    iotCentralApps: IIotCentralApp[];
}

const IotCentralPanel: FC<IIotCentralPanelProps> = (props: IIotCentralPanelProps) => {
    const {
        iotCentralApps
    } = props;

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Header attached="top" as="h3" color={'blue'}>{`Industrial Connector apps`}</Header>
                    <Segment attached="bottom">
                        {
                            iotCentralApps.length > 0
                                ? (
                                    <Item.Group divided>
                                        {
                                            iotCentralApps.map((app) => {
                                                return (
                                                    <IotCentralPanelListItem
                                                        key={app.id}
                                                        appName={app.displayName}
                                                        appId={app.applicationId}
                                                        appLocation={app.location}
                                                        appSubdomain={app.subdomain}
                                                    />
                                                );
                                            })
                                        }
                                    </Item.Group>
                                )
                                : (
                                    <Message warning>
                                        <Message.Header>There are no IoT Central apps registered to you</Message.Header>
                                    </Message>
                                )
                        }
                    </Segment>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
};

export default IotCentralPanel;
