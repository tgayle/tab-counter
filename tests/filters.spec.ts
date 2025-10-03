import { test } from './main.spec';
import { expect } from '@playwright/test';
test('search by URL works', async ({ extension }) => {
  await extension.openTabs('https://example.com', 'https://example.org');
  await expect(extension.tabItems).toHaveCount(4);
  await extension.setSearchQuery('example.com');
  await expect(extension.tabItems).toHaveCount(1);
});

test('search by title works', async ({ extension }) => {
  await extension.openTabs('https://example.com', 'https://example.org');
  await expect(extension.tabItems).toHaveCount(4);
  await extension.setSearchQuery('Example Domain');
  await expect(extension.tabItems).toHaveCount(2);
});
