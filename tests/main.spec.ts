import { expect } from '@playwright/test';
import { test } from './base';

test('extension opens', async ({ page, extension, context }) => {
  await expect(extension.tabItems).toHaveCount(2);
});

test('tab list automatically updates when a tab is opened', async ({
  extension,
}) => {
  await expect(extension.tabItems).toHaveCount(2);
  await extension.openTabs('https://google.com');
  await expect(extension.tabItems).toHaveCount(3);
});
