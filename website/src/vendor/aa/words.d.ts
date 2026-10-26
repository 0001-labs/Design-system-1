/** Words of a product's own: a table of the English words it changes, or a function giving each in the language. */
export type AaWords = Readonly<Record<string, string>> | ((words: string, language: string) => string | undefined);
/** Give Aa words of the product's own, or `null` to go back to the page's language. */
export declare function setAaWords(next: AaWords | null): void;
/** The page's language, as its root says (`da`, `pt-br`); English without one. */
export declare function aaLanguage(): string;
/** `words` in the page's language, with each `{name}` filled from `values`. */
export declare function word(words: string, values?: Readonly<Record<string, string | number>>): string;
