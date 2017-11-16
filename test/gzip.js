import zlib from 'zlib';
import test from 'ava';
import pify from 'pify';
import curl from '..';
import { createServer } from './helpers/server';

const testContent = 'Compressible response content.\n';
const testContentUncompressed = 'Uncompressed response content.\n';

let s;
let gzipData;
let deflateData;

test.before('setup', async () => {
  s = await createServer();
  gzipData = await pify(zlib.gzip)(testContent);
  deflateData = await pify(zlib.deflate)(testContent);

  s.on('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Encoding', 'gzip');

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    res.end(gzipData);
  });

  s.on('/deflate', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Encoding', 'deflate');

    res.end(deflateData);
  });

  s.on('/corrupted', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Encoding', 'gzip');
    res.end('Not gzipped content');
  });

  s.on('/missing-data', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Encoding', 'gzip');
    res.end(gzipData.slice(0, -1));
  });

  s.on('/uncompressed', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(testContentUncompressed);
  });

  await s.listen(s.port);
});

test('decompress content', async (t) => {
  t.is((await curl(s.url)).body, testContent);
  t.is((await curl(`${s.url}/deflate`)).body, testContent);
});

test('handles gzip error', async (t) => {
  const err = await t.throws(curl(`${s.url}/corrupted`));
  t.is(err.message, 'incorrect header check');
});

test('preserve headers property', async (t) => {
  t.truthy((await curl(s.url)).headers);
});

test('do not break HEAD responses', async (t) => {
  t.is((await curl.head(s.url)).body, '');
});

test('ignore missing data', async (t) => {
  const err = await t.throws(curl(`${s.url}/missing-data`));
  t.is(err.message, 'unexpected end of file');
});

test.after('cleanup', async () => {
  await s.close();
});
