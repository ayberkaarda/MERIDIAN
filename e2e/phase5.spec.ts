import { expect, test } from '@playwright/test';
import { copy } from '../data/copy';
import { footer } from '../data/footer';
import { formatStatistic, stats } from '../data/stats';

async function scrollTo(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<number> {
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  const target = await page.evaluate(() => window.scrollY);
  await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), target)).toBeLessThanOrEqual(1);
  return target;
}

test('final hero uses the data copy and its CTA navigates', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#return.final-hero');
  await expect(section.locator('h2')).toContainText(copy.finalHero.headline.join(' '));
  await expect(section.locator('.final-hero__supporting')).toHaveText(copy.finalHero.supporting);
  const cta = section.getByRole('link', { name: copy.finalHero.cta.label });
  await expect(cta).toHaveAttribute('href', copy.finalHero.cta.href);
  await scrollTo(page, section);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`${copy.finalHero.cta.href}$`));
});

test('footer links, disabled placeholders, coordinates and clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden({ timeout: 15_000 });
  const statsSection = page.locator('#stats');
  await scrollTo(page, statsSection);
  for (const stat of stats) {
    const numeral = statsSection.locator(`[data-stat-numeral="${stat.id}"]`);
    await expect.poll(() => numeral.textContent()).toBe(formatStatistic({ ...stat, suffix: '' }));
  }
  const footerNode = page.locator('#footer');
  await scrollTo(page, footerNode);
  for (const item of footer.links) {
    const link = footerNode.getByRole('link', { name: new RegExp(`^${item.label}`) });
    await expect(link).toBeVisible();
    if (item.disabled) {
      await expect(link).toHaveAttribute('aria-disabled', 'true');
      await expect(link).not.toHaveAttribute('href', /.+/);
      await expect(link.locator('.site-footer__status')).toHaveText(item.status);
    } else {
      await expect(link).toHaveAttribute('href', item.href);
    }
  }
  await expect(footerNode.locator('.site-footer__coordinates')).toHaveText(footer.coordinates);
  const time = footerNode.locator('.site-footer__clock-time');
  await expect(time).not.toHaveText(footer.clockPlaceholder);
  await expect(time).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  const width = await time.evaluate((element) => element.getBoundingClientRect().width);
  const before = await time.textContent();
  await page.waitForTimeout(2100);
  const after = await time.textContent();
  expect(after).not.toBe(before);
  expect(await time.evaluate((element) => element.getBoundingClientRect().width)).toBe(width);
  const textWithoutClock = () => page.evaluate(() => {
    const clock = document.querySelector('.site-footer__clock-time');
    return Array.from(document.querySelectorAll('body *'))
      .filter((element) => element !== clock && !element.contains(clock))
      .map((element) => element.textContent);
  });
  const beforeOtherText = await textWithoutClock();
  await page.waitForTimeout(2100);
  expect(await textWithoutClock()).toEqual(beforeOtherText);
});

test('return act, dark theme and a single canvas', async ({ page }) => {
  await page.goto('/');
  const final = page.locator('#return.final-hero');
  const top = await scrollTo(page, final);
  await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), top)).toBeLessThanOrEqual(1);
  await expect.poll(() => page.locator('.progress-rail__item[data-active="true"] .progress-rail__title').textContent()).toBe('RETURN');
  await expect.poll(() => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--theme-mix')))).toBeLessThan(0.02);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('reduced motion keeps the final hero dark', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollTo(page, page.locator('#return.final-hero'));
  await expect.poll(() => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--theme-mix')))).toBeLessThan(0.02);
});
