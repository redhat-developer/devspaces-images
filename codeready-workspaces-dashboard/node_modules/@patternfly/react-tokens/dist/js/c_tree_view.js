"use strict";
exports.__esModule = true;
exports.c_tree_view = {
  ".pf-c-tree-view": {
    "c_tree_view_PaddingTop": {
      "name": "--pf-c-tree-view--PaddingTop",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view_PaddingBottom": {
      "name": "--pf-c-tree-view--PaddingBottom",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_indent_base": {
      "name": "--pf-c-tree-view__node--indent--base",
      "value": "calc(1rem * 2 + 1rem)",
      "values": [
        "calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth)",
        "calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md)",
        "calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md)",
        "calc(pf-size-prem(16px) * 2 + pf-font-prem(16px))",
        "calc(1rem * 2 + 1rem)"
      ]
    },
    "c_tree_view__node_nested_indent_base": {
      "name": "--pf-c-tree-view__node--nested-indent--base",
      "value": "calc(calc(1rem * 2 + 1rem) - 1rem)",
      "values": [
        "calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md)",
        "calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md)",
        "calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md)",
        "calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md)",
        "calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px))",
        "calc(calc(1rem * 2 + 1rem) - 1rem)"
      ]
    },
    "c_tree_view__node_PaddingTop": {
      "name": "--pf-c-tree-view__node--PaddingTop",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_PaddingRight": {
      "name": "--pf-c-tree-view__node--PaddingRight",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_PaddingBottom": {
      "name": "--pf-c-tree-view__node--PaddingBottom",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "0"
    },
    "c_tree_view__node_Color": {
      "name": "--pf-c-tree-view__node--Color",
      "value": "#151515",
      "values": [
        "--pf-global--Color--100",
        "$pf-global--Color--100",
        "$pf-color-black-900",
        "#151515"
      ]
    },
    "c_tree_view__node_m_current_Color": {
      "name": "--pf-c-tree-view__node--m-current--Color",
      "value": "#06c",
      "values": [
        "--pf-global--link--Color",
        "$pf-global--link--Color",
        "$pf-global--primary-color--100",
        "$pf-color-blue-400",
        "#06c"
      ]
    },
    "c_tree_view__node_m_current_FontWeight": {
      "name": "--pf-c-tree-view__node--m-current--FontWeight",
      "value": "700",
      "values": [
        "--pf-global--FontWeight--bold",
        "$pf-global--FontWeight--bold",
        "700"
      ]
    },
    "c_tree_view__node_hover_BackgroundColor": {
      "name": "--pf-c-tree-view__node--hover--BackgroundColor",
      "value": "#f0f0f0",
      "values": [
        "--pf-global--BackgroundColor--200",
        "$pf-global--BackgroundColor--200",
        "$pf-color-black-200",
        "#f0f0f0"
      ]
    },
    "c_tree_view__node_focus_BackgroundColor": {
      "name": "--pf-c-tree-view__node--focus--BackgroundColor",
      "value": "#f0f0f0",
      "values": [
        "--pf-global--palette--black-200",
        "$pf-color-black-200",
        "#f0f0f0"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Top": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Top",
      "value": "0.5rem",
      "values": [
        "--pf-c-tree-view__node--PaddingTop",
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "0",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "0"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_TranslateX": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--TranslateX",
      "value": "-100%"
    },
    "c_tree_view__node_toggle_icon_MinWidth": {
      "name": "--pf-c-tree-view__node-toggle-icon--MinWidth",
      "value": "1rem",
      "values": [
        "--pf-global--FontSize--md",
        "$pf-global--FontSize--md",
        "pf-font-prem(16px)",
        "1rem"
      ]
    },
    "c_tree_view__node_toggle_icon_Transition": {
      "name": "--pf-c-tree-view__node-toggle-icon--Transition",
      "value": "all 250ms cubic-bezier(.42, 0, .58, 1)",
      "values": [
        "--pf-global--Transition",
        "$pf-global--Transition",
        "all 250ms cubic-bezier(.42, 0, .58, 1)"
      ]
    },
    "c_tree_view__node_toggle_button_PaddingTop": {
      "name": "--pf-c-tree-view__node-toggle-button--PaddingTop",
      "value": "0.375rem",
      "values": [
        "--pf-global--spacer--form-element",
        "$pf-global--spacer--form-element",
        "pf-size-prem(6px)",
        "0.375rem"
      ]
    },
    "c_tree_view__node_toggle_button_PaddingRight": {
      "name": "--pf-c-tree-view__node-toggle-button--PaddingRight",
      "value": "1rem",
      "values": [
        "--pf-global--spacer--md",
        "$pf-global--spacer--md",
        "pf-size-prem(16px)",
        "1rem"
      ]
    },
    "c_tree_view__node_toggle_button_PaddingBottom": {
      "name": "--pf-c-tree-view__node-toggle-button--PaddingBottom",
      "value": "0.375rem",
      "values": [
        "--pf-global--spacer--form-element",
        "$pf-global--spacer--form-element",
        "pf-size-prem(6px)",
        "0.375rem"
      ]
    },
    "c_tree_view__node_toggle_button_PaddingLeft": {
      "name": "--pf-c-tree-view__node-toggle-button--PaddingLeft",
      "value": "1rem",
      "values": [
        "--pf-global--spacer--md",
        "$pf-global--spacer--md",
        "pf-size-prem(16px)",
        "1rem"
      ]
    },
    "c_tree_view__node_toggle_button_MarginTop": {
      "name": "--pf-c-tree-view__node-toggle-button--MarginTop",
      "value": "calc(0.375rem * -1)",
      "values": [
        "calc(--pf-global--spacer--form-element * -1)",
        "calc($pf-global--spacer--form-element * -1)",
        "calc(pf-size-prem(6px) * -1)",
        "calc(0.375rem * -1)"
      ]
    },
    "c_tree_view__node_toggle_button_MarginBottom": {
      "name": "--pf-c-tree-view__node-toggle-button--MarginBottom",
      "value": "calc(0.375rem * -1)",
      "values": [
        "calc(--pf-global--spacer--form-element * -1)",
        "calc($pf-global--spacer--form-element * -1)",
        "calc(pf-size-prem(6px) * -1)",
        "calc(0.375rem * -1)"
      ]
    },
    "c_tree_view__node_check_MarginRight": {
      "name": "--pf-c-tree-view__node-check--MarginRight",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_count_MarginLeft": {
      "name": "--pf-c-tree-view__node-count--MarginLeft",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_count_c_badge_m_read_BackgroundColor": {
      "name": "--pf-c-tree-view__node-count--c-badge--m-read--BackgroundColor",
      "value": "#d2d2d2",
      "values": [
        "--pf-global--disabled-color--200",
        "$pf-global--disabled-color--200",
        "$pf-color-black-300",
        "#d2d2d2"
      ]
    },
    "c_tree_view__search_PaddingTop": {
      "name": "--pf-c-tree-view__search--PaddingTop",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__search_PaddingRight": {
      "name": "--pf-c-tree-view__search--PaddingRight",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__search_PaddingBottom": {
      "name": "--pf-c-tree-view__search--PaddingBottom",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__search_PaddingLeft": {
      "name": "--pf-c-tree-view__search--PaddingLeft",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_icon_PaddingRight": {
      "name": "--pf-c-tree-view__node-icon--PaddingRight",
      "value": "0.5rem",
      "values": [
        "--pf-global--spacer--sm",
        "$pf-global--spacer--sm",
        "pf-size-prem(8px)",
        "0.5rem"
      ]
    },
    "c_tree_view__node_icon_Color": {
      "name": "--pf-c-tree-view__node-icon--Color",
      "value": "#6a6e73",
      "values": [
        "--pf-global--icon--Color--light",
        "$pf-global--icon--Color--light",
        "$pf-color-black-600",
        "#6a6e73"
      ]
    },
    "c_tree_view__list_item_m_expanded__node_toggle_icon_Rotate": {
      "name": "--pf-c-tree-view__list-item--m-expanded__node-toggle-icon--Rotate",
      "value": "90deg"
    },
    "c_tree_view__node_text_max_lines": {
      "name": "--pf-c-tree-view__node-text--max-lines",
      "value": "1"
    },
    "c_tree_view__action_MarginLeft": {
      "name": "--pf-c-tree-view__action--MarginLeft",
      "value": "1rem",
      "values": [
        "--pf-global--spacer--md",
        "$pf-global--spacer--md",
        "pf-size-prem(16px)",
        "1rem"
      ]
    },
    "c_tree_view__action_focus_BackgroundColor": {
      "name": "--pf-c-tree-view__action--focus--BackgroundColor",
      "value": "#f0f0f0",
      "values": [
        "--pf-global--BackgroundColor--200",
        "$pf-global--BackgroundColor--200",
        "$pf-color-black-200",
        "#f0f0f0"
      ]
    },
    "c_tree_view__action_Color": {
      "name": "--pf-c-tree-view__action--Color",
      "value": "#6a6e73",
      "values": [
        "--pf-global--icon--Color--light",
        "$pf-global--icon--Color--light",
        "$pf-color-black-600",
        "#6a6e73"
      ]
    },
    "c_tree_view__action_hover_Color": {
      "name": "--pf-c-tree-view__action--hover--Color",
      "value": "#151515",
      "values": [
        "--pf-global--icon--Color--dark",
        "$pf-global--icon--Color--dark",
        "$pf-color-black-900",
        "#151515"
      ]
    },
    "c_tree_view__action_focus_Color": {
      "name": "--pf-c-tree-view__action--focus--Color",
      "value": "#151515",
      "values": [
        "--pf-global--icon--Color--dark",
        "$pf-global--icon--Color--dark",
        "$pf-color-black-900",
        "#151515"
      ]
    }
  },
  ".pf-c-tree-view__node.pf-m-current": {
    "c_tree_view__node_Color": {
      "name": "--pf-c-tree-view__node--Color",
      "value": "#06c",
      "values": [
        "--pf-c-tree-view__node--m-current--Color",
        "--pf-global--link--Color",
        "$pf-global--link--Color",
        "$pf-global--primary-color--100",
        "$pf-color-blue-400",
        "#06c"
      ]
    }
  },
  ".pf-c-tree-view__node .pf-c-tree-view__node-count .pf-c-badge.pf-m-read": {
    "c_badge_m_read_BackgroundColor": {
      "name": "--pf-c-badge--m-read--BackgroundColor",
      "value": "#d2d2d2",
      "values": [
        "--pf-c-tree-view__node-count--c-badge--m-read--BackgroundColor",
        "--pf-global--disabled-color--200",
        "$pf-global--disabled-color--200",
        "$pf-color-black-300",
        "#d2d2d2"
      ]
    }
  },
  ".pf-c-tree-view__action:hover": {
    "c_tree_view__action_Color": {
      "name": "--pf-c-tree-view__action--Color",
      "value": "#151515",
      "values": [
        "--pf-c-tree-view__action--hover--Color",
        "--pf-global--icon--Color--dark",
        "$pf-global--icon--Color--dark",
        "$pf-color-black-900",
        "#151515"
      ]
    }
  },
  ".pf-c-tree-view__action:focus": {
    "c_tree_view__action_Color": {
      "name": "--pf-c-tree-view__action--Color",
      "value": "#151515",
      "values": [
        "--pf-c-tree-view__action--focus--Color",
        "--pf-global--icon--Color--dark",
        "$pf-global--icon--Color--dark",
        "$pf-color-black-900",
        "#151515"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 1 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 1 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 1 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 1 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 1 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 1 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 1 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 1 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 1 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 1 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 1 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 2 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 2 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 2 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 2 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 2 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 2 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 2 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 2 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 2 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 2 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 2 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 3 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 3 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 3 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 3 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 3 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 3 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 3 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 3 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 3 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 3 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 3 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 4 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 4 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 4 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 4 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 4 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 4 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 4 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 4 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 4 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 4 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 4 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 5 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 5 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 5 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 5 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 5 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 5 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 5 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 5 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 5 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 5 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 5 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 6 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 6 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 6 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 6 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 6 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 6 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 6 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 6 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 6 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 6 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 6 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 7 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 7 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 7 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 7 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 7 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 7 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 7 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 7 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 7 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 7 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 7 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 8 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 8 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 8 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 8 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 8 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 8 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 8 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 8 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 8 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 8 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 8 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 9 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 9 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 9 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 9 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 9 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 9 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 9 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 9 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 9 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 9 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 9 + calc(1rem * 2 + 1rem))"
      ]
    }
  },
  ".pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item .pf-c-tree-view__list-item": {
    "c_tree_view__node_PaddingLeft": {
      "name": "--pf-c-tree-view__node--PaddingLeft",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 10 + calc(1rem * 2 + 1rem))",
      "values": [
        "calc(--pf-c-tree-view__node--nested-indent--base * 10 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 10 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 10 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 10 + calc(1rem * 2 + 1rem))"
      ]
    },
    "c_tree_view__list_item__list_item__node_toggle_Left": {
      "name": "--pf-c-tree-view__list-item__list-item__node-toggle--Left",
      "value": "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 10 + calc(1rem * 2 + 1rem))",
      "values": [
        "--pf-c-tree-view__node--PaddingLeft",
        "calc(--pf-c-tree-view__node--nested-indent--base * 10 + --pf-c-tree-view__node--indent--base)",
        "calc(calc(--pf-c-tree-view__node--indent--base - --pf-global--spacer--md) * 10 + calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth))",
        "calc(calc(calc(--pf-global--spacer--md * 2 + --pf-c-tree-view__node-toggle-icon--MinWidth) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + --pf-global--FontSize--md) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md) - $pf-global--spacer--md) * 10 + calc($pf-global--spacer--md * 2 + $pf-global--FontSize--md))",
        "calc(calc(calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)) - pf-size-prem(16px)) * 10 + calc(pf-size-prem(16px) * 2 + pf-font-prem(16px)))",
        "calc(calc(calc(1rem * 2 + 1rem) - 1rem) * 10 + calc(1rem * 2 + 1rem))"
      ]
    }
  }
};
exports["default"] = exports.c_tree_view;