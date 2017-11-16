import test from 'ava';
import curl from '..';
import pkg from '../package.json';
import { createServer } from './helpers/server';

let s;

test.before('setup', async () => {
  s = await createServer();

  s.on('/', (req, res) => {
    req.resume();
    res.end(JSON.stringify(req.headers));
  });

  await s.listen(s.port);
});

test('user-agent', async (t) => {
  const headers = (await curl(s.url, { json: true })).body;
  t.is(headers['user-agent'], `${pkg.name}/${pkg.version}`);
});

test('accept-encoding', async (t) => {
  const headers = (await curl(s.url, { json: true })).body;
  t.is(headers['accept-encoding'], 'gzip,deflate');
});

test('accept header with json option', async (t) => {
  let headers = (await curl(s.url, { json: true })).body;
  t.is(headers.accept, 'application/json');

  headers = (await curl(s.url, {
    headers: {
      accept: '',
    },
    json: true,
  })).body;
  t.is(headers.accept, '');
});

test('host', async (t) => {
  const headers = (await curl(s.url, { json: true })).body;
  t.is(headers.host, `localhost:${s.port}`);
});

test('transform names to lowercase', async (t) => {
  const headers = (await curl(s.url, {
    headers: {
      'USER-AGENT': 'test',
    },
    json: true,
  })).body;
  t.is(headers['user-agent'], 'test');
});

test('zero content-length', async (t) => {
  const data = (await curl(s.url, {
    headers: {
      'content-length': 0,
    },
    body: 'sup',
  })).body;
  const headers = JSON.parse(data);
  t.is(headers['content-length'], '0');
});

test.after('cleanup', async () => {
  await s.close();
});
