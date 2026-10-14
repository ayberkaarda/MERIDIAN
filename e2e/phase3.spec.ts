import { expect, test } from '@playwright/test';
import { copy } from '../data/copy';
import { technologies } from '../data/technologies';
import { timeline } from '../data/timeline';

test('Phase 3 timeline, orbital labels, technology index, and shared canvas', async ({ page }, testInfo) => {
  const mobile = testInfo.project.use.viewport?.width === 390;
  const reducedMotion = testInfo.project.name.includes('reduced-motion');
  await page.goto('/');

  // Canvas count is a DOM contract and remains meaningful without WebGL.
  const canvases = page.locator('canvas');
  await expect(canvases).toHaveCount(1);
  const orbital = page.locator('#transit[data-orbit-pin]');
  await expect(orbital).toBeAttached();
  for (const label of copy.orbitalSystem.labels) {
    await expect(orbital.getByText(label, { exact: true })).toBeAttached();
  }
  for (const label of copy.orbitalSystem.labels) {
    await expect(orbital.getByText(label, { exact: true })).toBeVisible();
  }

  const timelineSection = page.locator('#timeline');
  const panels = timelineSection.locator('[data-timeline-panel]');
  await expect(panels).toHaveCount(timeline.length);
  await expect(panels.locator('.timeline__year-digits')).toHaveText(timeline.map(({ year }) => String(year)));

  const accentUsage = await page.evaluate((timelineId) => {
    const section = document.getElementById(timelineId);
    const matching = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(
      (element) => element.offsetParent !== null && getComputedStyle(element).color === 'rgb(255, 90, 31)',
    );
    return {
      withinTimeline: matching.filter((element) => section?.contains(element)).map((element) => ({
        isYear: Boolean(element.matches('.timeline__year-digits, .timeline__years-item')),
        current: element.closest('[data-current="true"]') !== null,
      })),
    };
  }, 'timeline');
  expect(accentUsage.withinTimeline).toHaveLength(1);
  const timelineAccent = accentUsage.withinTimeline.at(0);
  expect(timelineAccent).toBeDefined();
  if (!timelineAccent) throw new Error('Expected a timeline accent');
  expect(timelineAccent).toMatchObject({ isYear: true, current: true });

  if (mobile || reducedMotion) {
    const layout = await panels.evaluateAll((elements) => elements.map((element) => ({
      top: element.getBoundingClientRect().top,
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
    })));
    expect(layout.every((rect, index) => {
      if (index === 0) return true;
      const previous = layout.at(index - 1);
      return previous !== undefined && rect.top > previous.top;
    })).toBe(true);
    if (mobile) {
      const overflow = await timelineSection.evaluate((element) => element.scrollWidth > element.clientWidth);
      expect(overflow).toBe(false);
    }
    if (reducedMotion) {
      const timelinePin = await timelineSection.evaluate((element) => getComputedStyle(element).position === 'fixed');
      expect(timelinePin).toBe(false);
    }
  } else {
    const track = timelineSection.locator('[data-timeline-track]');
    const positions = async () => panels.evaluateAll((elements) => {
      const firstElement = elements.at(0);
      const lastElement = elements.at(-1);
      if (!firstElement || !lastElement) throw new Error('timeline panels missing');
      const first = firstElement.getBoundingClientRect().x;
      const last = lastElement.getBoundingClientRect().x;
      return { first, last };
    });
    await timelineSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const start = await positions();
    const sectionTop = await timelineSection.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((top) => window.scrollTo(0, top + window.innerHeight * 1.5), sectionTop);
    await page.waitForTimeout(250);
    const progressed = await positions();
    expect(Math.abs(progressed.first - start.first)).toBeGreaterThan(10);
    expect(Math.abs(progressed.last - start.last)).toBeGreaterThan(10);
    await expect(track).toBeAttached();
  }

  const tech = page.locator('#technology-index');
  const techButtons = tech.locator('.tech__button');
  await expect(techButtons).toHaveCount(technologies.length);
  await expect(techButtons).toHaveText(technologies.map(({ title, number }) => `${title} ${number}`));
  const activeVisual = tech.locator('.tech__fallback[data-active="true"]');
  if (mobile) {
    for (let index = 0; index < technologies.length; index += 1) {
      const button = techButtons.nth(index);
      await button.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(100);
      await expect(button).toHaveAttribute('aria-current', 'true', { timeout: 3000 });
      const technology = technologies.at(index);
      if (!technology) throw new Error(`Missing technology at index ${index}`);
      await expect(activeVisual).toHaveAttribute('data-visual', technology.visual);
    }
  } else {
    await techButtons.nth(1).hover();
    await expect(techButtons.nth(1)).toHaveAttribute('aria-current', 'true');
    const secondTechnology = technologies.at(1);
    if (!secondTechnology) throw new Error('Expected a second technology');
    await expect(activeVisual).toHaveAttribute('data-visual', secondTechnology.visual);
    await techButtons.nth(2).focus();
    await expect(techButtons.nth(2)).toHaveAttribute('aria-current', 'true');
    const thirdTechnology = technologies.at(2);
    if (!thirdTechnology) throw new Error('Expected a third technology');
    await expect(activeVisual).toHaveAttribute('data-visual', thirdTechnology.visual);
  }
});
