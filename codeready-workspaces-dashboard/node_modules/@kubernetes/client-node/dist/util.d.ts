import { CoreV1Api, V1Pod } from './gen/api';
export declare function podsForNode(api: CoreV1Api, nodeName: string): Promise<V1Pod[]>;
export declare function quantityToScalar(quantity: string): number;
export declare class ResourceStatus {
    readonly request: number;
    readonly limit: number;
    readonly resourceType: string;
    constructor(request: number, limit: number, resourceType: string);
}
export declare function totalCPU(pod: V1Pod): ResourceStatus;
export declare function totalMemory(pod: V1Pod): ResourceStatus;
export declare function totalForResource(pod: V1Pod, resource: string): ResourceStatus;
