import React from 'react';
import { TrezorDevice } from '@suite-types/index';
import { Icon, colors as COLORS, icons } from '@trezor/components';

interface Props {
    device: TrezorDevice;
    size: number;
    color?: string;
    hoverColor?: string;
    onClick?: any;
}

const getDeviceIcon = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return icons.T1;
        case 2:
            return icons.T2;
        default:
            return icons.T2;
    }
};

const DeviceIcon = ({
    device,
    size = 32,
    color = COLORS.TEXT_SECONDARY,
    hoverColor,
    onClick,
    ...rest
}: Props) => {
    const majorVersion = device.features ? device.features.major_version : 2;
    const icon = getDeviceIcon(majorVersion);
    return (
        <Icon
            icon={icon}
            hoverColor={hoverColor}
            onClick={onClick}
            color={color}
            size={size}
            {...rest}
        />
    );
};

export default DeviceIcon;
