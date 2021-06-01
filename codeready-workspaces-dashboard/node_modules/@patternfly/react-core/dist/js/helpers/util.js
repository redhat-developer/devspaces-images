"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventedEvents = exports.trimLeft = exports.innerDimensions = exports.getTextWidth = exports.canUseDOM = exports.toCamel = exports.formatBreakpointMods = exports.pluralize = exports.getNextIndex = exports.keyHandler = exports.fillTemplate = exports.sideElementIsOutOfView = exports.isElementInView = exports.debounce = exports.getUniqueId = exports.capitalize = void 0;
const tslib_1 = require("tslib");
const ReactDOM = tslib_1.__importStar(require("react-dom"));
const constants_1 = require("./constants");
/**
 * @param {string} input - String to capitalize first letter
 */
function capitalize(input) {
    return input[0].toUpperCase() + input.substring(1);
}
exports.capitalize = capitalize;
/**
 * @param {string} prefix - String to prefix ID with
 */
function getUniqueId(prefix = 'pf') {
    const uid = new Date().getTime() +
        Math.random()
            .toString(36)
            .slice(2);
    return `${prefix}-${uid}`;
}
exports.getUniqueId = getUniqueId;
/**
 * @param { any } this - "This" reference
 * @param { Function } func - Function to debounce
 * @param { number } wait - Debounce amount
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
exports.debounce = debounce;
/** This function returns whether or not an element is within the viewable area of a container. If partial is true,
 * then this function will return true even if only part of the element is in view.
 *
 * @param {HTMLElement} container  The container to check if the element is in view of.
 * @param {HTMLElement} element    The element to check if it is view
 * @param {boolean} partial   true if partial view is allowed
 *
 * @returns { boolean } True if the component is in View.
 */
function isElementInView(container, element, partial) {
    if (!container || !element) {
        return false;
    }
    const containerBounds = container.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    const containerBoundsLeft = Math.floor(containerBounds.left);
    const containerBoundsRight = Math.floor(containerBounds.right);
    const elementBoundsLeft = Math.floor(elementBounds.left);
    const elementBoundsRight = Math.floor(elementBounds.right);
    // Check if in view
    const isTotallyInView = elementBoundsLeft >= containerBoundsLeft && elementBoundsRight <= containerBoundsRight;
    const isPartiallyInView = partial &&
        ((elementBoundsLeft < containerBoundsLeft && elementBoundsRight > containerBoundsLeft) ||
            (elementBoundsRight > containerBoundsRight && elementBoundsLeft < containerBoundsRight));
    // Return outcome
    return isTotallyInView || isPartiallyInView;
}
exports.isElementInView = isElementInView;
/** This function returns the side the element is out of view on (right, left or both)
 *
 * @param {HTMLElement} container    The container to check if the element is in view of.
 * @param {HTMLElement} element      The element to check if it is view
 *
 * @returns {string} right if the element is of the right, left if element is off the left or both if it is off on both sides.
 */
function sideElementIsOutOfView(container, element) {
    const containerBounds = container.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    const containerBoundsLeft = Math.floor(containerBounds.left);
    const containerBoundsRight = Math.floor(containerBounds.right);
    const elementBoundsLeft = Math.floor(elementBounds.left);
    const elementBoundsRight = Math.floor(elementBounds.right);
    // Check if in view
    const isOffLeft = elementBoundsLeft < containerBoundsLeft;
    const isOffRight = elementBoundsRight > containerBoundsRight;
    let side = constants_1.SIDE.NONE;
    if (isOffRight && isOffLeft) {
        side = constants_1.SIDE.BOTH;
    }
    else if (isOffRight) {
        side = constants_1.SIDE.RIGHT;
    }
    else if (isOffLeft) {
        side = constants_1.SIDE.LEFT;
    }
    // Return outcome
    return side;
}
exports.sideElementIsOutOfView = sideElementIsOutOfView;
/** Interpolates a parameterized templateString using values from a templateVars object.
 * The templateVars object should have keys and values which match the templateString's parameters.
 * Example:
 *    const templateString: 'My name is ${firstName} ${lastName}';
 *    const templateVars: {
 *      firstName: 'Jon'
 *      lastName: 'Dough'
 *    };
 *    const result = fillTemplate(templateString, templateVars);
 *    // "My name is Jon Dough"
 *
 * @param {string} templateString  The string passed by the consumer
 * @param {object} templateVars The variables passed to the string
 *
 * @returns {string} The template string literal result
 */
