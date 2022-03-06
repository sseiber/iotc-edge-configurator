import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Item } from 'semantic-ui-react';
import { AppNavigationPaths } from '../../App';

interface IIoTAdapterPanelListItemProps {
    appSubdomain: string;
    deviceName: string;
    deviceId: string;
}
const IIoTAdapterPanelListItem: FC<IIoTAdapterPanelListItemProps> = (props: IIoTAdapterPanelListItemProps) => {
    const {
        appSubdomain,
        deviceName,
        deviceId
    } = props;

    const navigate = useNavigate();

    const onConfigure = () => {
        navigate(AppNavigationPaths.ConfigAdapter, {
            state: {
                appSubdomain,
                deviceName,
                deviceId
            }
        });
    };

    return (
        <Item>
            <Item.Image
                style={{ width: '32px', height: 'auto' }}
                src={'./assets/iotedge.png'}
            />
            <Item.Content>
                <Item.Header>{deviceName}</Item.Header>
                <Item.Extra>
                    <b>Id: </b>{deviceId}
                    <Button size={'tiny'} primary floated="right" onClick={onConfigure}>Configure</Button>
                </Item.Extra>
            </Item.Content>
        </Item>
    );
};

export default IIoTAdapterPanelListItem;
