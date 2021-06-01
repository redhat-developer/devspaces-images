import { IClientEventHandler, ICommunicationClient } from './web-socket-client';
/**
 * This client is handling the JSON RPC requests, responses and notifications.
 *
 * @author Ann Shumilova
 */
export declare class JsonRpcClient {
    /**
     * Client for performing communications.
     */
    private client;
    /**
     * The list of the pending requests by request id.
     */
    private pendingRequests;
    /**
     * The list of notification handlers by method name.
     */
    private notificationHandlers;
    private counter;
    constructor(client: ICommunicationClient);
    /**
     * Performs JSON RPC request.
     *
     * @param method method's name
     * @param params params
     * @returns {Promise<any>}
     */
    request(method: string, params?: any): Promise<any>;
    /**
     * Sends JSON RPC notification.
     *
     * @param method method's name
     * @param params params (optional)
     */
    notify(method: string, params?: any): void;
    /**
     * Adds notification handler.
     *
     * @param method method's name
     * @param handler handler to process notification
     */
    addNotificationHandler(method: string, handler: IClientEventHandler): void;
    /**
     * Removes notification handler.
     *
     * @param method method's name
     * @param handler handler
     */
    removeNotificationHandler(method: string, handler: IClientEventHandler): void;
    /**
     * Processes response - detects whether it is JSON RPC response or notification.
     *
     * @param message
     */
    private processResponse(message);
    /**
     * Processes JSON RPC notification.
     *
     * @param message message
     */
    private processNotification(message);
    /**
     * Process JSON RPC response.
     *
     * @param message
     */
    private processResponseMessage(message);
    private isResponse(message);
}
