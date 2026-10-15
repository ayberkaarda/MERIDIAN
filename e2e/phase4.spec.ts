import { expect, test } from '@playwright/test';
import { copy } from '../data/copy';
import { formatStatistic, stats } from '../data/stats';
import { stories } from '../data/stories';

const isReducedMotion = (name: string): boolean => name.includes('reduced-motion');

async function scrollToElement(page: import('@playwright/test').Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
}

test('one persistent canvas and spacecraft pin labels follow the orbit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(1);

  const craft = page.locator('#arrival[data-craft-pin]');
  await expect(craft).toBeAttached();
  const labels = copy.spacecraft.labels;
  const webgl = await page.locator('canvas').evaluate((element) => {
    try {
      return element instanceof HTMLCanvasElement && element.getContext('webgl2') !== null;
    } catch {
      return false;
    }
  });

  for (const label of labels) await expect(craft.getByText(label, { exact: true })).toBeAttached();
  test.skip(!webgl, 'WebGL2 is unavailable; projected spacecraft label visibility cannot be exercised.');

  if (isReducedMotion(test.info().project.name)) {
    for (const label of labels) await expect(craft.getByText(label, { exact: true })).toBeVisible();
    return;
  }

  const sectionTop = await craft.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  const step = await page.evaluate(() => window.innerHeight * 2.5);
  for (const [index, label] of labels.entries()) {
    const cue = [0.12, 0.42, 0.7].at(index);
    if (cue === undefined) throw new Error(`Missing spacecraft cue ${index}`);
    await page.evaluate(({ top, progress, distance }) => window.scrollTo(0, top + distance * progress), {
      top: sectionTop,
      progress: cue + 0.06,
      distance: step,
    });
    const target = craft.locator('[data-craft-label]').nth(index);
    const control = target.locator('button[data-craft-select]');
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await expect(craft.getByText(label, { exact: true })).toBeVisible();
    const leader = craft.locator('[data-craft-leader]').nth(index);
    const leaderWasProjected = await leader.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).opacity) > 0.95,
    );
    await page.evaluate(({ top, progress, distance }) => window.scrollTo(0, top + distance * progress), {
      top: sectionTop,
      progress: Math.max(0, cue - 0.06),
      distance: step,
    });
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    if (leaderWasProjected) {
      await expect.poll(() => leader.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeLessThan(0.05);
    }
  }
});

test('mission counters settle on their data values, including reduced motion', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#stats');
  await scrollToElement(page, '#stats');
  for (const stat of stats) {
    const numeral = section.locator(`[data-stat-numeral="${stat.id}"]`);
    await expect(numeral).toBeVisible();
    await expect.poll(() => numeral.textContent()).toBe(formatStatistic({ ...stat, suffix: '' }));
    await expect(section.locator('.stats__value').filter({ hasText: stat.display })).toBeAttached();
  }
});

test('theme mix and surface colour derive from scroll position, including jumps and return scroll', async ({ page }, testInfo) => {
  await page.goto('/');
  const rise = page.locator('[data-theme-rise]');
  await expect(rise).toBeAttached();
  const measureRanges = async () => {
    await page.evaluate(() => document.fonts.ready);
    let previous: { riseTop: number; setTop: number } | undefined;
    await expect.poll(async () => {
      const current = await page.evaluate(() => {
        const riseElement = document.querySelector('[data-theme-rise]');
        const setElement = document.querySelector('[data-theme-set]');
        if (!riseElement || !setElement) throw new Error('Theme range elements are missing');
        return {
          riseTop: riseElement.getBoundingClientRect().top + window.scrollY,
          setTop: setElement.getBoundingClientRect().top + window.scrollY,
        };
      });
      const stable = previous?.riseTop === current.riseTop && previous?.setTop === current.setTop;
      previous = current;
      return stable;
    }, { intervals: [100] }).toBe(true);
    return page.evaluate(() => {
      const riseElement = document.querySelector('[data-theme-rise]');
      const setElement = document.querySelector('[data-theme-set]');
      if (!riseElement || !setElement) throw new Error('Theme range elements are missing');
      const riseRect = riseElement.getBoundingClientRect();
      const setRect = setElement.getBoundingClientRect();
      return {
        rise: { top: riseRect.top + window.scrollY, height: riseRect.height, viewport: window.innerHeight },
        set: { top: setRect.top + window.scrollY, bottom: setRect.bottom + window.scrollY, height: setRect.height, viewport: window.innerHeight },
      };
    });
  };
  const readTheme = () => page.evaluate(() => ({
    mix: getComputedStyle(document.documentElement).getPropertyValue('--theme-mix').trim(),
    background: getComputedStyle(document.body).backgroundColor,
  }));

  if (isReducedMotion(testInfo.project.name)) {
    const { rise: currentRise } = await measureRanges();
    await page.evaluate(({ top, viewport }) => window.scrollTo(0, top + viewport * 0.75), currentRise);
    await expect.poll(async () => Number.parseFloat((await readTheme()).mix)).toBe(1);
    return;
  }

  const startRange = await measureRanges();
  await page.evaluate((top) => window.scrollTo(0, top), startRange.rise.top);
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), startRange.rise.top)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Number.parseFloat((await readTheme()).mix)).toBeLessThan(0.02);
  const dark = await readTheme();
  const riseRange = await measureRanges();
  const endpoint = riseRange.rise.top + riseRange.rise.height - riseRange.rise.viewport;
  const risePosition = riseRange.rise.top + (endpoint - riseRange.rise.top) * 0.7;
  await page.evaluate((top) => window.scrollTo(0, top), risePosition);
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), risePosition)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Number.parseFloat((await readTheme()).mix), { timeout: 5000 }).toBeGreaterThan(0.65);
  const light = await readTheme();
  expect(light.background).not.toBe(dark.background);

  const currentSet = await measureRanges();
  const stablePosition = currentSet.set.top + (currentSet.set.height - currentSet.set.viewport) * 0.5;
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(stablePosition).toBeLessThanOrEqual(maxScroll);
  await page.evaluate((top) => window.scrollTo(0, top), stablePosition);
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), stablePosition)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Math.abs(Number.parseFloat((await readTheme()).mix) - 0.5) < 0.05, { timeout: 5000 }).toBe(true);
  const setMidpoint = await readTheme();
  expect(Number.parseFloat(setMidpoint.mix)).toBeCloseTo(0.5, 1);
  const endSet = await measureRanges();
  const endSetEndpoint = endSet.set.bottom + endSet.set.viewport;
  const returnPosition = Math.min(endSetEndpoint + endSet.set.viewport * 2, maxScroll);
  await page.evaluate((top) => window.scrollTo(0, top), returnPosition);
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), returnPosition)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Number.parseFloat((await readTheme()).mix), { timeout: 5000 }).toBeLessThan(0.02);
  await measureRanges();
  await page.evaluate((top) => window.scrollTo(0, top), stablePosition);
  await expect.poll(() => page.evaluate((target) => Math.abs(window.scrollY - target), stablePosition)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Math.abs(Number.parseFloat((await readTheme()).mix) - 0.5) < 0.05, { timeout: 5000 }).toBe(true);
  const first = await readTheme();
  expect(first.background).toBe(setMidpoint.background);
});

