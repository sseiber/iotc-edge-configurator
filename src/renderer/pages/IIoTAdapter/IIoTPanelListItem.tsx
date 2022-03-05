import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Item, Label } from 'semantic-ui-react';
import { AppNavigationPaths } from '../../App';

interface IIoTPanelListItemProps {
    appSubdomain: string;
    deviceName: string;
    deviceId: string;
}
const IIoTPanelListItem: FC<IIoTPanelListItemProps> = (props: IIoTPanelListItemProps) => {
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
                    <Label size={'tiny'} basic color={'grey'}>
                        Id:
                        <Label.Detail>{deviceId}</Label.Detail>
                    </Label>
                    <Button primary floated="right" size="small" onClick={onConfigure}>Configure</Button>
                </Item.Extra>
            </Item.Content>
        </Item>
    );
};

export default IIoTPanelListItem;
