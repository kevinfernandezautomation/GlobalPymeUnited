import { test, expect } from '@playwright/test';
const pages = [
  { label:'Tips', path:'/html/tips.html' },
  { label:'Crear propuesta', path:'/html/propuesta.html' },
  { label:'Financiamiento', path:'/html/financiamiento.html' },
  { label:'Apoyo IA', path:'/html/apoyo-ia.html' },
  { label:'Seguimiento', path:'/html/seguimiento.html' },
  { label:'Pago', path:'/html/pago.html' },
];
test.beforeEach(async ({ page }) => {await page.goto('/index.html');});
test('navegación principal y enlaces de menú', async ({ page, isMobile }) => {
  for (const item of pages) {
    await page.goto('/index.html');
    const toggle = page.locator('#menuToggle');
    if (await toggle.isVisible()) await toggle.click();
    const link = page.locator('#mainNav a').filter({hasText:item.label}).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(item.path.replace('.','\.').replace('/','\/')));
  }
});
test('login accesible desde encabezado', async ({ page }) => {
  await page.locator('a[href$="login.html"]').first().click();
  await expect(page).toHaveURL(/login\.html/);
});
test('selector de idioma y modo oscuro', async ({ page }) => {
  await page.locator('#languageSelect').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('suscripciones: cuatro opciones y navegación de beca', async ({ page }) => {
  await page.goto('/html/pago.html');
  await expect(page.locator('input[name="billing"]')).toHaveCount(4);
  await page.locator('input[value="scholarship"]').check();
  await page.locator('#payNow').click();
  await expect(page).toHaveURL(/beca\.html/);
});
