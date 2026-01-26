const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Smaller viewport to force scroll
  await page.setViewportSize({ width: 1920, height: 700 });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console Error:', msg.text());
  });

  // Navigate to tramites page
  await page.goto('http://localhost:3000/tramites');
  await page.waitForTimeout(2000);

  // Click on the first card to open detail panel
  const firstCard = await page.locator('div[class*="cursor-pointer"]').first();
  await firstCard.click();
  await page.waitForTimeout(1500);

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/scroll-test-1-initial.png', fullPage: false });
  console.log('Screenshot 1: Initial view');

  // Try scrolling the sidebar scroll area (inside the sheet)
  const sidebarScrollArea = await page.locator('[role="dialog"] aside [data-slot="scroll-area-viewport"]');
  if (await sidebarScrollArea.count() > 0) {
    await sidebarScrollArea.evaluate(el => el.scrollTop = 300);
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/scroll-test-2-sidebar-scrolled.png', fullPage: false });
    console.log('Screenshot 2: After scrolling sidebar');
  } else {
    console.log('Sidebar scroll area not found');
  }

  // Try scrolling the main content scroll area
  const mainScrollArea = await page.locator('[role="dialog"] main [data-slot="scroll-area-viewport"]');
  if (await mainScrollArea.count() > 0) {
    await mainScrollArea.evaluate(el => el.scrollTop = 200);
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/scroll-test-3-main-scrolled.png', fullPage: false });
    console.log('Screenshot 3: After scrolling main content');
  } else {
    console.log('Main scroll area not found');
  }

  await browser.close();
})();
