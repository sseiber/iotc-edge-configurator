import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Segment, Header, Message, Item } from 'semantic-ui-react';
import { IIotCentralApp } from '../../../main/models/iotCentral';
import IotCentralPanelListItem from './IotCentralPanelListItem';

interface IIotCentralPanelProps {
    userDisplayName: string;
    mapApps: Map<string, IIotCentralApp>;
}

const IotCentralPanel: FC<IIotCentralPanelProps> = observer((props: IIotCentralPanelProps) => {
    const {
        mapApps
    } = props;

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column>
                    <Header attached="top" as="h3" color={'blue'}>{`Industrial Connector apps`}</Header>
                    <Segment attached="bottom">
                        {
                            mapApps.size > 0
                                ? (
                                    <Item.Group divided>
                                        {
                                            [...mapApps.values()].map((app: IIotCentralApp) => {
                                                return (
                                                    <IotCentralPanelListItem
                                                        key={app.applicationId}
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
});

export default IotCentralPanel;
