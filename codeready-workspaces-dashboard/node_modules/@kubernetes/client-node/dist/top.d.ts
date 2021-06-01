import { CoreV1Api, V1Node } from './gen/api';
export declare class ResourceUsage {
    readonly Capacity: number;
    readonly RequestTotal: number;
    readonly LimitTotal: number;
    constructor(Capacity: number, RequestTotal: number, LimitTotal: number);
}
export declare class NodeStatus {
    readonly Node: V1Node;
    readonly CPU: ResourceUsage;
    readonly Memory: ResourceUsage;
    constructor(Node: V1Node, CPU: ResourceUsage, Memory: ResourceUsage);
}
export declare function topNodes(api: CoreV1Api): Promise<NodeStatus[]>;
