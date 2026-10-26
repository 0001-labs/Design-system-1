/**
 * The pure parts of Flavo's places in Consistency's app: no DOM, so they test on their own (`tests/consistency.test.ts`)
 * and run the same in Flavo and in the app, where Sync 1 copies this folder (`places` in `sync.exports.mjs`).
 *
 * A place reaches Flavo only through what the app hands it (`FlavoPlaceContext`): `transport(operation, args)` for
 * Flavo's business store (`/team/api/business` as the owner, through the platform), `route(path, init)` for the site's
 * own routes (`design`), the site's origin for its pictures and pages, and `say` for the app's toast.
 */

/** One of Flavo's business operations, answered with its `value`; a refusal throws with Flavo's own words. */
export type Transport = (operation: string, args?: Record<string, unknown>) => Promise<unknown>;
/** One of the site's own routes under `/team/api/`, as JSON. */
export type SiteRoute = <T>(route: string, init?: RequestInit & { json?: unknown }) => Promise<T>;

export interface FlavoPlaceContext {
  transport: Transport;
  route: SiteRoute;
  /** The site's address, `https://flavo.c9y.site`: its pictures and pages are read there. */
  origin: string;
  /** The app's toast, for what was done; an error stays until it is closed. */
  say: (words: string, tone?: "default" | "error") => void;
}

export interface Product {
  _id?: string;
  sourceId: string;
  productType?: "sale" | "poster";
  homepageSlot?: 1 | 2 | null;
  notionManaged?: boolean;
  sourceImageFiles?: string[];
  imageFiles?: string[];
  slug: string;
  title: string;
  category: string;
  material: string;
  description: string;
  images: string[];
  price: number | null;
  quantity: number | null;
  published: boolean;
  updatedAt: number;
}

export interface ContentPage {
  _id?: string;
  path: string;
  title: string;
  text: string;
  images: string[];
  imageFiles?: string[];
  published: boolean;
  updatedAt: number;
}

export type Role = "admin" | "editor";
export interface Member {
  _id: string;
  userId?: string;
  name: string;
  company: string;
  phone: string;
  cvr: string;
  roles: Role[];
}
export interface Me {
  email: string;
  roles: Role[];
  profile: Member | null;
  flags?: { "flavo-profile-flags"?: boolean };
}

/** The catalogue's categories, by the id the records keep, in Danish. */
export const categories: Record<string, string> = {
  Vases: "Vaser",
  Tableware: "Borddækning",
  Fabric: "Tekstiler",
  Other: "Objekter",
  Posters: "Plakater",
};

/** What a refused or failed call says: Flavo's own words when it gave a sentence, else that Flavo could not be reached. */
export function failure(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && /\s/.test(code.trim())) return code.trim();
  if (status === 401 || status === 403) return "Log ind med System igen for at fortsætte.";
  return "Flavo kunne ikke nås. Prøv igen.";
}

/**
 * A picture's address in the app: the site's pictures are on its own origin. A private catalogue file
 * (`/api/media/<id>`) needs a Flavo session there, which the app does not have; its public address
 * (`/media/uploads/<id>`) shows it once the product or page is published.
 */