function fillTemplate(templateString, templateVars) {
    return templateString.replace(/\${(.*?)}/g, (_, match) => templateVars[match] || '');
}
exports.fillTemplate = fillTemplate;
/**
 * This function allows for keyboard navigation through dropdowns. The custom argument is optional.
 *
 * @param {number} index The index of the element you're on
 * @param {number} innerIndex Inner index number
 * @param {string} position The orientation of the dropdown
 * @param {string[]} refsCollection Array of refs to the items in the dropdown
 * @param {object[]} kids Array of items in the dropdown
 * @param {boolean} [custom] Allows for handling of flexible content
 */
function keyHandler(index, innerIndex, position, refsCollection, kids, custom = false) {
    if (!Array.isArray(kids)) {
        return;
    }
    const isMultiDimensional = refsCollection.filter(ref => ref)[0].constructor === Array;
    let nextIndex = index;
    let nextInnerIndex = innerIndex;
    if (position === 'up') {
        if (index === 0) {
            // loop back to end
            nextIndex = kids.length - 1;
        }
        else {
            nextIndex = index - 1;
        }
    }
    else if (position === 'down') {
        if (index === kids.length - 1) {
            // loop back to beginning
            nextIndex = 0;
        }
        else {
            nextIndex = index + 1;
        }
    }
    else if (position === 'left') {
        if (innerIndex === 0) {
            nextInnerIndex = refsCollection[index].length - 1;
        }
        else {
            nextInnerIndex = innerIndex - 1;
        }
    }
    else if (position === 'right') {
        if (innerIndex === refsCollection[index].length - 1) {
            nextInnerIndex = 0;
        }
        else {
            nextInnerIndex = innerIndex + 1;
        }
    }
    if (refsCollection[nextIndex] === null ||
        refsCollection[nextIndex] === undefined ||
        (isMultiDimensional &&
            (refsCollection[nextIndex][nextInnerIndex] === null || refsCollection[nextIndex][nextInnerIndex] === undefined))) {
        keyHandler(nextIndex, nextInnerIndex, position, refsCollection, kids, custom);
    }
    else if (custom) {
        if (refsCollection[nextIndex].focus) {
            refsCollection[nextIndex].focus();
        }
        // eslint-disable-next-line react/no-find-dom-node
        const element = ReactDOM.findDOMNode(refsCollection[nextIndex]);
        element.focus();
    }
    else if (position !== 'tab') {
        if (isMultiDimensional) {
            refsCollection[nextIndex][nextInnerIndex].focus();
        }
        else {
            refsCollection[nextIndex].focus();
        }
    }
}
exports.keyHandler = keyHandler;
/** This function is a helper for keyboard navigation through dropdowns.
 *
 * @param {number} index The index of the element you're on
 * @param {string} position The orientation of the dropdown
 * @param {string[]} collection Array of refs to the items in the dropdown
 */
function getNextIndex(index, position, collection) {
    let nextIndex;
    if (position === 'up') {
        if (index === 0) {
            // loop back to end
            nextIndex = collection.length - 1;
        }
        else {
            nextIndex = index - 1;
        }
    }
    else if (index === collection.length - 1) {
        // loop back to beginning
        nextIndex = 0;
    }
    else {
        nextIndex = index + 1;
    }
    if (collection[nextIndex] === undefined || collection[nextIndex][0] === null) {
        return getNextIndex(nextIndex, position, collection);
    }
    else {
        return nextIndex;
    }
}
exports.getNextIndex = getNextIndex;
/** This function is a helper for pluralizing strings.
 *
 * @param {number} i The quantity of the string you want to pluralize
 * @param {string} singular The singular version of the string
 * @param {string} plural The change to the string that should occur if the quantity is not equal to 1.
 *                 Defaults to adding an 's'.
 */
