const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Post-Venta
  console.log('Capturing Post-Venta...');
  await page.goto('http://localhost:3000/postventa', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/postventa.png', fullPage: true });
  console.log('  Saved /tmp/postventa.png');

  // Configuracion - Usuarios
  console.log('Capturing Usuarios...');
  await page.goto('http://localhost:3000/configuracion/usuarios', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/config-usuarios.png', fullPage: true });
  console.log('  Saved /tmp/config-usuarios.png');

  // Configuracion - Etapas
  console.log('Capturing Etapas...');
  await page.goto('http://localhost:3000/configuracion/etapas', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/config-etapas.png', fullPage: true });
  console.log('  Saved /tmp/config-etapas.png');

  // Configuracion - Proyectos
  console.log('Capturing Config Proyectos...');
  await page.goto('http://localhost:3000/configuracion/proyectos', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/config-proyectos.png', fullPage: true });
  console.log('  Saved /tmp/config-proyectos.png');

  console.log('\nAll screenshots saved!');
  await browser.close();
})();
