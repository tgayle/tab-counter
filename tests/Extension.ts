import { Locator, Page } from '@playwright/test';

export class ExtensionPage {
  constructor(
    readonly page: Page,
    readonly id: string,
  ) {}

  get indexPagePath() {
    return `chrome-extension://${this.id}/src/pages/popup/index.html`;
  }

  get tabGroupItems() {
    return this.page.getByTestId('tab-group-item');
  }

  get tabItems() {
    return this.page.getByTestId('tab-item');
  }

  get toggleSearchButton() {
    return this.page.getByTestId('toggle-search');
  }

  get filterSelectDropdown() {
    return this.page.getByTestId('tab-filter-select');
  }

  get filterMenu() {
    return this.page.getByTestId('tab-filter-menu');
  }

  get filterMenuButton() {
    return this.page.getByTestId('tab-filter-menu-btn');
  }

  get searchInput() {
    return this.page.getByTestId('tab-search-input');
  }

  async openTabs(...urls: string[]) {
    const context = this.page.context();
    const pages = await Promise.all(
      urls.map(async (url) => {
        const page = await context.newPage();
        await page.goto(url);
        return page;
      }),
    );

    await this.page.bringToFront();
    return pages;
  }

  async setSearchQuery(query: string) {
    if (!(await this.searchInput.isVisible())) {
      await this.toggleSearchButton.click();
    }

    await this.searchInput.fill(query);
  }

  async setFilterOption(value: string) {
    await this.filterMenuButton.click();
    await this.filterMenu.getByText(value, { exact: true }).click();
  }

  tabGroup(n: number) {
    return new TabGroup(this.tabGroupItems.nth(n));
  }
}

class TabGroup {
  constructor(readonly root: Locator) {}

  get title() {
    return this.root.locator('[title]').first();
  }

  get tabCount() {
    return this.root.getByTestId('group-tab-count');
  }
}
