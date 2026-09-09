const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error(name);
  } });
  return module.exports;
}
const enums = load('lib/prisma-enums.ts');
let records = [];
const { getMissingPayoutFields, getAvailablePayoutAmount } = load('lib/payouts.ts', {
  '@/lib/prisma-enums': enums,
  '@/lib/prisma': { prisma: { payoutRequest: { findMany: async () => [] }, commission: { findMany: async query => {
    assert.equal(query.where.affiliateId, 'test-affiliate');
    assert.equal(query.where.status, 'APPROVED');
    assert.equal(query.where.order.status, 'PAID');
    return records;
  } } } },
});
const profile = { payoutMethod: 'BANK_TRANSFER', payoutHolderName: 'Test', payoutDocumentType: 'CI', payoutDocumentNumber: 'test', payoutCountry: 'UY', payoutCurrency: 'UYU', bankName: 'Test bank', bankAccountType: 'Savings', bankAccountNumber: 'test-account' };
assert.equal(getMissingPayoutFields(profile).length, 0);
assert.ok(getMissingPayoutFields({ ...profile, payoutDocumentType: '' }).includes('tipo de documento'));
assert.ok(getMissingPayoutFields({ ...profile, payoutHolderName: '  ' }).includes('titular'));
assert.equal(getMissingPayoutFields({ ...profile, bankAccountNumber: '', bankAccountAlias: 'test-alias' }).length, 0);
assert.ok(getMissingPayoutFields({ ...profile, bankAccountNumber: '' }).includes('numero de cuenta o alias'));
const manual = { ...profile, payoutMethod: 'MANUAL', payoutEmail: 'test@example.invalid', bankName: '', bankAccountType: '', bankAccountNumber: '' };
assert.equal(getMissingPayoutFields(manual).length, 0);
assert.equal(getMissingPayoutFields({ ...manual, payoutEmail: '', payoutPhone: 'test-phone' }).length, 0);
assert.ok(getMissingPayoutFields({ ...manual, payoutEmail: '' }).includes('email o telefono de cobro'));
(async () => {
  const record = (amount, status, fulfillmentStatus, sellerId = 'seller-A') => ({ amount, orderItem: { sellerId: 'seller-A' }, order: { settlements: [{ sellerId, status, fulfillmentStatus }] } });
  records = [record(100, 'AVAILABLE', 'DELIVERED'), record(200, 'AVAILABLE', 'PENDING'), record(300, 'PENDING', 'DELIVERED'), record(400, 'PAID', 'DELIVERED'), record(500, 'AVAILABLE', 'DELIVERED', 'seller-B')];
  assert.equal(await getAvailablePayoutAmount('test-affiliate', 'AFFILIATE'), 1500);
  console.log('PASS: required payout fields, empty document, bank number OR alias, manual email OR phone, and approved paid-sale eligibility independent of seller settlement and delivery. No real accounts or payouts.');
})().catch(error => { console.error(error); process.exitCode = 1; });
