/** The host owns durable media. The standalone lab keeps its local file drafts. */
export interface EditorMedia {
  chooseImage(anchor: HTMLElement): Promise<{ src: string; alt: string } | null>;
}
export const siteImageSource = (source: string) => /^(?:https?:\/\/|\/(?!\/))[^\s\\]+$/i.test(source) && source.length <= 4000;
