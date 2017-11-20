import test from 'ava';
import curl from '..';
import { createServer } from './helpers/server';

let s;

test.before('setup', async () => {
  s = await createServer();

  s.on('/', (req, res) => {
    res.setHeader('method', req.method);
    req.pipe(res);
  });

  s.on('/headers', (req, res) => {
    res.end(JSON.stringify(req.headers));
  });

  s.on('/empty', (req, res) => {
    res.end();
  });

  await s.listen(s.port);
});

test('sends strings', async (t) => {
  const { body } = await curl(s.url, { body: 'wow' });
  t.is(body, 'wow');
});

test('sends plain objects as forms', async (t) => {
  const { body } = await curl(s.url, { body: { data: { such: ['w', 'o', 'w'] } } });
  t.is(body, 'data[such][0]=w&data[such][1]=o&data[such][2]=w');
});

test('sends arrays as forms', async (t) => {
  const { body } = await curl(s.url, { body: ['such', 'wow'] });
  t.is(body, '0=such&1=wow');
});

test('sends plain objects as JSON', async (t) => {
  const { body } = await curl(s.url, {
    body: { such: 'wow' },
    json: true,
  });
  t.deepEqual(body, { such: 'wow' });
});

test('sends arrays as JSON', async (t) => {
  const { body } = await curl(s.url, {
    body: ['such', 'wow'],
    json: true,
  });
  t.deepEqual(body, ['such', 'wow']);
});

test('works with empty post response', async (t) => {
  const { body } = await curl(`${s.url}/empty`, { body: 'wow' });
  t.is(body, '');
});

test('content-length header with string body', async (t) => {
  const { body } = await curl(`${s.url}/headers`, { body: 'wow' });
  const headers = JSON.parse(body);
  t.is(headers['content-length'], '3');
});

test('content-length header is not overriden', async (t) => {
  const { body } = await curl(`${s.url}/headers`, {
    body: 'wow',
    headers: {
      'content-length': '10',
    },
  });
  const headers = JSON.parse(body);
  t.is(headers['content-length'], '10');
});

test('content-length header disabled for chunked transfer-encoding', async (t) => {
  const { body } = await curl(`${s.url}/headers`, {
    body: '3\r\nwow\r\n0\r\n',
    headers: {
      'transfer-encoding': 'chunked',
    },
  });
  const headers = JSON.parse(body);
  t.is(headers['transfer-encoding'], 'chunked', 'likely failed to get headers at all');
  t.is(headers['content-length'], undefined);
});

test('content-type header is not overriden when object in options.body', async (t) => {
  const { body: headers } = await curl(`${s.url}/headers`, {
    headers: {
      'content-type': 'doge',
    },
    body: {
      such: 'wow',
    },
    json: true,
  });
  t.is(headers['content-type'], 'doge');
});

test('throws when json body is not a plain object or array', async (t) => {
  await t.throws(curl(`${s.url}`, { body: 'haha', json: true }), SyntaxError);
});

test('__proto__', async (t) => {
  const { body } = await curl(s.url, { body: { such: 'wow', __proto__: { x: 1 } } });
  t.is(body, 'such=wow');
});

test.after('cleanup', async () => {
  await s.close();
});
