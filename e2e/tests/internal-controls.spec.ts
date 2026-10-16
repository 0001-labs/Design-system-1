import { test, expect } from "@playwright/test";
test('real pointer and keyboard interaction, independent scale and automatic reduced-motion feedback', async ({page}) => {
 await page.goto('/e2e/fixtures/internal-controls.html');
 const handle=page.getByRole('slider',{name:'Spacing',exact:true});
 await handle.focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#saved')).toHaveText('30');
 const box=(await handle.boundingBox())!; await page.mouse.move(box.x+10,box.y+10); await page.mouse.down(); await page.mouse.move(box.x+40,box.y+10); await page.mouse.up(); await expect(page.locator('#saved')).toHaveText('60');
 await page.mouse.move(box.x+10,box.y+10); await page.mouse.down(); await page.mouse.move(box.x+30,box.y+10); await page.keyboard.press('Escape'); await page.mouse.up(); await expect(handle).toHaveAttribute('aria-valuenow','60'); await expect(page.locator('#saved')).toHaveText('60');
 const scaled=(await page.getByRole('slider',{name:'Scaled spacing'}).boundingBox())!;
 expect(box.width).toBe(20); expect(box.height).toBe(20); expect(scaled.width).toBe(40); expect(scaled.height).toBe(40);
 await expect(page.getByRole('status',{name:'Opening document'})).toHaveAttribute('aria-busy','true');
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('.ds-loading__fill').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
