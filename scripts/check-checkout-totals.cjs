const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, process, Date, Map });
  return module.exports;
}

async function main() {
  const product = { id: 'test-product', sellerId: 'test-seller', price: 9900, isActive: true, commissionValue: 75, seller: { platformCommissionValue: 5, platformCommissionType: 'PERCENT' } };
  let recorded;
  const prisma = {
    product: { findUnique: async () => product },
    click: { findUnique: async () => ({ id: 'test-click', link: { productId: product.id, affiliateId: 'test-affiliate' } }) },
    $transaction: async callback => {
      recorded = { commissions: [], items: [], settlements: [] };
      return callback({
        order: { create: async ({ data }) => { recorded.order = data; return { id: 'test-order', ...data }; } },
        orderItem: { create: async ({ data }) => { recorded.items.push(data); return { id: 'test-item', ...data }; } },
        commission: { create: async ({ data }) => recorded.commissions.push(data) },
        settlement: { create: async ({ data }) => recorded.settlements.push(data) },
      });
    },
  };
  const { calculateSplit } = load('lib/payments/calculateSplit.ts', {});
  const { getCheckoutDraft, createCheckoutOrder } = load('lib/payments/createOrder.ts', {
    '@/lib/prisma': { prisma }, '@/lib/payments/calculateSplit': { calculateSplit },
    '@/lib/prisma-enums': { OrderStatus: { PENDING: 'PENDING' }, CommissionStatus: { PENDING: 'PENDING' }, SettlementStatus: { PENDING: 'PENDING' } },
  });
  // Old configuration must no longer be able to add a surcharge.
  process.env.CHECKOUT_TAX_RATE = '22';
  for (const quantity of [1, 2, 20]) {
    const draft = await getCheckoutDraft([{ productId: product.id, quantity, clickId: 'test-click' }]);
    assert.equal(draft.total, product.price * quantity);
    assert.equal(draft.subtotal, draft.total);
    assert.equal(draft.taxAmount, undefined);
    const item = draft.items[0];
    assert.equal(item.affiliateAmount + item.platformAmount + item.sellerAmount, draft.total);
  }
  await createCheckoutOrder([{ productId: product.id, clickId: 'test-click' }]);
  assert.equal(recorded.order.total, 9900);
  assert.equal(recorded.order.affiliateAmount, 7425);
  assert.equal(recorded.order.platformAmount, 495);
  assert.equal(recorded.order.sellerAmount, 1980);
  assert.equal(recorded.commissions[0].amount, 7425);
  assert.equal(recorded.items[0].total, recorded.order.total);
  assert.equal(recorded.settlements[0].grossAmount, recorded.order.total);
  await createCheckoutOrder([{ productId: product.id }]);
  assert.equal(recorded.order.total, 9900);
  assert.equal(recorded.order.affiliateAmount, 0);
  assert.equal(recorded.order.sellerAmount, 9405);
  assert.equal(recorded.commissions.length, 0);
  product.isActive = false;
  await assert.rejects(getCheckoutDraft([{ productId: product.id }]), /Producto inactivo/);
  await assert.rejects(getCheckoutDraft([]), /productos validos/);
  console.log('PASS: total without taxes, quantities, affiliate attribution, commissions, settlements, direct purchase and inactive products. No real database or payment requests.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
