import { test } from './main.spec';
import { expect } from '@playwright/test';
import { TabFilterType } from '../src/action/TabFilter';
test('duplicate tabs are listed', async ({ extension }) => {
  await extension.filterSelectDropdown.selectOption(TabFilterType.Duplicates);

  await expect(extension.tabGroupItems).toHaveCount(0);

  await extension.openTabs(
    'https://example.com',
    'https://example.com',
    'https://example.org',
  );

  await extension.tabGroupItems.click();

  await expect(extension.tabItems).toHaveCount(2, { timeout: 1000 });
  await expect(extension.tabItems.nth(0)).toHaveText(/example\.com/);
  await expect(extension.tabItems.nth(1)).toHaveText(/example\.com/);
});