test('story data, alternating desktop alignment, and interlude stay in reading order', async ({ page }, testInfo) => {
  await page.goto('/');
  const section = page.locator('#stories');
  await section.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect.poll(() => section.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(500);
  const articles = section.locator('[data-story]');
  await expect(articles).toHaveCount(stories.length);
  for (const [index, story] of stories.entries()) {
    const article = articles.nth(index);
    await expect(article.locator('h3')).toContainText(story.title);
    await expect(article.getByText(story.headline, { exact: true })).toBeAttached();
    await expect(article.locator('[data-story-panel]')).toBeAttached();
  }
  const interludeWords = copy.stories.interlude;
  for (const word of interludeWords) await expect(section.locator('[data-interlude-word]').filter({ hasText: word })).toBeAttached();
  const order = await section.evaluate((element) => {
    const nodes = Array.from(element.querySelectorAll('[data-story], [data-interlude-word]'));
    return nodes.map((node) => node.matches('[data-story]') ? `story:${node.getAttribute('data-story')}` : `word:${node.textContent?.trim()}`);
  });
  const secondStory = stories.at(1);
  const thirdStory = stories.at(2);
  if (!secondStory || !thirdStory) throw new Error('Expected three story data entries');
  const firstInterludeWord = interludeWords.at(0);
  const lastInterludeWord = interludeWords.at(-1);
  if (!firstInterludeWord || !lastInterludeWord) throw new Error('Expected interlude words');
  expect(order.indexOf(`story:${secondStory.id}`)).toBeLessThan(order.indexOf(`word:${firstInterludeWord}`));
  expect(order.indexOf(`word:${lastInterludeWord}`)).toBeLessThan(order.indexOf(`story:${thirdStory.id}`));

  const mobile = testInfo.project.use.viewport?.width === 390;
  for (const story of stories) {
    const heading = section.locator(`[data-story="${story.id}"] h3`);
    await heading.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(heading).toBeVisible();
  }
  if (!mobile && !isReducedMotion(testInfo.project.name)) {
    const alignments = await articles.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-align')));
    expect(alignments).toEqual(stories.map(({ alignment }) => alignment));
    const positions = await articles.evaluateAll((elements) => elements.map((element) => {
      const rect = element.querySelector('.story__text')?.getBoundingClientRect();
      return rect ? rect.left + rect.width / 2 : Number.NaN;
    }));
    const first = positions.at(0);
    const second = positions.at(1);
    const third = positions.at(2);
    if (first === undefined || second === undefined || third === undefined) throw new Error('Story text panels are missing');
    expect(second).toBeLessThan(first);
    expect(third).toBeGreaterThan(second);
  }
});

test('visible accent colour stays within the site budget', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#arrival[data-craft-pin]')).toBeAttached();
  const accentCount = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *'))
    .filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).color === 'rgb(255, 90, 31)').length);
  expect(accentCount).toBeLessThanOrEqual(2);
});

test('reduced motion keeps content readable without pinned scrub layouts', async ({ page }, testInfo) => {
  test.skip(!isReducedMotion(testInfo.project.name), 'This layout contract applies to reduced-motion projects.');
  await page.goto('/');
  await expect(page.locator('#arrival[data-craft-pin]')).toBeAttached();
  await expect(page.locator('#stats')).toBeVisible();
  await expect(page.locator('#stories')).toBeVisible();
  for (const label of copy.spacecraft.labels) {
    const item = page.locator('#arrival [data-craft-label]').filter({ hasText: label });
    await item.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(item).toBeVisible();
  }
  const pinned = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>(
    '[data-craft-pin], [data-orbit-pin], [data-timeline-track], [data-stat-item], [data-story-panel]',
  )).filter((element) => ['sticky', 'fixed'].includes(getComputedStyle(element).position))
    .map((element) => `${element.tagName.toLowerCase()}.${element.className}`));
  expect(pinned).toEqual([]);

  for (const story of stories) await expect(page.locator(`[data-story="${story.id}"] h3`)).toBeVisible();
  for (const stat of stats) {
    const numeral = page.locator(`[data-stat-numeral="${stat.id}"]`);
    await expect.poll(() => numeral.textContent()).toBe(formatStatistic({ ...stat, suffix: '' }));
  }
});
