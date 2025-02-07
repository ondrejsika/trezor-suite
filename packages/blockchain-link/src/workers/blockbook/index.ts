import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import Connection from './websocket';
import * as utils from './utils';

import { Message, SubscriptionAccountInfo } from '../../types';
import { AddressNotification, BlockNotification } from '../../types/blockbook';
import * as MessageTypes from '../../types/messages';
import * as common from '../common';

let api: Connection | undefined;
let pingTimeout: ReturnType<typeof setTimeout>;
let endpoints: string[] = [];

const timeoutHandler = async () => {
    if (api && api.isConnected()) {
        try {
            // await _connection.getServerInfo();
            pingTimeout = setTimeout(timeoutHandler, 5000);
        } catch (error) {
            common.debug(`Error in timeout ping request: ${error}`);
        }
    }
};

const cleanup = () => {
    if (pingTimeout) {
        clearTimeout(pingTimeout);
    }
    if (api) {
        api.removeAllListeners();
        api = undefined;
    }
    endpoints = [];
    common.removeAccounts(common.getAccounts());
    common.removeAddresses(common.getAddresses());
    common.clearSubscriptions();
};

const connect = async (): Promise<Connection> => {
    if (api) {
        if (api.isConnected()) return api;
    }

    // validate endpoints
    const { server } = common.getSettings();
    if (!server || !Array.isArray(server) || server.length < 1) {
        throw new CustomError('connect', 'Endpoint not set');
    }

    if (endpoints.length < 1) {
        endpoints = common.shuffleEndpoints(server.slice(0));
    }

    common.debug('Connecting to', endpoints[0]);
    const connection = new Connection(endpoints[0]);

    try {
        await connection.connect();
        api = connection;
    } catch (error) {
        common.debug('Websocket connection failed');
        api = undefined;
        // connection error. remove endpoint
        endpoints.splice(0, 1);
        // and try another one or throw error
        if (endpoints.length < 1) {
            throw new CustomError('connect', 'All backends are down');
        }
        return connect();
    }

    connection.on('disconnected', () => {
        cleanup();
        common.response({ id: -1, type: RESPONSES.DISCONNECTED, payload: true });
    });

    common.response({
        id: -1,
        type: RESPONSES.CONNECTED,
    });

    pingTimeout = setTimeout(timeoutHandler, 5000);

    common.debug('Connected');
    return connection;
};

