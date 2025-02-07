import React from 'react';
import { Platform, Text } from 'react-native';
import { Provider } from 'react-redux';

import './support/global';
import { Sentry, SentryLog } from 'react-native-sentry';
import config from '@suite-config/index';
import ErrorBoundary from '@suite-support/ErrorBoundary';

import { initStore } from './reducers/store';

Sentry.config(config.sentry, {
    deactivateStacktraceMerging: false,
    logLevel: SentryLog.Verbose,
    disableNativeIntegration: false,
    handlePromiseRejection: true,
}).install();

const TrezorSuite = (props: any) => {
    process.env.RN_EMULATOR = props.isEmulator;
    process.env.RN_OS = Platform.OS;

    const store = initStore();

    return (
        <ErrorBoundary>
            <Provider store={store}>
                <Text>Nothing works very much here.</Text>
                {/* <Preloader> */}
                {/* <RouterHandler /> */}
                {/* </Preloader> */}
            </Provider>
        </ErrorBoundary>
    );
};

export default TrezorSuite;
