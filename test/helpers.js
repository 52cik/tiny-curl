import test from 'ava';
import curl from '..';
import { createServer } from './helpers/server';

let s;

test.before('setup', async () => {
  s = await createServer();

  s.on('/', (req, res) => {
    res.end('ok');
  });

  s.on('/404', (req, res) => {
    res.statusCode = 404;
    res.end('not found');
  });

  await s.listen(s.port);
});

test('promise mode', async (t) => {
  t.is((await curl.get(s.url)).body, 'ok');

  const { statusCode, body } = await curl.get(`${s.url}/404`);
  t.is(statusCode, 404);
  t.is(body, 'not found');
});

test.after('cleanup', async () => {
  await s.close();
});
