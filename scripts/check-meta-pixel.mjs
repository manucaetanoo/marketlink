import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

function loadPixel(window) {
  const exports = {};
  vm.runInNewContext(compile('lib/meta-pixel.ts'), { exports, ...(window ? { window } : {}) });
  return exports;
}

const browser = { location: { pathname: '/register' } };
const pixel = loadPixel(browser);
const events = () => browser.fbq.queue.filter(command => command[0] === 'trackSingle');
pixel.trackMetaPageView('/register?');
pixel.trackMetaPageView('/register?'); // Effect replay / rerender / remount.
assert.equal(events().length, 1);
pixel.trackMetaPageView('/login?');
pixel.trackMetaPageView('/register?'); // Returning to a page is a real visit.
pixel.trackMetaPageView('/register?source=ad');
assert.equal(events().length, 4);
assert.equal(browser.fbq.queue.filter(command => command[0] === 'init').length, 1);
assert.deepEqual(Array.from(browser.fbq.queue[0]), ['set', 'autoConfig', false, '3610569409082578']);
assert.equal(browser.fbq, browser._fbq);
assert.equal(browser.fbq.push, browser.fbq);

for (const [status, body] of [
  [200, { created: false, role: 'AFFILIATE' }],
  [200, { created: true, role: 'AFFILIATE' }],
  [400, { created: true, role: 'AFFILIATE' }],
  [409, { error: 'Already exists' }],
  [500, {}],
  [201, null],
  [201, { role: 'AFFILIATE' }],
  [201, { created: true, role: 'SELLER' }],
  [201, { created: true, role: 'ADMIN' }],
]) pixel.trackAffiliateRegistration(status, body);
assert.equal(events().length, 4);
pixel.trackAffiliateRegistration(201, {
  created: true, role: 'AFFILIATE', email: 'private@example.test', name: 'Private', password: 'secret',
});
assert.deepEqual(Array.from(events().at(-1)), ['trackSingle', '3610569409082578', 'CompleteRegistration']);
assert.equal(events().length, 5);
assert.ok(!JSON.stringify(browser.fbq.queue).includes('private'));
const liveCalls = [];
browser.fbq.callMethod = (...args) => liveCalls.push(args);
pixel.trackMetaEvent('PageView');
assert.equal(liveCalls.length, 1);
browser.location.pathname = '/reset-password';
pixel.trackMetaEvent('CompleteRegistration');
pixel.trackMetaPageView('/reset-password?token=secret');
assert.equal(liveCalls.length, 1);
browser.location.pathname = '/register';
pixel.trackMetaPageView('/register?source=ad');
assert.equal(liveCalls.length, 2);
for (const pathname of ['/verify-email', '/reset-password', '/reset-password/']) {
  const excludedBrowser = { location: { pathname } };
  const excluded = loadPixel(excludedBrowser);
  excluded.trackMetaPageView(`${pathname}?token=secret`);
  excluded.trackMetaEvent('CompleteRegistration');
  assert.equal(excludedBrowser.fbq, undefined);
}
loadPixel().trackMetaPageView('/server');
loadPixel().trackMetaEvent('PageView');

for (const pathname of ['/register', '/verify-email', '/reset-password']) {
  for (const file of ['components/MetaPixel.tsx', 'components/MetaPixelNoscript.tsx']) {
    const exports = {};
    const jsx = (type, props) => ({ type, props });
    vm.runInNewContext(compile(file), {
      exports,
      require: name => {
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (name === 'react') return { useEffect: () => {} };
        if (name === 'next/navigation') return {
          usePathname: () => pathname,
          useSearchParams: () => new URLSearchParams('token=secret'),
        };
        if (name === 'next/script') return { default: 'Script' };
        if (name === '@/lib/meta-pixel') return pixel;
        throw new Error(name);
      },
    });
    const rendered = exports.default();
    assert.equal(rendered === null, pathname !== '/register');
  }
}

// Exercise the actual submit handler with deferred fetch and persistent refs.
function mountRegister(fetch) {
  const exports = {};
  const tracked = [];
  const states = [];
  const values = ['private@example.test', 'Private', 'secret', 'secret', true];
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile('app/register/page.tsx'), {
    exports, fetch,
    require: name => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useRef: value => ({ current: value }),
        useState: initial => {
          const i = states.length;
          states.push(i < values.length ? values[i] : initial);
          return [states[i], value => { states[i] = value; }];
        },
      };
      if (name === '@/lib/meta-pixel') return { trackAffiliateRegistration: (...args) => tracked.push(args) };
      if (name === 'next/link') return { default: 'a' };
      if (name === 'react-icons/fi') return {};
      throw new Error(name);
    },
  });
  function findForm(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'form') return node;
    for (const child of [node.props?.children].flat()) {
      const found = findForm(child);
      if (found) return found;
    }
  }
  const form = findForm(exports.default());
  return { submit: () => form.props.onSubmit({ preventDefault() {} }), tracked, states };
}

(async () => {
  let resolve;
  let requests = 0;
  const pending = new Promise(done => { resolve = done; });
  const success = mountRegister(() => { requests++; return pending; });
  assert.equal(success.tracked.length, 0);
  const first = success.submit();
  await success.submit();
  assert.equal(requests, 1);
  assert.equal(success.tracked.length, 0);
  resolve({ ok: true, status: 201, json: async () => ({ created: true, role: 'AFFILIATE' }) });
  await first;
  await success.submit();
  assert.equal(requests, 1);
  assert.equal(success.tracked.length, 1);
  assert.equal(success.states[5], false);
  for (const response of [
    async () => { throw new Error('offline'); },
    async () => ({ ok: false, status: 409, json: async () => ({ error: 'Already exists' }) }),
  ]) {
    let attempts = 0;
    const failure = mountRegister(() => { attempts++; return response(); });
    await failure.submit();
    await failure.submit();
    assert.equal(attempts, 2);
    assert.equal(failure.tracked.length, 0);
    assert.equal(failure.states[5], false);
  }
  console.log('PASS: queued/live events, single init, Strict Mode replay, return/query navigation, SSR, registration status/role guards, payload without PII, duplicate submit and network/HTTP retry. No real requests.');
})().catch(error => { console.error(error); process.exitCode = 1; });
