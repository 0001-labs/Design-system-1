import { describe, expect, test } from 'vite-plus/test';
import { emailMessage } from '../DS1/4-page/email';

describe('email design', () => {
  test('escapes message inputs while retaining plain text and action URLs', () => {
    const message = emailMessage({ product: 'Example', homeUrl: 'https://example.com', title: '<Hello>', paragraphs: ['A & B <script>alert(1)</script>'], action: { label: 'Open <work>', href: 'https://example.com/?a=1&b=2' } });
    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;Hello&gt;');
    expect(message.html).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(message.text).toContain('A & B <script>alert(1)</script>');
    expect(message.text).toContain('https://example.com/?a=1&b=2');
  });
  test('keeps the ruled-paper geometry, fallback tables, responsive scaling and dark ruling', () => {
    const { html } = emailMessage({ product: 'Example', homeUrl: 'https://example.com', title: 'Welcome', paragraphs: ['Hello'] });
    expect(html).toContain('width="240"');
    expect(html).toContain('font-size:14px');
    expect(html).toContain('rgba(0,0,0,0.07)');
    expect(html).toContain('max-width:559.98px');
    expect(html).toContain('prefers-color-scheme:dark');
    expect(html).toContain('role="presentation"');
    expect(html).not.toMatch(/href="https?:\/\/(?!example\.com)/);
    expect(html).not.toContain('var(--');
  });
});
