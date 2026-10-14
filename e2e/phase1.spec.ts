import { expect, test } from '@playwright/test';
import { acts } from '../data/copy';

test('Phase 1 loading, navigation, motion, and act wiring', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('INITIALIZING SYSTEM')).toBeHidden();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-loading');

  const menuButton = page.getByRole('button', { name: 'MENU', exact: true });
  await menuButton.click();
  const navDialog = page.getByRole('dialog');
  const closeButton = navDialog.getByRole('button', { name: 'CLOSE', exact: true });
  await expect(page.locator('html')).toHaveAttribute('data-menu', 'open');
  await expect(closeButton).toBeFocused();

  for (const act of acts) {
    await expect(navDialog.getByRole('link', { name: act.label, exact: true })).toBeVisible();
  }
  const systemsLink = navDialog.getByRole('link', { name: 'Systems', exact: true });
  await expect(navDialog.getByRole('link', { name: /^Journal/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(navDialog.getByRole('link', { name: /^Contact/ })).toHaveAttribute('aria-disabled', 'true');

  // Nav owns the Tab cycle so expected focus targets are stable across browser engines.
  await page.keyboard.press('Shift+Tab');
  await expect(systemsLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(navDialog).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute('data-menu');
  await expect(menuButton).toBeFocused();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByRole('heading', { name: /THE NEXT HORIZON IS HUMAN/ })).toBeVisible();
  await expect(page.locator('.lenis')).toHaveCount(0);

  for (const act of acts) {
    await expect(page.getByText(act.label, { exact: true }).first()).toBeAttached();
  }
});
