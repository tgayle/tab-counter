import { expect } from '@playwright/test';
import { test } from './base';

test('pinned tabs are identified in the tab list', async ({ extension }) => {
  const [target] = await extension.openTabs('https://example.com');

  await extension.pinTab(target);

  const targetTab = extension.tabItems.filter({ hasText: 'example.com' });
  await expect(targetTab).toContainText('Pinned');
});

test('pinned tabs can be excluded from popup and toolbar counts', async ({
  extension,
}) => {
  const [target] = await extension.openTabs('https://example.com');
  await extension.pinTab(target);

  const allTabsButton = extension.page.getByRole('button', {
    name: 'All tabs',
  });
  await expect(allTabsButton).toContainText('(3)');
  await expect.poll(() => extension.getBadgeText()).toBe('3');

  await extension.settingsButton.click();
  await extension.excludePinnedTabsCheckbox.check();

  await expect(extension.excludePinnedTabsCheckbox).toBeChecked();
  await expect(allTabsButton).toContainText('(2)');
  await expect.poll(() => extension.getBadgeText()).toBe('2');

  await extension.page.reload();
  await extension.settingsButton.click();
  await expect(extension.excludePinnedTabsCheckbox).toBeChecked();
});
