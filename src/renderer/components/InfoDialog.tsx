import React, { FC } from 'react';
import { Button, Modal } from 'semantic-ui-react';

export interface IInfoDialogOptions {
    catchOnCancel?: boolean;
    variant: 'confirm' | 'info';
    title: string;
    description: string;
    actionLabel?: string;
}

interface IInfoDialogProps extends IInfoDialogOptions {
    visible: boolean;
    okCallback: () => void;
    closeCallback: () => void;
}

export const InfoDialog: FC<IInfoDialogProps> = ((props: IInfoDialogProps) => {
    const {
        variant,
        title,
        description,
        actionLabel = 'OK',
        visible,
        okCallback,
        closeCallback
    } = props;

    return (
        <Modal size="small" open={visible} onClose={closeCallback}>
            <Modal.Header>{title}</Modal.Header>
            <Modal.Content>
                {description}
            </Modal.Content>
            <Modal.Actions>
                {variant === 'confirm' && (
                    <>
                        <Button size="small" color="grey" onClick={closeCallback} autoFocus>
                            Cancel
                        </Button>
                        <Button size="small" color="blue" onClick={okCallback}>
                            {actionLabel}
                        </Button>
                    </>
                )}
                {variant === 'info' && (
                    <Button size="small" color="blue" onClick={okCallback}>
                        OK
                    </Button>
                )}
            </Modal.Actions>
        </Modal>
    );
});
