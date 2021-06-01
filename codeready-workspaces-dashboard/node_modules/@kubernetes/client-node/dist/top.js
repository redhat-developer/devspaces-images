"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topNodes = exports.NodeStatus = exports.ResourceUsage = void 0;
const tslib_1 = require("tslib");
const util_1 = require("./util");
class ResourceUsage {
    constructor(Capacity, RequestTotal, LimitTotal) {
        this.Capacity = Capacity;
        this.RequestTotal = RequestTotal;
        this.LimitTotal = LimitTotal;
    }
}
exports.ResourceUsage = ResourceUsage;
class NodeStatus {
    constructor(Node, CPU, Memory) {
        this.Node = Node;
        this.CPU = CPU;
        this.Memory = Memory;
    }
}
exports.NodeStatus = NodeStatus;
function topNodes(api) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // TODO: Support metrics APIs in the client and this library
        const nodes = yield api.listNode();
        const result = [];
        for (const node of nodes.body.items) {
            const availableCPU = util_1.quantityToScalar(node.status.allocatable.cpu);
            const availableMem = util_1.quantityToScalar(node.status.allocatable.memory);
            let totalPodCPU = 0;
            let totalPodCPULimit = 0;
            let totalPodMem = 0;
            let totalPodMemLimit = 0;
            let pods = yield util_1.podsForNode(api, node.metadata.name);
            pods = pods.filter((pod) => pod.status.phase === 'Running');
            pods.forEach((pod) => {
                const cpuTotal = util_1.totalCPU(pod);
                totalPodCPU += cpuTotal.request;
                totalPodCPULimit += cpuTotal.limit;
                const memTotal = util_1.totalMemory(pod);
                totalPodMem += memTotal.request;
                totalPodMemLimit += memTotal.limit;
            });
            const cpuUsage = new ResourceUsage(availableCPU, totalPodCPU, totalPodCPULimit);
            const memUsage = new ResourceUsage(availableMem, totalPodMem, totalPodMemLimit);
            result.push(new NodeStatus(node, cpuUsage, memUsage));
        }
        return result;
    });
}
exports.topNodes = topNodes;
//# sourceMappingURL=top.js.map