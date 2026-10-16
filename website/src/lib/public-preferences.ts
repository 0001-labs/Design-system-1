import { configureI18n, getBrowserLanguage, loadTranslations, setLanguage } from '../../../DS1/0-face/i18n';
import { followSystemTheme } from '../../../DS1/0-face/theme';
followSystemTheme();
configureI18n(window.DS_ONE_I18N ?? { persist: false, autoLoad: false });
const applyLanguage = () => setLanguage(getBrowserLanguage());
applyLanguage();
window.addEventListener('languagechange', applyLanguage);
const response = await fetch('/translations.json');
if (response.ok) loadTranslations(await response.json());
