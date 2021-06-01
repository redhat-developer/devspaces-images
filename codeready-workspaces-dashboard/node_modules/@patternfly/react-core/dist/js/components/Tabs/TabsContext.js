"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabsContextConsumer = exports.TabsContextProvider = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const TabsContext = React.createContext({
    variant: 'default'
});
exports.TabsContextProvider = TabsContext.Provider;
exports.TabsContextConsumer = TabsContext.Consumer;
//# sourceMappingURL=TabsContext.js.map