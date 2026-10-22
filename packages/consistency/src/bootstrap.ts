import { configureI18n } from '../../../DS1/0-face/i18n';
import '../../../DS1/0-face/theme';
import { startScaling } from '../../../DS1/0-face/scaling';
configureI18n({ languages: ['en'], autoLoad: false, sharedWords: true });
startScaling();
