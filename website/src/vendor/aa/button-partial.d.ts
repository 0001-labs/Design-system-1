import './vendor/ds1/2-core/ds-button';
export declare const BUTTON_STATES: readonly ["default", "primary", "secondary", "active", "disabled", "danger"];
export type ButtonState = typeof BUTTON_STATES[number];
export type ButtonPartial = {
    label: string;
    state: ButtonState;
};
export declare function readButtonPartial(source: string): ButtonPartial | null;
export declare function writeButtonPartial({ label, state }: ButtonPartial): string;
export declare const BUTTON_PARTIAL: import("./markdown").AtomSyntax;
export declare function paintButton(button: HTMLElementTagNameMap['ds-button'], value: ButtonPartial): void;
