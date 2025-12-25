import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler';
import zhCommon from '@/locales/zh/common.json';
import zhBlocks from '@/locales/zh/blocks.json';

const i18n = createI18n({
  locale: 'zh',
  legacy: false,
});

i18n.global.mergeLocaleMessage('zh', enCommon);
i18n.global.mergeLocaleMessage('zh', enBlocks);

export default i18n;
