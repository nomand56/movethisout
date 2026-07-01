# i18n

This app uses [react-i18next](https://react.i18next.com/) with a global-singleton `i18next` instance (no `I18nextProvider` needed — `useTranslation()` reads from the singleton configured in `config.ts`).

## Key naming convention

Keys are flat, dot-namespaced strings following `<page>.<element>` or `<page>.<subsection>.<element>`, e.g.:

```
landing.hero_title
auth.login.submit
steps.addresses.pickup_label
dashboard.empty_state
```

The first segment groups by page/feature (`landing`, `auth`, `steps`, `dashboard`), with an optional second segment for a subsection (`auth.login.*` vs `auth.register.*`, `steps.addresses.*` vs `steps.schedule.*`). The final segment names the specific piece of copy.

## Where locale files live

`src/i18n/locales/<lng>.json` — one flat JSON file per language. Currently only `en.json` exists.

## Adding a second language

1. Create `src/i18n/locales/<lng>.json` with the same keys as `en.json`, translated.
2. Import it in `src/i18n/config.ts` and add it to the `resources` map, e.g.:
   ```ts
   import es from './locales/es.json'
   // ...
   resources: { en: { translation: en }, es: { translation: es } },
   ```
3. Add a language switcher UI somewhere that calls `i18n.changeLanguage('es')` (import `i18n` from `./config`, or use the `i18n` instance returned by `useTranslation()`).

## Scope of current extraction

All strings currently extracted (landing page, login/register, booking wizard steps, requester dashboard) already flow through `t()`, so no other code changes are needed for those surfaces when a new language is added — just translate the existing keys.

Other pages (admin, mover, chat, settings, job detail) still have hardcoded English strings and have not been extracted yet. To extract a new page, follow the same pattern: import `useTranslation`, destructure `t`, replace static UI copy with `t('page.element')` calls, and add the corresponding keys to each locale file. Zod validation schema messages are out of scope for this pattern since schemas are defined at module scope outside the component and don't have access to `t()`.
