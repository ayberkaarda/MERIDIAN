import { expect, test, type Locator, type Page } from '@playwright/test';

const parts = ['radiator', 'docking', 'bus'] as const;
const orbitIndexes = ['0', '1', '2'] as const;

async function waitForReady(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden({ timeout: 15_000 });
  await expect(page.locator('canvas')).toHaveCount(1);
}

async function revealControl(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  await expect(control).toBeInViewport({ ratio: 0.5 });
}

async function activate(control: Locator, page: Page, mobile: boolean, key = 'Enter'): Promise<void> {
  if (mobile) {
    await control.tap();
  } else {
    await control.focus();
    await page.keyboard.press(key);
  }
}

async function expectMobileTarget(control: Locator): Promise<void> {
  const box = await control.boundingBox();
  expect(box, 'Inspection control must have a measurable touch target').not.toBeNull();
  if (!box) return;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

async function visibleText(container: Locator): Promise<string> {
  const description = container.locator('[data-inspection-description]');
  await expect(description).toBeVisible();
  return (await description.innerText()).trim();
}

test('orbital formations update projected labels and can resume the scroll journey', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith('mobile');
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await waitForReady(page);

  const section = page.locator('#transit[data-orbit-pin]');
  const inspection = page.locator('[data-orbit-inspection]');
  const controls = page.locator('[data-orbit-select]');
  const reset = page.locator('[data-inspection-reset="orbit"]');
  const projectedLabels = page.locator('[data-orbit-label]');
  await expect(section).toHaveCount(1);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(controls).toHaveCount(3);
  await expect(reset).toHaveAccessibleName(/resume journey/i);
  await expect(reset).toBeDisabled();

  let previousDescription = await visibleText(inspection);
  await revealControl(page.locator(`[data-orbit-select="${orbitIndexes[0]}"]`));
  await expect(projectedLabels).toHaveCount(3);
  for (const [position, index] of orbitIndexes.entries()) {
    const control = page.locator(`[data-orbit-select="${index}"]`);
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await revealControl(control);
    if (mobile) await expectMobileTarget(control);
    const beforeProjection = await projectedLabels.evaluateAll((labels) => labels.map((label) => (label as HTMLElement).style.transform));
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await activate(control, page, mobile, position % 2 === 0 ? 'Enter' : 'Space');
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(inspection).toHaveAttribute('data-selected', index);
    await expect(page.locator('[data-orbit-select][aria-pressed="true"]')).toHaveCount(1);
    await expect(reset).toBeEnabled();
    const description = await visibleText(inspection);
    expect(description).not.toBe(previousDescription);
    previousDescription = description;
    if (position > 0) {
      await expect.poll(() => projectedLabels.evaluateAll((labels) => labels.map((label) => (label as HTMLElement).style.transform)))
        .not.toEqual(beforeProjection);
    }
    await expect.poll(() => page.evaluate((before) => Math.abs(window.scrollY - before), beforeScroll)).toBeLessThanOrEqual(1);
    await expect(page.locator('canvas')).toHaveCount(1);
  }

  const last = page.locator(`[data-orbit-select="${orbitIndexes.at(-1)}"]`);
  await revealControl(last);
  await activate(last, page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(last).toHaveAttribute('aria-pressed', 'false');
  await expect(reset).toBeDisabled();

  const first = page.locator(`[data-orbit-select="${orbitIndexes[0]}"]`);
  await revealControl(first);
  await activate(first, page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', orbitIndexes[0]);
  const beforeReset = await page.evaluate(() => window.scrollY);
  await revealControl(reset);
  if (mobile) await expectMobileTarget(reset);
  await activate(reset, page, mobile, 'Space');
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(page.locator('[data-orbit-select][aria-pressed="true"]')).toHaveCount(0);
  await expect(reset).toBeDisabled();
  await expect.poll(() => page.evaluate((before) => Math.abs(window.scrollY - before), beforeReset)).toBeLessThanOrEqual(1);

  await revealControl(page.locator(`[data-orbit-select="${orbitIndexes[1]}"]`));
  await activate(page.locator(`[data-orbit-select="${orbitIndexes[1]}"]`), page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', orbitIndexes[1]);
  const nextSectionHeading = page.locator('#technology-index h2');
  await nextSectionHeading.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await expect.poll(() => page.evaluate((section) => {
    const bounds = document.querySelector(section)?.getBoundingClientRect();
    return bounds ? bounds.bottom < 0 : false;
  }, '#transit')).toBe(true);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(reset).toBeDisabled();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('spacecraft closeups update inspection details and Resume journey restores scroll framing', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith('mobile');
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await waitForReady(page);

  const section = page.locator('#arrival[data-craft-pin]');
  const inspection = page.locator('[data-craft-inspection]');
  const controls = page.locator('[data-craft-select]');
  const reset = page.locator('[data-inspection-reset="craft"]');
  await expect(section).toHaveCount(1);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(controls).toHaveCount(3);
  await expect(reset).toHaveAccessibleName(/resume journey/i);
  await expect(reset).toBeDisabled();

  let previousDescription = await visibleText(inspection);
  for (const [position, part] of parts.entries()) {
    const control = page.locator(`[data-craft-select="${part}"]`);
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await revealControl(control);
    if (mobile) await expectMobileTarget(control);
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await activate(control, page, mobile, position % 2 === 0 ? 'Enter' : 'Space');
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(inspection).toHaveAttribute('data-selected', part);
    await expect(page.locator('[data-craft-select][aria-pressed="true"]')).toHaveCount(1);
    await expect(reset).toBeEnabled();
    const description = await visibleText(inspection);
    expect(description).not.toBe(previousDescription);
    previousDescription = description;
    await expect.poll(() => page.evaluate((before) => Math.abs(window.scrollY - before), beforeScroll)).toBeLessThanOrEqual(1);
    await expect(page.locator('canvas')).toHaveCount(1);
  }

  const last = page.locator(`[data-craft-select="${parts.at(-1)}"]`);
  await revealControl(last);
  await activate(last, page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(last).toHaveAttribute('aria-pressed', 'false');
  await expect(reset).toBeDisabled();

  const first = page.locator(`[data-craft-select="${parts[0]}"]`);
  await revealControl(first);
  await activate(first, page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', parts[0]);
  const beforeReset = await page.evaluate(() => window.scrollY);
  await revealControl(reset);
  if (mobile) await expectMobileTarget(reset);
  await activate(reset, page, mobile, 'Space');
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(page.locator('[data-craft-select][aria-pressed="true"]')).toHaveCount(0);
  await expect(reset).toBeDisabled();
  await expect.poll(() => page.evaluate((before) => Math.abs(window.scrollY - before), beforeReset)).toBeLessThanOrEqual(1);

  await revealControl(page.locator(`[data-craft-select="${parts[1]}"]`));
  await activate(page.locator(`[data-craft-select="${parts[1]}"]`), page, mobile);
  await expect(inspection).toHaveAttribute('data-selected', parts[1]);
  await section.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.clientHeight + 1));
  await expect.poll(() => page.evaluate((sectionSelector) => {
    const bounds = document.querySelector(sectionSelector)?.getBoundingClientRect();
    return bounds ? bounds.bottom < 0 : false;
  }, '#arrival')).toBe(true);
  await expect.poll(() => inspection.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom <= 0 || bounds.top >= window.innerHeight;
  })).toBe(true);
  await expect(inspection).toHaveAttribute('data-selected', 'none');
  await expect(reset).toBeDisabled();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});