function pluralize(i, singular, plural) {
    if (!plural) {
        plural = `${singular}s`;
    }
    return `${i || 0} ${i === 1 ? singular : plural}`;
}
exports.pluralize = pluralize;
/**
 * This function is a helper for turning arrays of breakpointMod objects for data toolbar and flex into classes
 *
 * @param {object} mods The modifiers object
 * @param {any} styles The appropriate styles object for the component
 */
exports.formatBreakpointMods = (mods, styles) => Object.entries(mods || {})
    .map(([breakpoint, mod]) => `${mod}${breakpoint !== 'default' ? `-on-${breakpoint}` : ''}`)
    .map(exports.toCamel)
    .map(mod => mod.replace(/-?(\dxl)/gi, (_res, group) => `_${group}`))
    .map(modifierKey => styles.modifiers[modifierKey])
    .filter(Boolean)
    .join(' ');
const camelize = (s) => s
    .toUpperCase()
    .replace('-', '')
    .replace('_', '');
/**
 *
 * @param {string} s string to make camelCased
 */
exports.toCamel = (s) => s.replace(/([-_][a-z])/gi, camelize);
/**
 * Copied from exenv
 */
exports.canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);
/**
 * Calculate the width of the text
 * Example:
 * getTextWidth('my text', node)
 *
 * @param {string} text The text to calculate the width for
 * @param {HTMLElement} node The HTML element
 */
exports.getTextWidth = (text, node) => {
    const computedStyle = getComputedStyle(node);
    // Firefox returns the empty string for .font, so this function creates the .font property manually
    const getFontFromComputedStyle = () => {
        let computedFont = '';
        // Firefox uses percentages for font-stretch, but Canvas does not accept percentages
        // so convert to keywords, as listed at:
        // https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch
        const fontStretchLookupTable = {
            '50%': 'ultra-condensed',
            '62.5%': 'extra-condensed',
            '75%': 'condensed',
            '87.5%': 'semi-condensed',
            '100%': 'normal',
            '112.5%': 'semi-expanded',
            '125%': 'expanded',
            '150%': 'extra-expanded',
            '200%': 'ultra-expanded'
        };
        // If the retrieved font-stretch percentage isn't found in the lookup table, use
        // 'normal' as a last resort.
        let fontStretch;
        if (computedStyle.fontStretch in fontStretchLookupTable) {
            fontStretch = fontStretchLookupTable[computedStyle.fontStretch];
        }
        else {
            fontStretch = 'normal';
        }
        computedFont =
            computedStyle.fontStyle +
                ' ' +
                computedStyle.fontVariant +
                ' ' +
                computedStyle.fontWeight +
                ' ' +
                fontStretch +
                ' ' +
                computedStyle.fontSize +
                '/' +
                computedStyle.lineHeight +
                ' ' +
                computedStyle.fontFamily;
        return computedFont;
    };
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = computedStyle.font || getFontFromComputedStyle();
    return context.measureText(text).width;
};
/**
 * Get the inner dimensions of an element
 *
 * @param {HTMLElement} node HTML element to calculate the inner dimensions for
 */
exports.innerDimensions = (node) => {
    const computedStyle = getComputedStyle(node);
    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding
    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
};
/**
 * This function is a helper for truncating text content on the left, leaving the right side of the content in view
 *
 * @param {HTMLElement} node HTML element
 * @param {string} value The original text value
 */
exports.trimLeft = (node, value) => {
    const availableWidth = exports.innerDimensions(node).width;
    let newValue = value;
    if (exports.getTextWidth(value, node) > availableWidth) {
        // we have text overflow, trim the text to the left and add ... in the front until it fits
        while (exports.getTextWidth(`...${newValue}`, node) > availableWidth) {
            newValue = newValue.substring(1);
        }
        // replace text with our truncated text
        if (node.value) {
            node.value = `...${newValue}`;
        }
        else {
            node.innerText = `...${newValue}`;
        }
    }
    else {
        if (node.value) {
            node.value = value;
        }
        else {
            node.innerText = value;
        }
    }
};
/**
 * @param {string[]} events - Operations to prevent when disabled
 */
exports.preventedEvents = (events) => events.reduce((handlers, eventToPrevent) => (Object.assign(Object.assign({}, handlers), { [eventToPrevent]: (event) => {
        event.preventDefault();
    } })), {});
//# sourceMappingURL=util.js.map