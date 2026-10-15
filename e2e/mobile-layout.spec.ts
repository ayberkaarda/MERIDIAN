import { expect, test } from '@playwright/test';

const widths = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];
const sections = ['#departure', '#manifesto', '#transit', '#timeline', '#technology-index', '#arrival', '#stats', '#stories', '#return', '#footer'];

test('mobile and tablet widths have no horizontal overflow or undersized visible controls', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Responsive layout runs in the Chromium mobile projects.');

  await page.goto('/');
  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden({ timeout: 15_000 });

  for (const viewport of widths) {
    await page.setViewportSize(viewport);
    for (const selector of sections) {
      const section = page.locator(selector).first();
      await expect(section).toHaveCount(1);
      await section.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      const y = await page.evaluate(() => window.scrollY);
      await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), y)).toBeLessThanOrEqual(1);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

      const undersized = await page.locator('a[href], button, input, select, textarea, [role="button"]')
        .evaluateAll((elements) => elements.flatMap((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || style.display === 'none') return [];
          if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return [];
          return rect.width < 44 || rect.height < 44
            ? [`${element.tagName.toLowerCase()} ${element.textContent?.trim().slice(0, 40) ?? ''}: ${Math.round(rect.width)}x${Math.round(rect.height)}`]
            : [];
        }));

      expect(undersized, `Controls below 44px at ${viewport.width}px near ${selector}: ${undersized.join(', ')}`).toEqual([]);
    }
  }
});