export function mediaUrl(origin: string, url: string): string {
  if (/^https:\/\//.test(url)) return url;
  if (!url.startsWith("/")) return "";
  const site = origin.replace(/\/+$/, "");
  return site + url.replace(/^\/api\/media\//, "/media/uploads/");
}

/** A page of a list, as the business store answers it. */
export interface Page<T> { page: T[]; isDone: boolean; continueCursor: string }

/** Every page of a paginated list, `size` at a time, at most `most` rows. */
export async function allPages<T>(transport: Transport, operation: string, args: Record<string, unknown> = {}, size = 100, most = 2000): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null = null;
  for (;;) {
    const answer = (await transport(operation, { ...args, paginationOpts: { numItems: size, cursor } })) as Page<T>;
    rows.push(...(answer?.page ?? []));
    if (!answer || answer.isDone || rows.length >= most) return rows;
    cursor = answer.continueCursor;
  }
}

/** A product's kind: sale, poster or rental (a product without a type rents, as on the site). */
export type ProductKind = "sale" | "poster" | "rental";
export const kindOf = (product: Pick<Product, "productType">): ProductKind => product.productType ?? "rental";

/** The kind in the list's words. */
export function kindWords(product: Pick<Product, "productType" | "homepageSlot">): string {
  if (product.productType === "sale") return `Salg${product.homepageSlot ? ` · Forside ${product.homepageSlot}` : ""}`;
  if (product.productType === "poster") return "Salg · Plakat";
  return "Events · Udlejning";
}

export interface ProductFilter { search: string; category: string; visibility: "all" | "published" | "draft"; kind: "all" | ProductKind }

/** The products a filter shows, in the order given. */
export function filterProducts(products: readonly Product[], filter: ProductFilter): Product[] {
  const needle = filter.search.trim().toLowerCase();
  return products.filter(product =>
    `${product.title} ${product.material} ${categories[product.category] ?? product.category}`.toLowerCase().includes(needle) &&
    (!filter.category || product.category === filter.category) &&
    (filter.kind === "all" || kindOf(product) === filter.kind) &&
    (filter.visibility === "all" || product.published === (filter.visibility === "published")));
}

/** A new product, a draft rental in Vases until it is chosen otherwise. */
export const newProduct = (now = Date.now()): Product => ({
  sourceId: `flavo-${crypto.randomUUID()}`, slug: "", title: "", category: "Vases", material: "", description: "", images: [],
  price: null, quantity: null, published: false, updatedAt: now,
});

/** The fields `catalogue:save` takes, from a product being edited. */
export function productFields(product: Product) {
  return {
    sourceId: product.sourceId, productType: product.productType, homepageSlot: product.homepageSlot ?? null, slug: product.slug,
    title: product.title, category: product.category, material: product.material, description: product.description,
    images: product.images, imageFiles: product.imageFiles, price: product.price, quantity: product.quantity,
    published: product.published, updatedAt: product.updatedAt,
  };
}

/** A product type chosen: a sale keeps its place on the homepage, the rest leave it. */
export function withKind(product: Product, kind: string): Product {
  const productType = kind === "sale" || kind === "poster" ? kind : undefined;
  return { ...product, productType, homepageSlot: productType === "sale" ? product.homepageSlot ?? null : null };
}

/** What a field for a price or a quantity holds: empty is unknown, never zero. */
export function numberOf(value: string, whole = false): number | null | undefined {
  const text = value.trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0 || (whole && !Number.isSafeInteger(number))) return undefined;
  return number;
}

/** What is wrong with a product before it is sent, in the form's words, or nothing. */
export function productProblem(product: Product): string {
  if (!product.title.trim()) return "Skriv en titel.";
  if (!/^[a-z0-9-]+$/.test(product.slug)) return "Adressen er små bogstaver, tal og bindestreger.";
  if (product.homepageSlot && product.productType !== "sale") return "Forsiden viser salgsprodukter.";
  return "";
}

/** A price in kroner, or that it is asked for. */
export const price = (value: number | null) =>
  value === null ? "Pris på forespørgsel" : new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK" }).format(value);

