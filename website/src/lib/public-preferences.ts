import { configureI18n, getBrowserLanguage, loadTranslations, setLanguage } from '../../../DS1/0-face/i18n';
import { followSystemTheme } from '../../../DS1/0-face/theme';
import { reportFailure } from '../../../DS1/0-face/failures';
followSystemTheme();
configureI18n(window.DS_ONE_I18N ?? { persist: false, autoLoad: false });
const applyLanguage = () => setLanguage(getBrowserLanguage());
applyLanguage();
window.addEventListener('languagechange', applyLanguage);
async function readTranslations(): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('/translations.json');
      if (!response.ok) throw new Error(`Translations answered ${response.status}`);
      loadTranslations(await response.json());
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (attempt === 0 && navigator.onLine !== false) continue;
      // The page's authored text remains usable when its optional language
      // file is unavailable; keep that failure separate from module startup.
      reportFailure({ code: 'language.load', message: 'Page translations could not be loaded', error });
      return;
    }
  }
}
await readTranslations();
