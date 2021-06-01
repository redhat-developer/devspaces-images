import { __rest } from "tslib";
/**
 * provider.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import * as React from 'react';
import { TableDefaults } from './types';
export const ProviderContext = React.createContext({
    columns: null,
    renderers: null
});
export class Provider extends React.Component {
    render() {
        const _a = this.props, { columns, renderers, components, children } = _a, props = __rest(_a, ["columns", "renderers", "components", "children"]);
        let finalRenderers = renderers;
        if (components) {
            // eslint-disable-next-line no-console
            console.warn('`components` have been deprecated in favor of `renderers` and will be removed in the next major version, please rename!');
            finalRenderers = components;
        }
        const provider = React.createElement(renderers.table || TableDefaults.renderers.table, props, children);
        return (React.createElement(ProviderContext.Provider, { value: {
                columns,
                renderers: {
                    table: finalRenderers.table || TableDefaults.renderers.table,
                    header: Object.assign(Object.assign({}, TableDefaults.renderers.header), finalRenderers.header),
                    body: Object.assign(Object.assign({}, TableDefaults.renderers.body), finalRenderers.body)
                }
            } }, provider));
    }
}
Provider.displayName = 'Provider';
Provider.defaultProps = {
    renderers: TableDefaults.renderers
};
//# sourceMappingURL=provider.js.map