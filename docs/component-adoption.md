# Component adoption

`/app/reports/components` is the private matrix for Ezo, Music, Link and Consistency. `/reports/components` redirects there. The existing app sign-in supplies a Convex Auth token; the Worker checks `users:current` on the app's deployment and compares its user ID with the configured owner ID before reading any report data. The report adds no account or sign-in provider.

## Source and counts

`scripts/component-adoption.ts` reads tracked web source from the four sibling checkouts. It records each checkout's revision and dirty state. Tests, generated files, vendor/design internals, shared sign-in internals and development preview directories are excluded. Untracked files and native apps are outside the scan. Tracked files need not be reachable from a running app, so this is a source inventory, not a deployment or runtime count.

Each cell counts authored JSX, HTML, Lit template and DOM creation sites. A site inside a loop counts once. The scanner expands the inspected Link tab/tooltip adapters and DS1's React Input and Textarea adapters at imported JSX uses and avoids counting their inner DS1 element twice. For these fields, it follows direct imports or pure registration/re-export entries to the product snapshot, then verifies the adapter and its dependency graph against the recorded DS1 revision. A modified adapter counts as needs review even when the Lit component remains verified. Text areas have their own column; native select controls remain in Input. Other React abstractions and dynamic names are not inferred.

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
