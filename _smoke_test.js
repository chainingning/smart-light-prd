// 冒烟测试：逐页打开，收集控制台错误/页面异常，校验侧栏渲染与「工作台」菜单存在
const { chromium } = require('playwright-core');

const PAGES = [
  'index.html', 'device-management.html', 'product-management.html',
  'project-management.html', 'asset-assign.html', 'dept-management.html',
  'device-group.html', 'device-placeholder.html', 'light-strategy.html',
  'menu-management.html', 'organization-management.html', 'pole-management.html',
  'role-management.html', 'strategy.html', 'user-management.html',
];
const BASE = 'http://127.0.0.1:8766/';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  let failCount = 0;

  for (const p of PAGES) {
    const errors = [];
    const onConsole = (msg) => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 200)); };
    const onPageError = (err) => errors.push('PAGEERROR: ' + String(err).slice(0, 200));
    const onResponse = (res) => { if (res.status() === 404 && !res.url().includes('favicon')) errors.push('404: ' + res.url()); };
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);
    try {
      await page.goto(BASE + p, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1200);
      const sidebarCount = await page.locator('aside.sidebar').count();
      const navTitles = await page.locator('.nav-title').count();
      const hasWorkbench = await page.locator('.nav-title', { hasText: '工作台' }).count();
      const realErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR_FAILED')
        && !e.includes('FlyDataAuthTask') && !e.includes('Failed to load resource'));
      const ok = sidebarCount === 1 && navTitles > 0 && hasWorkbench > 0 && realErrors.length === 0;
      if (!ok) failCount++;
      console.log(`${ok ? '[PASS]' : '[FAIL]'} ${p} sidebar=${sidebarCount} navTitles=${navTitles} 工作台=${hasWorkbench} errors=${realErrors.length}`);
      realErrors.slice(0, 3).forEach(e => console.log('       ERR: ' + e));
    } catch (e) {
      failCount++;
      console.log(`[FAIL] ${p} exception: ${String(e).slice(0, 150)}`);
    }
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('response', onResponse);
  }
  await browser.close();
  console.log('----');
  console.log(failCount === 0 ? 'ALL PASS' : `${failCount} PAGE(S) FAILED`);
  process.exit(failCount === 0 ? 0 : 1);
})();
