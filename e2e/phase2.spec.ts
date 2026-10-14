import { expect, test } from '@playwright/test';
import { copy } from '../data/copy';

test('Phase 2 canvas layering and reduced-motion behavior', async ({ page }) => {
  await page.goto('/');

  const headline = copy.hero.headline.join(' ');
  await expect(page.getByRole('heading', { name: headline })).toBeVisible();

  const canvas = page.locator('canvas');
  await expect(canvas).toHaveCount(1);
  const webglAvailable = await canvas.evaluate(() => {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  });

  // Headless browser environments may lack WebGL; skip only GPU-specific checks there.
  test.skip(!webglAvailable, 'Headless browser does not provide WebGL; canvas rendering checks require it.');

  const canvasElement = await canvas.evaluate((element) => {
    const parentIsHidden = Boolean(element.closest('[aria-hidden="true"]'));
    let fixedAncestor = element.parentElement;
    while (fixedAncestor && getComputedStyle(fixedAncestor).position !== 'fixed') {
      fixedAncestor = fixedAncestor.parentElement;
    }
    return {
      parentIsHidden,
      fixedAncestorPosition: fixedAncestor ? getComputedStyle(fixedAncestor).position : null,
      hasSectionAncestor: Boolean(element.closest('main section')),
      sectionsContainCanvas: Array.from(document.querySelectorAll('main section')).some((section) => section.contains(element)),
    };
  });
  expect(canvasElement.parentIsHidden).toBe(true);
  expect(canvasElement.fixedAncestorPosition).toBe('fixed');
  expect(canvasElement.hasSectionAncestor).toBe(false);
  expect(canvasElement.sectionsContainCanvas).toBe(false);

  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden({ timeout: 10000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-loading', { timeout: 10000 });

  const headlineHitTest = await page.getByRole('heading', { name: headline }).evaluate((heading) => {
    const rect = heading.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return Boolean(hit && (heading.contains(hit) || hit.contains(heading)) && !hit.closest('canvas'));
  });
  expect(headlineHitTest).toBe(true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const initialTransform = await canvas.evaluate((element) => getComputedStyle(element).transform);
  const sections = page.locator('main section');
  for (let index = 0; index < await sections.count(); index += 1) {
    const section = sections.nth(index);
    await section.scrollIntoViewIfNeeded();
    const sectionHeading = section.getByRole('heading').first();
    if (await sectionHeading.count()) await expect(sectionHeading).toBeVisible();
    await expect(page.getByRole('heading', { name: headline })).toBeAttached();
    expect(await canvas.evaluate((element) => getComputedStyle(element).transform)).toBe(initialTransform);
  }
});
