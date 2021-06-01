/**
 * @param {formattersType} formatters - formatters type
 */
export function evaluateFormatters(formatters) {
    return (value, extra) => formatters.reduce((parameters, formatter) => ({
        value: formatter(parameters.value, parameters.extra),
        extra
    }), { value, extra }).value;
}
//# sourceMappingURL=evaluate-formatters.js.map