const getInfo = async (data: { id: number } & MessageTypes.GetInfo): Promise<void> => {
    try {
        const socket = await connect();
        const info = await socket.getServerInfo();
        common.response({
            id: data.id,
            type: RESPONSES.GET_INFO,
            payload: utils.transformServerInfo(info),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getAccountInfo = async (
    data: { id: number } & MessageTypes.GetAccountInfo
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const info = await socket.getAccountInfo(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: utils.transformAccountInfo(info),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getAccountUtxo = async (
    data: { id: number } & MessageTypes.GetAccountUtxo
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const utxos = await socket.getAccountUtxo(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_ACCOUNT_UTXO,
            payload: utils.transformAccountUtxo(utxos),
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const getTransaction = async (
    data: { id: number } & MessageTypes.GetTransaction
): Promise<void> => {
    const { payload } = data;
    try {
        const socket = await connect();
        const info = await socket.getTransaction(payload);
        common.response({
            id: data.id,
            type: RESPONSES.GET_TRANSACTION,
            payload: info,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const pushTransaction = async (
    data: { id: number } & MessageTypes.PushTransaction
): Promise<void> => {
    try {
        const socket = await connect();
        const resp = await socket.pushTransaction(data.payload);
        common.response({
            id: data.id,
            type: RESPONSES.PUSH_TRANSACTION,
            payload: resp,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const estimateFee = async (data: { id: number } & MessageTypes.EstimateFee): Promise<void> => {
    try {
        const socket = await connect();
        const resp = await socket.estimateFee({ blocks: [1] });
        common.response({
            id: data.id,
            type: RESPONSES.ESTIMATE_FEE,
            payload: resp,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const onNewBlock = (event: BlockNotification) => {
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'block',
            payload: {
                blockHeight: event.height,
                blockHash: event.hash,
            },
        },
    });
};

const onTransaction = (event: AddressNotification) => {
    if (!event.tx) return;
    const descriptor = event.address;
    // check if there is subscribed account with received address
    const account = common.getAccount(descriptor);
    common.response({
        id: -1,
        type: RESPONSES.NOTIFICATION,
        payload: {
            type: 'notification',
            payload: {
                descriptor: account ? account.descriptor : descriptor,
                tx: account
                    ? utils.transformTransaction(account.descriptor, account.addresses, event.tx)
                    : utils.transformTransaction(descriptor, undefined, event.tx),
            },
        },
    });
};

const subscribeAccounts = async (accounts: SubscriptionAccountInfo[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const socket = await connect();
    common.addAccounts(accounts);
    if (!common.getSubscription('notification')) {
        socket.on('notification', onTransaction);
        common.addSubscription('notification');
    }
    return socket.subscribeAddresses(common.getAddresses());
};

const subscribeAddresses = async (addresses: string[]) => {
    // subscribe to new blocks, confirmed and mempool transactions for given addresses
    const socket = await connect();
    common.addAddresses(addresses);
    if (!common.getSubscription('notification')) {
        socket.on('notification', onTransaction);
        common.addSubscription('notification');
    }
    return socket.subscribeAddresses(common.getAddresses());
};

const subscribeBlock = async () => {
    if (common.getSubscription('block')) return { subscribed: true };
    const socket = await connect();
    common.addSubscription('block');
    socket.on('block', onNewBlock);
    return socket.subscribeBlock();
};

const subscribe = async (data: { id: number } & MessageTypes.Subscribe): Promise<void> => {
    const { payload } = data;
    try {
        let response;
        if (payload.type === 'accounts') {
            response = await subscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            response = await subscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            response = await subscribeBlock();
        } else {
            throw new CustomError('invalid_param', '+type');
        }

        common.response({
            id: data.id,
            type: RESPONSES.SUBSCRIBE,
            payload: response,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const unsubscribeAccounts = async (accounts?: SubscriptionAccountInfo[]) => {
    const socket = await connect();
    common.removeAccounts(accounts || common.getAccounts());
    const subscribed = common.getAddresses();
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeListener('notification', onTransaction);
        common.removeSubscription('notification');
        return socket.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};

const unsubscribeAddresses = async (addresses?: string[]) => {
    const socket = await connect();
    // remove accounts
    if (!addresses) {
        common.removeAccounts(common.getAccounts());
    }
    const subscribed = common.removeAddresses(addresses || common.getAddresses());
    if (subscribed.length < 1) {
        // there are no subscribed addresses left
        // remove listeners
        socket.removeListener('notification', onTransaction);
        common.removeSubscription('notification');
        return socket.unsubscribeAddresses();
    }
    // subscribe remained addresses
    return socket.subscribeAddresses(subscribed);
};

const unsubscribeBlock = async () => {
    if (!common.getSubscription('block')) return { subscribed: false };
    const socket = await connect();
    socket.removeListener('block', onNewBlock);
    common.removeSubscription('block');
    return socket.unsubscribeBlock();
};

const unsubscribe = async (data: { id: number } & MessageTypes.Unsubscribe): Promise<void> => {
    const { payload } = data;
    try {
        let response;
        if (payload.type === 'accounts') {
            response = await unsubscribeAccounts(payload.accounts);
        } else if (payload.type === 'addresses') {
            response = await unsubscribeAddresses(payload.addresses);
        } else if (payload.type === 'block') {
            response = await unsubscribeBlock();
        } else {
            throw new CustomError('invalid_param', '+type');
        }

        common.response({
            id: data.id,
            type: RESPONSES.UNSUBSCRIBE,
            payload: response,
        });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

const disconnect = async (data: { id: number }) => {
    if (!api) {
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
        return;
    }
    try {
        await api.disconnect();
        common.response({ id: data.id, type: RESPONSES.DISCONNECTED, payload: true });
    } catch (error) {
        common.errorHandler({ id: data.id, error });
    }
};

// WebWorker message handling
onmessage = (event: { data: Message }) => {
    if (!event.data) return;
    const { data } = event;
    const { id, type } = data;

    common.debug('onmessage', data);
    switch (data.type) {
        case MESSAGES.HANDSHAKE:
            common.setSettings(data.settings);
            break;
        case MESSAGES.CONNECT:
            connect()
                .then(async () => {
                    common.response({ id, type: RESPONSES.CONNECT, payload: true });
                })
                .catch(error => common.errorHandler({ id, error }));
            break;
        case MESSAGES.GET_INFO:
            getInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            getAccountInfo(data);
            break;
        case MESSAGES.GET_ACCOUNT_UTXO:
            getAccountUtxo(data);
            break;
        case MESSAGES.GET_TRANSACTION:
            getTransaction(data);
            break;
        case MESSAGES.ESTIMATE_FEE:
            estimateFee(data);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            pushTransaction(data);
            break;
        case MESSAGES.SUBSCRIBE:
            subscribe(data);
            break;
        case MESSAGES.UNSUBSCRIBE:
            unsubscribe(data);
            break;
        case MESSAGES.DISCONNECT:
            disconnect(data);
            break;
        // @ts-ignore this message is used in tests
        case 'terminate':
            cleanup();
            break;
        default:
            common.errorHandler({
                id,
                error: new Error(`Unknown message type ${type}`),
            });
            break;
    }
};

// Handshake to host
common.handshake();
