import * as React from 'react';
export interface ClipboardCopyButtonProps extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    /** Callback for the copy when the button is clicked */
    onClick: (event: React.MouseEvent) => void;
    /** Content of the copy button */
    children: React.ReactNode;
    /** ID of the copy button */
    id: string;
    /** ID of the content that is being copied */
    textId: string;
    /** Additional classes added to the copy button */
    className?: string;
    /** Exit delay on the copy button tooltip */
    exitDelay?: number;
    /** Entry delay on the copy button tooltip */
    entryDelay?: number;
    /** Max width of the copy button tooltip */
    maxWidth?: string;
    /** Position of the copy button tooltip */
    position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    /** Aria-label for the copy button */
    'aria-label'?: string;
    /** Variant of the copy button */
    variant?: 'control' | 'plain';
}
export declare const ClipboardCopyButton: React.FunctionComponent<ClipboardCopyButtonProps>;
//# sourceMappingURL=ClipboardCopyButton.d.ts.map