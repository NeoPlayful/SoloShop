import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCommon from "./locales/zh-CN/common.json";
import zhStore from "./locales/zh-CN/store.json";
import zhAdmin from "./locales/zh-CN/admin.json";
import enCommon from "./locales/en-US/common.json";
import enStore from "./locales/en-US/store.json";
import enAdmin from "./locales/en-US/admin.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": {
        common: zhCommon,
        store: zhStore,
        admin: zhAdmin,
      },
      "en-US": {
        common: enCommon,
        store: enStore,
        admin: enAdmin,
      },
    },
    fallbackLng: "zh-CN",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "soloshop-lang",
    },
  });

export default i18n;
