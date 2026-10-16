# Component adoption

The internal dashboard preserves the component matrix, filters, source drilldowns and freshness evidence. Its destination is `dash.designsystem1.com` (confirmed by the owner). The former `/app/reports/components`, `/reports/components` and `/reports` routes redirect to the dashboard, without report data. Reports is absent from public navigation.

The existing app sign-in supplies a Convex Auth token. Before serving the dashboard HTML, creating its browser session or reading any report data, the Worker calls `users:current` on the app's deployment and requires all three: the configured owner user ID, email `jaa90@icloud.com`, and `emailVerified: true` derived from the stored verification timestamp. Missing configuration or an unavailable identity authority fails closed. The report adds no account or sign-in provider.

Only `/app/signin` and its data-free static shell/assets are public on the dashboard host. A same-origin authenticated POST to `/api/dashboard/session` sets a host-only `__Host-` cookie with HttpOnly, Secure, SameSite=Strict and a one-hour maximum age. The cookie contains the existing session token; the Worker revalidates it with Convex on every protected HTML request. Tokens never appear in URLs. Sign-out clears the cookie and revokes the existing Convex session. The report API continues to require a freshly checked bearer token; no report snapshot is bundled in the shell, assets or cookies. Protected responses are private/no-store and noindex.

## Catalogue and layout

Column names and layer names are resolved from the shared component directory: Core, Unit and Page. Existing specialist controls keep their documented implementation names. Split compatibility uses are combined into Button and Switch into Toggle, retaining original tags and every source site in the drilldown. Chart includes its Bars, Range, Ratio and Spark elements. Spacing handle and Loading appear in this private report even though they are internal in public catalogues. Count cells use the 20px square (scaled by `--sf`) and the shared GT America compressed face.

## Source and counts

`scripts/component-adoption.ts` reads tracked web source for the fifteen configured product and client surfaces. The studio owns names, roots, manifests, exclusions and deferrals in `0001/server/component-adoption.config.json`; the reusable scanner loads that configuration rather than maintaining a four-app list. Link remains measured but is deferred from migration recommendations. Design system 1’s own app/site are included, while its component implementation and examples are excluded. Native applications are outside this web-source overview. It records each checkout's revision and dirty state. Tests, generated files, vendor/shared-design internals, shared sign-in internals and development preview directories are excluded. Untracked files and native apps are outside the scan. Product components nested in a folder named `design` (such as Consistency's color library) remain included; root-level shared design snapshots and Link's `src/pages/design` demonstration routes are excluded. Tracked files need not be reachable from a running app, so this is a source inventory, not a deployment or runtime count.

Each cell counts authored JSX, HTML, Lit template and DOM creation sites. A site inside a loop counts once. The scanner expands the inspected Link tab/tooltip adapters and DS1's React Input, Textarea, Composer, Menu, Accordion, Avatar, Logo, AvatarGroup, Token, TokenField, Checkbox, Radio, Switch, Select, ColorInput, Button, ButtonLink, Split and DialogContent adapters at imported JSX uses and avoids counting their inner DS1 element twice. For these shared adapters, it follows direct imports or pure registration/re-export entries to the product snapshot, then verifies the adapter and its dependency graph against the recorded DS1 revision. A modified adapter counts as needs review even when the Lit component remains verified. Native dialog elements and literal dialog/alertdialog roles, including explicit setAttribute calls, count as local Dialog sites. Role assignments count at their authored assignment site; repeated assignments can refer to the same runtime element. A native dialog directly inside ds-dialog is its shared frame and is not counted again. A native button directly inside ds-button is its shared face and is not counted again. Direct const document.createElement declarations joined with append/appendChild in the same scope are recognized too; a native button counts as DS1-styled when its creation and an explicit classList.add("ds-button") occur in the same lexical block. A native button directly composed inside a ds-button face is counted only as that shared component. Dynamic composition is not inferred. DialogContent counts once in Dialog; its composed title, description and close control are not counted again. Composer has its own column for highlighted native writing fields. Its direct native textarea frame is not counted again. Text areas, literal checkbox/radio types and switch roles have their own columns; dynamic types remain in Input. Native choice frames directly inside ds-checkbox/ds-radio/ds-switch/ds-select are not counted again; native select controls have their own Select column. Literal color inputs and ds-color use the Color column; ds-swatch has a separate Swatch column. The native input directly inside ds-color is its frame and is not counted twice. ButtonLink counts in Button and preserves its native anchor frame. Accordion counts once at its imported use; its internal disclosure button is not counted again. Avatar and its Logo binding count their shared imported uses; Avatar group counts shared group uses separately from their marks. Token and Token field count at shared adapter uses; the native input directly inside ds-token-field is its frame and is not counted twice. The field owns its composed suggestion menu, so that internal menu is not counted again. unrecognized local avatar abstractions are not inferred. Other React abstractions and dynamic names are not inferred.

