import { test as base, BrowserContext, chromium } from '@playwright/test';
import path from 'path';
import { ExtensionPage } from './Extension';
import * as fs from 'fs';

const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

export const test = base.extend<{
  context: BrowserContext;
  extension: ExtensionPage;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../dist');

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await context.addInitScript(() =>
      window.addEventListener('beforeunload', () =>
        (window as any).collectIstanbulCoverage(
          JSON.stringify((window as any).__coverage__),
        ),
      ),
    );
    await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
    await context.exposeFunction(
      'collectIstanbulCoverage',
      (coverageJSON: string) => {
        if (coverageJSON)
          fs.writeFileSync(
            path.join(
              istanbulCLIOutput,
              `playwright_coverage_${crypto.randomUUID()}.json`,
            ),
            coverageJSON,
          );
      },
    );

    await use(context);
    for (const page of context.pages()) {
      await page.evaluate(() =>
        (window as any).collectIstanbulCoverage(
          JSON.stringify((window as any).__coverage__),
        ),
      );
    }
    await context.close();
  },
  extension: async ({ context, page }, use) => {
    // for manifest v3:
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker)
      serviceWorker = await context.waitForEvent('serviceworker');

    const extensionId = serviceWorker.url().split('/')[2];
    const ext = new ExtensionPage(page, extensionId);
    await page.goto(ext.indexPagePath);
    await use(ext);
  },
});
