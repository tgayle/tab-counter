import { test } from './main.spec';
import { expect } from '@playwright/test';

test('tabs can be grouped by domain', async ({ extension }) => {
  await extension.setFilterOption('Count');
  await extension.setFilterOption('Domain');

  await extension.openTabs(
    'https://example.com',
    'https://example.com',
    'https://example.org',
  );

  await expect(extension.tabGroupItems).toHaveCount(1);

  await extension.tabGroupItems.click();

  await expect(extension.tabGroup(0).tabCount).toHaveText('(2)');
});

test('tabs can be grouped by window', async ({ extension }) => {
  await extension.setFilterOption('Count');
  await extension.setFilterOption('Window');

  await extension.openTabs(
    'https://example.com',
    'https://example.com',
    'https://example.org',
  );

  await expect(extension.tabGroupItems).toHaveCount(1);
  await expect(extension.tabItems).toHaveCount(0);
});

test('tabs can be sorted in descending order', async ({ extension }) => {
  await extension.setFilterOption('Descending');
  await extension.openTabs('https://example.com', 'https://example.org');

  await expect(extension.tabItems.nth(1)).toHaveText(/example\.org/);
  await expect(extension.tabItems.nth(2)).toHaveText(/example\.com/);
});

test('tabs can be sorted in ascending order', async ({ extension }) => {
  await extension.setFilterOption('Ascending');
  await extension.openTabs('https://example.com', 'https://example.org');

  await expect(extension.tabItems.nth(1)).toHaveText(/example\.com/);
  await expect(extension.tabItems.nth(2)).toHaveText(/example\.org/);
});
