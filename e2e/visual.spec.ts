import { expect, test } from '@playwright/test';
import { formatStatistic, stats } from '../data/stats';

const sections = ['#departure', '#manifesto', '#transit', '#timeline', '#technology-index', '#arrival', '#stats', '#stories', '#return', '#footer'];
const requestedSections = process.env.MERIDIAN_VISUAL_SECTIONS?.split(',').map((name) => name.trim());
const sectionsToCapture = requestedSections?.length
  ? sections.filter((section) => requestedSections.includes(section.slice(1)))
  : sections;

test('sections match visual baselines at desktop and mobile sizes', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: 'canvas, .cursor, .site-footer__clock-time { visibility: hidden !important; }',
  });

  for (const selector of sectionsToCapture) {
    const section = page.locator(selector).first();
    await expect(section, `Missing visual baseline section ${selector}`).toHaveCount(1);
    const heading = section.locator('h1, h2').first();
    await expect(heading, `Missing visible heading in ${selector}`).toHaveCount(1);
    const inspectorSection = selector === '#transit' || selector === '#arrival';
    if (inspectorSection) {
      const reducedMotion = testInfo.project.name.includes('reduced-motion');
      const expectedScroll = await section.evaluate((element, reduce) => {
        const top = element.getBoundingClientRect().top + window.scrollY;
        const pinTravel = Math.max(0, element.getBoundingClientRect().height - window.innerHeight);
        const position = top + (reduce ? 0 : pinTravel * 0.4);
        window.scrollTo(0, position);
        return position;
      }, reducedMotion);
      await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), expectedScroll)).toBeLessThanOrEqual(1);
    } else {
      await heading.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    }
    const y = await page.evaluate(() => window.scrollY);
    await expect.poll(() => page.evaluate((value) => Math.abs(window.scrollY - value), y)).toBeLessThanOrEqual(1);
    if (!inspectorSection) await expect(heading).toBeInViewport({ ratio: 0.25 });
    if (inspectorSection) {
      const kind = selector === '#transit' ? 'orbit' : 'craft';
      const controlSelector = selector === '#transit' ? '[data-orbit-select]' : '[data-craft-select]';
      const panel = section.locator(selector === '#transit' ? '[data-orbit-inspection]' : '[data-craft-inspection]');
      const reset = panel.locator(`[data-inspection-reset="${kind}"]`);
      await expect(panel).toHaveAttribute('data-selected', 'none');
      await expect(panel).toBeInViewport();
      await expect(panel.locator('[data-inspection-description]')).toBeVisible();
      await expect(reset).toBeDisabled();
      await expect(reset).toBeInViewport();
      await expect.poll(() => reset.evaluate((element) => {
        let opacity = 1;
        let current: Element | null = element;
        while (current) {
          opacity *= Number.parseFloat(getComputedStyle(current).opacity);
          current = current.parentElement;
        }
        return opacity;
      })).toBeGreaterThan(0.5);
      const controls = panel.locator(controlSelector);
      await expect(controls).toHaveCount(3);
      for (let index = 0; index < 3; index += 1) {
        await expect(controls.nth(index)).toBeVisible();
        await expect(controls.nth(index)).toBeInViewport({ ratio: 0.1 });
        await expect.poll(() => controls.nth(index).evaluate((element) => {
          let opacity = 1;
          let current: Element | null = element;
          while (current) {
            opacity *= Number.parseFloat(getComputedStyle(current).opacity);
            current = current.parentElement;
          }
          return opacity;
        })).toBeGreaterThan(0.5);
      }
    }
    await page.waitForTimeout(1600);
    await expect.poll(() => heading.evaluate((element) => {
      let opacity = 1;
      let current: Element | null = element;
      while (current) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
        current = current.parentElement;
      }
      return opacity;
    })).toBeGreaterThan(0.5);
    if (selector === '#stats') {
      for (const stat of stats) {
        const numeral = section.locator(`[data-stat-numeral="${stat.id}"]`);
        await expect.poll(() => numeral.textContent()).toBe(formatStatistic({ ...stat, suffix: '' }));
      }
    }
    const safeName = selector.slice(1);
    await expect(page).toHaveScreenshot(`${safeName}-${testInfo.project.name}.png`, {
      animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.02,
    });
  }
});
