# Component adoption

`/app/reports/components` is the private matrix for Ezo, Music, Link and Consistency. `/reports/components` redirects there. The existing app sign-in supplies a Convex Auth token; the Worker checks `users:current` on the app's deployment and compares its user ID with the configured owner ID before reading any report data. The report adds no account or sign-in provider.

## Source and counts

`scripts/component-adoption.ts` reads tracked web source from the four sibling checkouts. It records each checkout's revision and dirty state. Tests, generated files, vendor/shared-design internals, shared sign-in internals and development preview directories are excluded. Untracked files and native apps are outside the scan. Product components nested in a folder named `design` (such as Consistency's color library) remain included; root-level shared design snapshots and Link's `src/pages/design` demonstration routes are excluded. Tracked files need not be reachable from a running app, so this is a source inventory, not a deployment or runtime count.

Each cell counts authored JSX, HTML, Lit template and DOM creation sites. A site inside a loop counts once. The scanner expands the inspected Link tab/tooltip adapters and DS1's React Input, Textarea, Composer, Checkbox, Switch, Select, ColorInput, Button, Split and DialogContent adapters at imported JSX uses and avoids counting their inner DS1 element twice. For these shared adapters, it follows direct imports or pure registration/re-export entries to the product snapshot, then verifies the adapter and its dependency graph against the recorded DS1 revision. A modified adapter counts as needs review even when the Lit component remains verified. Native dialog elements and literal dialog/alertdialog roles, including explicit setAttribute calls, count as local Dialog sites. Role assignments count at their authored assignment site; repeated assignments can refer to the same runtime element. A native dialog directly inside ds-dialog is its shared frame and is not counted again. Direct const document.createElement declarations joined with append/appendChild in the same scope are recognized too; dynamic composition is not inferred. DialogContent counts once in Dialog; its composed title, description and close control are not counted again. Composer has its own column for highlighted native writing fields. Its direct native textarea frame is not counted again. Text areas, literal checkbox types and switch roles have their own columns; dynamic types remain in Input. Native choice frames directly inside ds-checkbox/ds-switch/ds-select are not counted again; native select controls have their own Select column. Literal color inputs and ds-color use the Color column; ds-swatch has a separate Swatch column. The native input directly inside ds-color is its frame and is not counted twice. Other React abstractions and dynamic names are not inferred.

- **DS1 components:** Lit element sites whose component dependency graph matches the consumer manifest and its recorded DS1 Git revision. A verified old snapshot remains shared; details flag when it differs from today's source.
- **DS1 styles:** native controls with literal shared control classes and verified `controls.css` and component tokens. They remain native controls, separate from Lit adoption.
- **Local:** recognized `ezo-` / `c9y-` components and native controls or semantic text/list/form/table elements. Native semantics can be appropriate; these are review leads.
- **Needs review:** DS1 element/style sites without sufficient source evidence, including locally modified copies. A manifest hash alone cannot establish provenance: it must also match the named source revision.

A zero is no recognized usage, not proof that the capability is absent. An unavailable checkout is `?`, never zero. Source paths and lines are available by selecting a cell. The report does not include source contents, credentials or absolute paths.

## Refresh and verify

Run `vp run reports:scan` from this repository. It writes `.reports/component-adoption.json`, which is ignored by Git. An unavailable source makes the command fail so publishing cannot silently replace a complete snapshot with missing data. Refresh after component migrations; page reloads read the latest published snapshot and do not scan the developer's disk.

Checks:

```sh
vp test tests/component-adoption.test.ts services/test/reports.test.ts services/test/site.test.ts services/test/config.test.ts
vp run app:build
cd services
vp exec tsc --noEmit
```

## Owner access and release

The app's existing owner must sign in once before access can be configured. `vp run reports:configure` checks the app's `VITE_CONVEX_URL`, reads `SIGN_IN_OWNER_EMAIL` from that deployment and resolves exactly one existing owner account. It makes no changes and does not print account values. Missing or ambiguous accounts stop configuration; let the owner complete sign-in rather than creating an account for them.

After release approval:

1. Confirm the checkout is the intended release source and the app's backend URL matches the deployment being used.
2. Run `node scripts/configure-report-access.mjs --apply`. This writes `REPORTS_AUTH_URL` and `REPORTS_OWNER_ID` as Worker secrets. It does not modify Convex or its accounts.
3. Check the `ds-one-libraries` bucket's public access with `wrangler r2 bucket dev-url get` and `wrangler r2 bucket domain list` from `services/`. Both direct public access paths must remain disabled: only the authenticated Worker may read report data.
4. Run `vp run reports:upload` to rescan and upload `reports/component-adoption.json` into that private bucket, then `vp run deploy` to publish the site and Worker. The public stylesheet routes only resolve `ds1/` keys and cannot serve `reports/` keys.
5. Verify anonymously that `/api/reports/components` returns 401, then as the owner verify the snapshot timestamp and at least one cell. Another authenticated account must get 403. Report responses use `private, no-store` and no CORS permission.

For local Worker data, run `vp run reports:scan` and `vp run reports:upload:local`. The latter targets the configured local preview bucket, without publishing anything remotely. Data is never copied into `website/public`, `website/dist`, app bundles, Pagefind, or the npm package.
