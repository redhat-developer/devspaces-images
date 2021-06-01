/// <reference path="../typings/websocket.d.ts" />
export interface IClientEventHandler {
    (...args: any[]): void;
}
export declare type ClientEventType = 'close' | 'error' | 'open' | 'response';
export interface IRequest {
    jsonrpc: string;
    id: string;
    method: string;
    params: any;
}
export interface IResponse {
    jsonrpc: string;
    id: string;
    result?: any;
    error?: IError;
}
export interface INotification {
    jsonrpc: string;
    method: string;
    params: any;
}
export interface IError {
    number: number;
    message: string;
    data?: any;
}
/**
 * Interface for communication between two entryPoints.
 * The implementation can be through websocket or http protocol.
 */
export interface ICommunicationClient {
    /**
     * Performs connections.
     *
     * @param entryPoint
     */
    connect(entryPoint: string): Promise<any>;
    /**
     * Close the connection.
     */
    disconnect(): void;
    /**
     * Adds listener on client event.
     */
    addListener(event: ClientEventType, handler: IClientEventHandler): void;
    /**
     * Removes listener.
     *
     * @param {ClientEventType} event
     * @param {Function} handler
     */
    removeListener(event: ClientEventType, handler: IClientEventHandler): void;
    /**
     * Send pointed data.
     *
     * @param data data to be sent
     */
    send(data: IRequest | INotification): void;
}
/**
 * The implementation for JSON RPC protocol communication through websocket.
 *
 * @author Ann Shumilova
 */
export declare class WebSocketClient implements ICommunicationClient {
    websocketStream: any;
    private handlers;
    constructor();
    /**
     * Performs connection to the pointed entrypoint.
     *
     * @param entryPoint the entrypoint to connect to
     * @returns {Promise<any>}
     */
    connect(entryPoint: string): Promise<any>;
    /**
     * Performs closing the connection.
     */
    disconnect(): void;
    /**
     * Sends pointed data.
     *
     * @param data to be sent
     */
    send(data: IRequest | INotification): void;
    /**
     * Adds a listener on an event.
     *
     * @param {ClientEventType} event
     * @param {IClientEventHandler} handler
     */
    addListener(event: ClientEventType, handler: IClientEventHandler): void;
    /**
     * Removes a listener.
     *
     * @param {ClientEventType} event
     * @param {IClientEventHandler} handler
     */
    removeListener(event: ClientEventType, handler: IClientEventHandler): void;
}
