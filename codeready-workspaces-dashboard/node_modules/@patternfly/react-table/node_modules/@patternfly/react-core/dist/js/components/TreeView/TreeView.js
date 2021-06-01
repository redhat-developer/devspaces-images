"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeView = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const TreeViewList_1 = require("./TreeViewList");
const TreeViewListItem_1 = require("./TreeViewListItem");
const TreeViewRoot_1 = require("./TreeViewRoot");
exports.TreeView = (_a) => {
    var { data, isNested = false, hasChecks = false, hasBadges = false, defaultAllExpanded = false, allExpanded, icon, expandedIcon, parentItem, onSelect, onCheck, onSearch, searchProps, activeItems, compareItems = (item, itemToCheck) => item.id === itemToCheck.id, className } = _a, props = tslib_1.__rest(_a, ["data", "isNested", "hasChecks", "hasBadges", "defaultAllExpanded", "allExpanded", "icon", "expandedIcon", "parentItem", "onSelect", "onCheck", "onSearch", "searchProps", "activeItems", "compareItems", "className"]);
    const treeViewList = (React.createElement(TreeViewList_1.TreeViewList, { isNested: isNested, onSearch: onSearch, searchProps: searchProps }, data.map(item => {
        var _a;
        return (React.createElement(TreeViewListItem_1.TreeViewListItem, Object.assign({ key: ((_a = item.id) === null || _a === void 0 ? void 0 : _a.toString()) || item.name.toString(), name: item.name, id: item.id, isExpanded: allExpanded, defaultExpanded: item.defaultExpanded !== undefined ? item.defaultExpanded : defaultAllExpanded, onSelect: onSelect, onCheck: onCheck, hasCheck: item.hasCheck !== undefined ? item.hasCheck : hasChecks, checkProps: item.checkProps, hasBadge: item.hasBadge !== undefined ? item.hasBadge : hasBadges, customBadgeContent: item.customBadgeContent, badgeProps: item.badgeProps, activeItems: activeItems, parentItem: parentItem, itemData: item, icon: item.icon !== undefined ? item.icon : icon, expandedIcon: item.expandedIcon !== undefined ? item.expandedIcon : expandedIcon, action: item.action, compareItems: compareItems }, (item.children && {
            children: (React.createElement(exports.TreeView, { data: item.children, isNested: true, parentItem: item, hasChecks: hasChecks, hasBadges: hasBadges, allExpanded: allExpanded, defaultAllExpanded: defaultAllExpanded, onSelect: onSelect, onCheck: onCheck, activeItems: activeItems, icon: icon, expandedIcon: expandedIcon }))
        }))));
    })));
    return (React.createElement(React.Fragment, null, parentItem ? (treeViewList) : (React.createElement(TreeViewRoot_1.TreeViewRoot, Object.assign({ hasChecks: hasChecks, className: className }, props), treeViewList))));
};
exports.TreeView.displayName = 'TreeView';
//# sourceMappingURL=TreeView.js.map