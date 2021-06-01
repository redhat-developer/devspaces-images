export interface IDeferred<T> {
    promise: Promise<T>;
    resolve(value?: T): void;
    reject(reason?: any): void;
}
export declare class Deferred<T> implements IDeferred<T> {
    promise: Promise<T>;
    resolve: (value?: T) => void;
    reject: (value?: T) => void;
    constructor();
}
