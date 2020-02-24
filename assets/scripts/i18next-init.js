$(document).ready(function() {
  var language = navigator.language || navigator.userLanguage;
  console.log("detected language ->", language);

  // Set the translation files path and fallback language
  var options = {
    fallbackLng: {
      "en-US": ["en"],
      "en-CA": ["en"],
      "en-GB": ["en"],
      "pt-PT": ["pt"],
      "pt-BR": ["pt"]
    },
    load: "languageOnly",
    preload: ["en", "pt"],
    nonExplicitWhitelist: true,
    useCookie: true,
    cookieName: "i18next",
    cookieDomain: "*.tinyeye.com",
    backend: {
      loadPath: "locales/{{lng}}/{{ns}}.json"
    },
    detection: {
      order: ["querystring", "navigator", "cookie", "localStorage"],
      lookupQuerystring: "setLng",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage", "cookie"],
      cookieMinutes: 60
    },
    debug: true
  };

  console.log("i18next options ->", options);

  //Once the translations are loaded, translates the whole document
  i18next
    .use(i18nextLocizeBackend)
    .use(i18nextBrowserLanguageDetector)
    .init(options, function(t) {
      jqueryI18next.init(i18next, $, {
        useOptionsAttr: true,
        parseDefaultValueFromContent: false
      });
      $("body").localize();
    });
});
