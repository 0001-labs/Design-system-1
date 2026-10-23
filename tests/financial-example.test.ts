import { expect, it } from 'vite-plus/test';
import { FINANCIAL_EXAMPLE } from '../website/src/lib/financial-example';
it('uses DS1 product components with original fictional content and local-only interactions', () => {
 const { html, script } = FINANCIAL_EXAMPLE;
 for (const component of ['ds-card','ds-tabs','ds-button','ds-chart','ds-stat','ds-list']) expect(html).toContain('<'+component);
 for (const section of ['morrow-products','morrow-markets','morrow-developers','morrow-contact']) expect(html).toContain('id="'+section+'"');
 expect(html).toContain('Fictional example. No accounts are created and no money moves.');
 expect(html).not.toMatch(/Stripe|stripecdn|stripeassets|<form|type="password"|type="email"/i);
 expect(script).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|https?:\/\//);
 expect(script).toContain('No money moved.');
});
