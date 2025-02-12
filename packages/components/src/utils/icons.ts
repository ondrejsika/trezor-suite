import icons from '../config/icons';
import { FeedbackType } from '../support/types';

const getStateIcon = (type?: FeedbackType) => {
    let icon = null;
    switch (type) {
        case 'info':
            icon = icons.INFO;
            break;
        case 'error':
            icon = icons.ERROR;
            break;
        case 'warning':
            icon = icons.WARNING;
            break;
        case 'success':
            icon = icons.SUCCESS;
            break;
        default:
            icon = null;
    }
    return icon;
};

export { getStateIcon };
