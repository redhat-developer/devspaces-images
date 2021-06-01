"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyTypes = exports.SelectDirection = exports.SelectVariant = exports.SelectConsumer = exports.SelectProvider = exports.SelectContext = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
exports.SelectContext = React.createContext(null);
exports.SelectProvider = exports.SelectContext.Provider;
exports.SelectConsumer = exports.SelectContext.Consumer;
var SelectVariant;
(function (SelectVariant) {
    SelectVariant["single"] = "single";
    SelectVariant["checkbox"] = "checkbox";
    SelectVariant["typeahead"] = "typeahead";
    SelectVariant["typeaheadMulti"] = "typeaheadmulti";
    SelectVariant["panel"] = "panel";
})(SelectVariant = exports.SelectVariant || (exports.SelectVariant = {}));
var SelectDirection;
(function (SelectDirection) {
    SelectDirection["up"] = "up";
    SelectDirection["down"] = "down";
})(SelectDirection = exports.SelectDirection || (exports.SelectDirection = {}));
exports.KeyTypes = {
    Tab: 'Tab',
    Space: ' ',
    Escape: 'Escape',
    Enter: 'Enter',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight'
};
//# sourceMappingURL=selectConstants.js.map