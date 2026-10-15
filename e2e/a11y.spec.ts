import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function settle(page: import('@playwright/test').Page, selector: string): Promise<void> {
  const target = page.locator(selector);
  await target.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const y = await page.evaluate(() => window.scrollY);
  await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), y)).toBeLessThanOrEqual(1);
  // The reduced-motion reveals still finish staged opacity tweens before the
  // contrast scan; the longest current entrance sequence takes about 1.3s.
  await page.waitForTimeout(1600);
}

test('axe reports no WCAG 2 A/AA violations in dark and light themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden();
  await settle(page, '#departure');
  const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(dark.violations, dark.violations.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
  await settle(page, '#stories');
  const light = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(light.violations, light.violations.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
});

test('headings follow one unskipped hierarchy and controls have visible keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const headingLevels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll((items) => items.map((item) => Number(item.tagName.slice(1))));
  expect(headingLevels.filter((level) => level === 1)).toHaveLength(1);
  for (let index = 1; index < headingLevels.length; index += 1) {
    const previous = headingLevels.at(index - 1);
    const current = headingLevels.at(index);
    if (previous === undefined || current === undefined) throw new Error('Heading sequence is incomplete');
    expect(current).toBeLessThanOrEqual(previous + 1);
  }
  const controls = page.locator('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
  const focusableCount = await controls.count();
  let reached = 0;
  for (let index = 0; index < focusableCount + 1; index += 1) {
    await page.keyboard.press('Tab');
    const item = page.locator(':focus');
    if (await item.count() === 0 || await item.evaluate((element) => element === document.body)) break;
    if (await item.isVisible() && await item.isEnabled()) {
      reached += 1;
      const visibleFocus = await item.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0 ||
          (style.boxShadow !== 'none' && element.matches(':focus-visible'));
      });
      expect(visibleFocus, `Missing visible focus indicator on ${await item.evaluate((element) => element.outerHTML.slice(0, 100))}`).toBe(true);
    }
  }
  expect(reached).toBeGreaterThan(10);
});

test('reduced motion does not hide content behind hover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hiddenHoverContent = await page.locator('[data-hover-content], [data-hover-only], .hover-reveal').evaluateAll((elements) =>
    elements.filter((element) => {
      const style = getComputedStyle(element);
      return style.display === 'none' || Number.parseFloat(style.opacity) === 0 || style.visibility === 'hidden';
    }).length,
  );
  expect(hiddenHoverContent).toBe(0);
});
