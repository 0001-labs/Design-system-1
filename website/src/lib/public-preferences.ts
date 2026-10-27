import { configureI18n, getBrowserLanguage, loadTranslations, setLanguage } from '../../../DS1/0-face/i18n';
import { followSystemTheme } from '../../../DS1/0-face/theme';
import translations from '../data/translations.json';
followSystemTheme();
configureI18n(window.DS_ONE_I18N ?? { persist: false, autoLoad: false });
const applyLanguage = () => setLanguage(getBrowserLanguage());
applyLanguage();
window.addEventListener('languagechange', applyLanguage);
// Documentation and its catalogue ship together, so optional runtime requests
// cannot delay header initialization or leave the selected language unavailable.
loadTranslations(translations);