- **DS1 components:** Lit element sites whose component dependency graph matches the consumer manifest and its recorded DS1 Git revision. A verified old snapshot remains shared; details flag when it differs from today's source.
- **DS1 styles:** native controls with literal shared control classes and verified `controls.css` and component tokens. They remain native controls, separate from Lit adoption.
- **Local:** recognized `ezo-` / `c9y-` components and native controls or semantic text/list/form/table elements. Native semantics can be appropriate; these are review leads.
- **Needs review:** DS1 element/style sites without sufficient source evidence, including locally modified copies. A manifest hash alone cannot establish provenance: it must also match the named source revision.

A zero is no recognized usage, not proof that the capability is absent. An unavailable checkout is `?`, never zero. Source paths and lines are available by selecting a cell. The report does not include source contents, credentials or absolute paths.

File picker has its own column. Literal native `input type="file"` sites count as local there; direct native children of `ds-file-picker` are its frame, counted once. The source-owned React `FilePicker` adapter counts at verified imported uses. Dynamic input types and imperative type assignments remain in Input; they are not inferred as file pickers. The picker composes its Button face internally, which is not an additional product-authored Button site.

## Refresh and verify

Run `vp run reports:scan` from this repository. It writes `.reports/component-adoption.json`, which is ignored by Git. An unavailable source makes the command fail so publishing cannot silently replace a complete snapshot with missing data. Refresh after component migrations; page reloads read the latest published snapshot and do not scan the developer's disk.

Checks:

```sh
vp test tests/component-adoption.test.ts services/test/reports.test.ts services/test/dashboard.test.ts services/test/site.test.ts services/test/config.test.ts
vp run app:build
cd services
vp exec tsc --noEmit
```

## Owner access and release

The app's existing owner must sign in once before access can be configured. `vp run reports:configure` checks the app's `VITE_CONVEX_URL`, reads `SIGN_IN_OWNER_EMAIL` from that deployment, requires the requested address, and resolves exactly one existing account with a matching verified user record. It makes no changes and does not print account values. Missing or ambiguous accounts stop configuration; let the owner complete sign-in rather than creating an account for them.

After hostname confirmation, follow the harness deployment policy:

1. Confirm the checkout is the intended release source and the app's backend URL matches the deployment being used.
2. Run `node scripts/configure-report-access.mjs --apply`. This writes `REPORTS_AUTH_URL` and `REPORTS_OWNER_ID` as Worker secrets. It does not modify Convex or its accounts.
3. Check the `ds-one-libraries` bucket's public access with `wrangler r2 bucket dev-url get` and `wrangler r2 bucket domain list` from `services/`. Both direct public access paths must remain disabled: only the authenticated Worker may read report data.
4. Publish the small `users:current` response addition to the app’s existing live backend (dry run before deploy); do not select the unused deployment by its production label. Bind the confirmed dashboard custom domain in `wrangler.jsonc` and test both routing and configuration.
5. Run `vp run reports:upload` to rescan and upload `reports/component-adoption.json` into that private bucket, then `vp run deploy` to publish the site and Worker. The public stylesheet routes only resolve `ds1/` keys and cannot serve `reports/` keys.
6. Verify anonymously that `/api/reports/components` returns 401, then as the owner verify the snapshot timestamp and at least one cell. Another authenticated account must get 403. Report responses use `private, no-store` and no CORS permission.

For local Worker data, run `vp run reports:scan` and `vp run reports:upload:local`. The latter targets the configured local preview bucket, without publishing anything remotely. Data is never copied into `website/public`, `website/dist`, app bundles, Pagefind, or the npm package.


Shared context-menu adapters are verified as a complete dependency graph through
`react/context-menu.ts`, including pure product re-exports and imported aliases.
`ContextMenuContent` and `ContextMenuSubContent` count in Menu; their Item,
SubTrigger, CheckboxItem and RadioItem count in Button, Label in Text, and
FilePicker in File picker. Root/state providers, groups and the composed
indicators are not additional sites. Earlier scans did not infer Radix React
abstractions: the increase when migrating those rows is expanded recognition,
not a like-for-like reduction in a previously counted local column.

Badge counts verified `ds-badge` and imported source-owned React `Badge` uses. Its icon and label are internal composition, not extra authored product sites. Local status-chip abstractions are not inferred by name.
