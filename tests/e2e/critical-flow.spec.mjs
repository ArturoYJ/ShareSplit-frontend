import { test, expect } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:3001/api';

function randomEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.local`;
}

test('flujo crítico UI: login, crear grupo, unirse, reclamar y pagar deuda', async ({ browser, request, page }) => {
  const userA = {
    name: 'E2E Ana',
    email: randomEmail('e2e_ana'),
    password: 'secret123',
  };
  const userB = {
    name: 'E2E Beto',
    email: randomEmail('e2e_beto'),
    password: 'secret123',
  };

  const regA = await request.post(`${API}/auth/register`, { data: userA });
  expect(regA.ok()).toBeTruthy();
  const regAData = await regA.json();

  const regB = await request.post(`${API}/auth/register`, { data: userB });
  expect(regB.ok()).toBeTruthy();

  const tokenA = regAData.token;

  await page.goto('/login');
  await page.getByLabel('Correo').fill(userA.email);
  await page.getByLabel('Contraseña').fill(userA.password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();

  await page.getByRole('link', { name: 'Crear grupo' }).click();
  await page.getByLabel('Nombre del grupo').fill('Grupo E2E Principal');
  await page.getByRole('button', { name: 'Crear grupo' }).click();

  await expect(page.getByRole('heading', { name: 'Grupo E2E Principal' })).toBeVisible();

  const codeButton = page.getByRole('button', { name: /^Código:/ });
  await expect(codeButton).toBeVisible();
  const codeText = (await codeButton.textContent()) || '';
  const inviteCode = codeText.replace('Código:', '').trim();
  expect(inviteCode.length).toBe(8);

  const groupUrl = page.url();
  const groupId = groupUrl.split('/groups/')[1].split('/')[0];

  const createExpense = await request.post(`${API}/groups/${groupId}/expenses`, {
    headers: { Authorization: `Bearer ${tokenA}` },
    data: {
      title: 'Cena E2E',
      items: [
        { name: 'Pizza', unit_price: 120, quantity: 1 },
        { name: 'Refresco', unit_price: 40, quantity: 1 },
      ],
    },
  });
  expect(createExpense.ok()).toBeTruthy();
  const expenseData = await createExpense.json();
  const expenseId = expenseData.expense.id;

  const openExpense = await request.patch(`${API}/groups/${groupId}/expenses/${expenseId}/status`, {
    headers: { Authorization: `Bearer ${tokenA}` },
    data: { status: 'open' },
  });
  expect(openExpense.ok()).toBeTruthy();

  const ctxB = await browser.newContext({ baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000' });
  const pageB = await ctxB.newPage();

  await pageB.goto('/login');
  await pageB.getByLabel('Correo').fill(userB.email);
  await pageB.getByLabel('Contraseña').fill(userB.password);
  await pageB.getByRole('button', { name: 'Entrar' }).click();

  await expect(pageB.getByRole('heading', { name: /Hola,/ })).toBeVisible();

  await pageB.getByRole('button', { name: 'Unirme con código' }).click();
  await pageB.getByPlaceholder('EJEMPLO12').fill(inviteCode);
  await pageB.getByRole('button', { name: 'Unirme' }).click();

  await pageB.getByRole('link', { name: 'Grupo E2E Principal' }).click();
  await expect(pageB.getByRole('heading', { name: 'Grupo E2E Principal' })).toBeVisible();

  await pageB.getByRole('link', { name: 'Cena E2E' }).click();
  await expect(pageB.getByRole('heading', { name: 'Cena E2E' })).toBeVisible();

  await pageB.getByRole('button', { name: /Pizza/ }).click();
  await pageB.getByRole('button', { name: /Refresco/ }).click();

  await pageB.getByRole('link', { name: '← Volver al grupo' }).click();
  await pageB.getByRole('link', { name: 'Ver balances' }).click();

  const payButton = pageB.getByRole('button', { name: 'Registrar pago' }).first();
  await expect(payButton).toBeVisible();
  await payButton.click();

  await expect(pageB.getByText('Pago registrado correctamente.')).toBeVisible();

  await ctxB.close();
});
