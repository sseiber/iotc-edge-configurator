import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Item, Label } from 'semantic-ui-react';
import { AppNavigationPaths } from '../../App';
import {
    IoTCentralBaseDomain
} from '../../../main/models/iotCentral';
import {
    Ipc_OpenLink
} from '../../../main/contextBridgeTypes';


interface IIotCentralPanelListItemProps {
    appName: string;
    appId: string;
    appLocation: string;
    appSubdomain: string;
}
const IotCentralPanelListItem: FC<IIotCentralPanelListItemProps> = (props: IIotCentralPanelListItemProps) => {
    const {
        appName,
        appId,
        appLocation,
        appSubdomain
    } = props;

    const navigate = useNavigate();

    const openBrowser = (subdomain: string) => {
        void window.ipcApi[Ipc_OpenLink](`https://${subdomain}.${IoTCentralBaseDomain}`);
    };

    const navigateToIotcAppPage = () => {
        navigate(AppNavigationPaths.IIoTAdapter, {
            state: {
                appId,
                appName,
                appLocation,
                appSubdomain
            }
        });
    };

    return (
        <Item>
            <Item.Image
                style={{ width: '48px', height: 'auto' }}
                src={'./assets/icons/64x64.png'}
            />

            <Item.Content>
                <Item.Header>{appName}</Item.Header>
                <Item.Extra>
                    <Label size={'tiny'} basic color={'grey'}>
                        Id:
                        <Label.Detail>{appId}</Label.Detail>
                    </Label>
                    <br />
                    <Label size={'tiny'} basic color={'grey'}>
                        Subdomain:
                        <Label.Detail>{appSubdomain}</Label.Detail>
                    </Label>
                    <br />
                    <Label size={'tiny'} basic color={'grey'}>
                        Location:
                        <Label.Detail>{appLocation}</Label.Detail>
                    </Label>
                    <Button primary floated="right" size="small" onClick={() => openBrowser(appSubdomain)}>Go to app</Button>
                    <Button primary floated="right" size="small" onClick={navigateToIotcAppPage}>Manage app</Button>
                </Item.Extra>
            </Item.Content>
        </Item>
    );
};

export default IotCentralPanelListItem;
