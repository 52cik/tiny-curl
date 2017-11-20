// Type definitions for tiny-curl 1.1.1 forked from @types/got
// Project: https://github.com/52cik/tiny-curl#readme
// TypeScript Version: 2.3

// /// <reference types="node"/>

import { Url } from 'url';
import * as http from 'http';
import * as nodeStream from 'stream';

export = curl;

declare const curl: curl.CurlFn &
  Record<'get' | 'post' | 'put' | 'patch' | 'head' | 'delete', curl.CurlFn>;

declare namespace curl {
  interface CurlFn {
    (url: CurlUrl): CurlPromise<string>;
    (url: CurlUrl, options: CurlFormOptions<string>): CurlPromise<string>;
    (url: CurlUrl, options: CurlFormOptions<null>): CurlPromise<Buffer>;
    (url: CurlUrl, options: CurlJSONOptions): CurlPromise<any>;
    (url: CurlUrl, options: CurlBodyOptions<string>): CurlPromise<string>;
    (url: CurlUrl, options: CurlBodyOptions<null>): CurlPromise<Buffer>;
  }

  type CurlUrl = string | http.RequestOptions | URL;

  interface CurlBodyOptions<E extends string | null> extends CurlOptions<E> {
    body?: string | Buffer;
  }

  interface CurlJSONOptions extends CurlOptions<string | null> {
    body?: object;
    json: true;
  }

  interface CurlFormOptions<E extends string | null> extends CurlOptions<E> {
    body?: { [key: string]: any };
    json?: boolean;
  }

  type CurlOptions<E extends string | null> = http.RequestOptions & {
    encoding?: E;
    query?: string | object;
    decompress?: boolean;
  };

  interface Response<B extends Buffer | string | object> extends http.IncomingMessage {
    body: B;
  }

  type CurlPromise<B extends Buffer | string | object> = Promise<Response<B>>;
}
