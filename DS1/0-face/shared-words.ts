/**
 * The interface words every product shares: common buttons, sign-in, empty
 * states, dates, the settings ds-cycle shows, ds-banner's words and the
 * names of the languages. Keyed by the English sentence, in the translations
 * file format, one file per language in `./translations/`.
 *
 * A product turns them on with `configureI18n({ sharedWords: true })`; they
 * sit beneath the product's own words, so the product's text wins. `nn` and
 * `no` have no file of their own and read `nb`'s; a word missing from a
 * language reads English.
 */
import type { TranslationsFile } from "./translations-format";
import da from "./translations/da.json";
import de from "./translations/de.json";
import en from "./translations/en.json";
import es from "./translations/es.json";
import fi from "./translations/fi.json";
import fr from "./translations/fr.json";
import is from "./translations/is.json";
import it from "./translations/it.json";
import ja from "./translations/ja.json";
import ko from "./translations/ko.json";
import nb from "./translations/nb.json";
import pt from "./translations/pt.json";
import ptBR from "./translations/pt-BR.json";
import sv from "./translations/sv.json";
import zh from "./translations/zh.json";

export const SHARED_WORDS: TranslationsFile = {
  ...en,
  ...da,
  ...de,
  ...es,
  ...fi,
  ...fr,
  ...is,
  ...it,
  ...ja,
  ...ko,
  ...nb,
  ...pt,
  ...ptBR,
  ...sv,
  ...zh,
};
