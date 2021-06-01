"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.ProviderContext = void 0;
const tslib_1 = require("tslib");
/**
 * provider.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
const React = tslib_1.__importStar(require("react"));
const types_1 = require("./types");
exports.ProviderContext = React.createContext({
    columns: null,
    renderers: null
});
class Provider extends React.Component {
    render() {
        const _a = this.props, { columns, renderers, components, children } = _a, props = tslib_1.__rest(_a, ["columns", "renderers", "components", "children"]);
        let finalRenderers = renderers;
        if (components) {
            // eslint-disable-next-line no-console
            console.warn('`components` have been deprecated in favor of `renderers` and will be removed in the next major version, please rename!');
            finalRenderers = components;
        }
        const provider = React.createElement(renderers.table || types_1.TableDefaults.renderers.table, props, children);
        return (React.createElement(exports.ProviderContext.Provider, { value: {
                columns,
                renderers: {
                    table: finalRenderers.table || types_1.TableDefaults.renderers.table,
                    header: Object.assign(Object.assign({}, types_1.TableDefaults.renderers.header), finalRenderers.header),
                    body: Object.assign(Object.assign({}, types_1.TableDefaults.renderers.body), finalRenderers.body)
                }
            } }, provider));
    }
}
exports.Provider = Provider;
Provider.displayName = 'Provider';
Provider.defaultProps = {
    renderers: types_1.TableDefaults.renderers
};
//# sourceMappingURL=provider.js.map