/** A list with the item at `from` moved one place back (-1) or forward (+1). */
export function moveItem<T>(items: readonly T[], from: number, by: -1 | 1): T[] {
  const to = from + by;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return [...items];
  const next = [...items];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** The Notion connection in words. */
export interface NotionStatus { configured?: boolean; status?: string; processed?: number; error?: string | null; lastSuccess?: number | null }
export function notionWords(state: NotionStatus | null): string {
  if (!state) return "Henter lagerforbindelsen…";
  if (!state.configured) return "Afventer forbindelse til Notion.";
  if (state.status === "running") return `Synkroniserer · ${state.processed ?? 0} produkter`;
  if (state.error) return state.error;
  return state.lastSuccess ? `Senest synkroniseret ${new Date(state.lastSuccess).toLocaleString("da-DK")} · automatisk hvert 15. minut` : "Klar til første synkronisering.";
}

/** The team (members with a role) or the clients (those without), searched by company, name and CVR. */
export function membersOf(members: readonly Member[], team: boolean, search = "", me?: Me | null): Member[] {
  const needle = search.trim().toLowerCase();
  return members
    .map(member => (me?.profile && member._id === me.profile._id ? { ...member, roles: me.roles } : member))
    .filter(member => Boolean(member.roles.length) === team && `${member.company} ${member.name} ${member.cvr}`.toLowerCase().includes(needle));
}

export const roleWords = (role: Role) => (role === "admin" ? "Administrator" : "Redaktør");
export const roleAbout = (role: Role) => (role === "admin" ? "Administrator — forespørgsler og adgang" : "Redaktør — produkter og sider");

/** A new member's fields, and what `accounts:invite` or `accounts:createClient` takes from them. */
export interface MemberDraft { firstName: string; lastName: string; email: string; company: string; phone: string; cvr: string; admin: boolean; editor: boolean }
export const emptyDraft = (): MemberDraft => ({ firstName: "", lastName: "", email: "", company: "", phone: "", cvr: "", admin: false, editor: false });
export function draftCall(draft: MemberDraft, team: boolean): { operation: string; args: Record<string, unknown> } | { problem: string } {
  const name = `${draft.firstName.trim()} ${draft.lastName.trim()}`.replace(/\s+/g, " ").trim();
  const email = draft.email.trim().toLowerCase();
  if (!name) return { problem: "Skriv fornavn og efternavn." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { problem: "Skriv en gyldig e-mail." };
  if (team) {
    if (!draft.admin && !draft.editor) return { problem: "Vælg redaktør eller administrator." };
    return { operation: "accounts:invite", args: { name, email, admin: draft.admin, editor: draft.editor } };
  }
  if (!draft.company.trim()) return { problem: "Skriv virksomhedens navn." };
  if (draft.cvr.trim() && !/^\d{8}$/.test(draft.cvr.trim())) return { problem: "CVR er 8 cifre." };
  return { operation: "accounts:createClient", args: { company: draft.company.trim(), name, email, phone: draft.phone.trim(), cvr: draft.cvr.trim() } };
}

/** A name in its first word and the rest, and back. */
export function splitName(name: string) {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return space < 0 ? { first: trimmed, last: "" } : { first: trimmed.slice(0, space), last: trimmed.slice(space + 1).trim() };
}
export const joinName = (first: string, last: string) => `${first} ${last}`.replace(/\s+/g, " ").trim();

/** Link's connection, as `link:connection` answers it. */
export interface LinkConnection { status: "off" | "pending" | "connected" | "expired"; workspaceName?: string; code?: string; verificationUrl?: string }
export interface LinkCustomer { id: string; name: string; projects: { id: string; name: string; status: string | null }[] }
export function linkWords(connection: LinkConnection | null | undefined): string {
  if (connection === undefined) return "Henter Link…";
  if (!connection || connection.status === "off" || connection.status === "expired") return connection?.status === "expired" ? "Forbindelsen udløb. Prøv igen." : "Forbind en Link-konto for at vise dens kunder og projekter her.";
  if (connection.status === "pending") return `Godkend Flavo CMS i Link${connection.code ? ` med koden ${connection.code}` : ""}.`;
  return `Forbundet${connection.workspaceName ? ` med ${connection.workspaceName}` : ""}. Kunder og projekter fra Link står nedenfor.`;
}
export const linkCustomersOf = (customers: readonly LinkCustomer[], search: string) => {
  const needle = search.trim().toLowerCase();
  return customers.filter(customer => `${customer.name} ${customer.projects.map(project => project.name).join(" ")}`.toLowerCase().includes(needle));
};

/** Content pages, or the projects among them (under `/projekter/`), searched by title and address. */
export function pagesOf(pages: readonly ContentPage[], projects: boolean, search = ""): ContentPage[] {
  const needle = search.trim().toLowerCase();
  return pages.filter(page => page.path.startsWith("/projekter/") === projects && `${page.title} ${page.path}`.toLowerCase().includes(needle));
}

/** The fields `catalogue:savePage` takes. */
export const pageFields = (page: ContentPage) => ({ path: page.path, title: page.title, text: page.text, images: page.images, imageFiles: page.imageFiles, published: page.published, updatedAt: page.updatedAt });

/** Every product picture, with the product it belongs to, searched by the product's title. */
export function mediaOf(products: readonly Product[], search = "") {
  const needle = search.trim().toLowerCase();
  return products.flatMap(product => product.images.map((url, index) => ({ product, url, key: `${product.sourceId}-${index}` }))).filter(image => image.product.title.toLowerCase().includes(needle));
}

/** One of Flavo's homepage designs, as `design` answers them. */
export interface Design { id: string; name: string; description: string; image: string; color: string }
export function designWords(selected: string, active: string | null): string {
  return selected === active ? "Dette design bruges på hjemmesiden." : "Forhåndsvisning. Hjemmesiden ændres først, når du vælger Brug design.";
}

/** Whether two values differ as the store would keep them. */
export const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
