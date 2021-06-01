"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFormatters = void 0;
/**
 * @param {formattersType} formatters - formatters type
 */
function evaluateFormatters(formatters) {
    return (value, extra) => formatters.reduce((parameters, formatter) => ({
        value: formatter(parameters.value, parameters.extra),
        extra
    }), { value, extra }).value;
}
exports.evaluateFormatters = evaluateFormatters;
//# sourceMappingURL=evaluate-formatters.js.map