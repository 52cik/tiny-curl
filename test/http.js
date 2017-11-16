import test from 'ava';
import curl from '..';
import { createServer } from './helpers/server';

let s;

test.before('setup', async () => {
  s = await createServer();

  s.on('/', (req, res) => {
    res.end('ok');
  });

  s.on('/empty', (req, res) => {
    res.end();
  });

  s.on('/304', (req, res) => {
    res.statusCode = 304;
    res.end();
  });

  s.on('/404', (req, res) => {
    res.statusCode = 404;
    res.end('not');
  });

  s.on('/?recent=true', (req, res) => {
    res.end('recent');
  });

  await s.listen(s.port);
});

test('simple request', async (t) => {
  t.is((await curl(s.url)).body, 'ok');
});

test('empty response', async (t) => {
  t.is((await curl(`${s.url}/empty`)).body, '');
});

test('buffer on encoding === null', async (t) => {
  const data = (await curl(s.url, { encoding: null })).body;
  t.truthy(Buffer.isBuffer(data));
});

test('query option', async (t) => {
  t.is((await curl(s.url, { query: { recent: true } })).body, 'recent');
  t.is((await curl(s.url, { query: 'recent=true' })).body, 'recent');
});

test.after('cleanup', async () => {
  await s.close();
});
