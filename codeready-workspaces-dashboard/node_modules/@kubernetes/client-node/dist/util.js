"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalForResource = exports.totalMemory = exports.totalCPU = exports.ResourceStatus = exports.quantityToScalar = exports.podsForNode = void 0;
const tslib_1 = require("tslib");
function podsForNode(api, nodeName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const allPods = yield api.listPodForAllNamespaces();
        return allPods.body.items.filter((pod) => pod.spec.nodeName === nodeName);
    });
}
exports.podsForNode = podsForNode;
function quantityToScalar(quantity) {
    if (!quantity) {
        return 0;
    }
    if (quantity.endsWith('m')) {
        return parseInt(quantity.substr(0, quantity.length - 1), 10) / 1000.0;
    }
    if (quantity.endsWith('Ki')) {
        return parseInt(quantity.substr(0, quantity.length - 2), 10) * 1024;
    }
    const num = parseInt(quantity, 10);
    if (isNaN(num)) {
        throw new Error('Unknown quantity ' + quantity);
    }
    return num;
}
exports.quantityToScalar = quantityToScalar;
class ResourceStatus {
    constructor(request, limit, resourceType) {
        this.request = request;
        this.limit = limit;
        this.resourceType = resourceType;
    }
}
exports.ResourceStatus = ResourceStatus;
function totalCPU(pod) {
    return totalForResource(pod, 'cpu');
}
exports.totalCPU = totalCPU;
function totalMemory(pod) {
    return totalForResource(pod, 'memory');
}
exports.totalMemory = totalMemory;
function totalForResource(pod, resource) {
    let reqTotal = 0;
    let limitTotal = 0;
    pod.spec.containers.forEach((container) => {
        if (container.resources) {
            if (container.resources.requests) {
                reqTotal += quantityToScalar(container.resources.requests[resource]);
            }
            if (container.resources.limits) {
                limitTotal += quantityToScalar(container.resources.limits[resource]);
            }
        }
    });
    return new ResourceStatus(reqTotal, limitTotal, resource);
}
exports.totalForResource = totalForResource;
//# sourceMappingURL=util.js.map