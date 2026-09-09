const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Date, Set, Map, Intl, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name in mocks) return typeof mocks[name] === 'string' ? { default: mocks[name] } : mocks[name];
    throw new Error(name);
  } });
  return module.exports;
}
const helpers = load('lib/affiliate-dashboard.ts');
const now = new Date('2026-09-09T12:00:00Z');
function flatten(node) { return Array.isArray(node) ? node.flatMap(flatten) : node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : []; }
function text(node) { return Array.isArray(node) ? node.map(text).join(' ') : node == null ? '' : typeof node === 'object' ? text(node.props?.children) : String(node); }
async function render(period, role = 'SELLER', missing = []) {
  const calls = [];
  const read = (name, result) => async args => { calls.push({name,args}); return result; };
  const rows = Array.from({length: 85}, (_, i) => ({ id: `s${i}`, grossAmount: 100, netAmount: 70, platformFee: 10, affiliateFee: 20, status: 'AVAILABLE', fulfillmentStatus: 'DELIVERED', order: { id: `o${i}`, createdAt: new Date(i === 84 ? '2026-08-01T12:00:00Z' : '2026-09-08T12:00:00Z'), buyerName: 'Cliente', items: [{ total:100, quantity:1, affiliateId:'affiliate', product:{ id:'p', name:'Curso' } }] } }));
  const mocks = {
    'next/link': 'Link', 'next/navigation': { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
    'next-auth': { getServerSession: async () => role ? ({user:{id:'seller',role}}) : null },
    'next/font/google': { DM_Sans: () => ({variable:'body'}), Manrope: () => ({variable:'heading'}) },
    '@heroicons/react/24/solid': { ArrowRightIcon:'Arrow' },
    '@/components/Navbar':'Navbar', '@/components/Sidebar':'Sidebar', '@/components/PayoutRequestButton':'PayoutButton',
    '@/components/affiliate/DashboardActivity':'Activity', '@/components/affiliate/DashboardPeriodPicker':'Picker',
    '@/app/api/auth/[...nextauth]/route': {authOptions:{}},
    '@/lib/affiliate-dashboard': {...helpers,getDashboardPeriod: value => helpers.getDashboardPeriod(value,now)},
    '@/lib/payouts': { getMissingPayoutFields: () => missing, getAvailablePayoutAmount: async (id,kind) => { assert.equal(id,'seller');assert.equal(kind,'SELLER'); return 500; } },
    '../affiliate/dashboard.module.css': { default: new Proxy({}, {get:(_,key)=>String(key)}) },
    '@/lib/prisma': { prisma: {
      product: {findMany:read('products',[{id:'p',name:'Curso',price:100,isActive:true}])},
      settlement: {findMany:read('sales',rows),aggregate:read('paid',{_sum:{netAmount:200}})},
      affiliateLink: {findMany:read('links',[{affiliateId:'affiliate',productId:'p',_count:{clicks:12}}])},
      payoutRequest: {findMany:read('requests',[{id:'r',amount:70,status:'PENDING',requestedAt:now,paidAt:null,settlementIds:['s0']}])},
      user: {findUnique:read('user',{})},
    } },
  };
  const page = load('app/dashboard/seller/page.tsx',mocks).default;
  const tree = await page({searchParams:Promise.resolve({period})});
  const nodes=flatten(tree);
  for (const name of ['products','sales','paid']) assert.equal(calls.find(c=>c.name===name).args.where.sellerId,'seller');
  assert.equal(calls.find(c=>c.name==='requests').args.where.requesterId,'seller');
  assert.equal(calls.find(c=>c.name==='requests').args.where.kind,'SELLER');
  assert.equal(calls.find(c=>c.name==='links').args.where.product.sellerId,'seller');
  const salesQuery=calls.find(c=>c.name==='sales').args;
  assert.equal(salesQuery.where.order.status,'PAID'); assert.equal(salesQuery.where.status.not,'CANCELED');
  assert.equal(salesQuery.select.order.select.items.where.sellerId,'seller'); assert.equal(salesQuery.take,undefined);
  assert.equal(calls.find(c=>c.name==='paid').args.where.createdAt,undefined);
  const button=nodes.find(n=>n.type==='PayoutButton');
  if (missing.length) assert.equal(button,undefined);
  else { assert.equal(button.props.disabled,false); assert.equal(button.props.pending,false); }
  assert.ok(!text(tree).includes('7 dias despues'));
  const activities=nodes.filter(n=>n.type==='Activity');
  assert.equal(activities[1].props.items[0].label,'Cobro solicitado');
  return { balance:text(nodes.find(n=>n.props?.className==='balances')),count:activities[1].props.items.length };
}
(async()=>{
  const week=await render('7'); const month=await render('30'); const quarter=await render('90'); const all=await render('all');
  assert.equal(week.balance,all.balance); assert.equal(month.balance,quarter.balance);
  assert.equal(week.count,84); assert.equal(all.count,85);
  await render('7','SELLER',['banco']);
  await assert.rejects(render('7',null),/REDIRECT:\/login/);
  await assert.rejects(render('7','AFFILIATE'),/REDIRECT:\/dashboard\/affiliate/);
  console.log('PASS: seller access, scoped data, complete totals beyond 80 sales, 7/30/90/all, balances independent of dates, exact requested settlements, payout profile validation. No database writes or payments.');
})().catch(error=>{console.error(error);process.exitCode=1;});
