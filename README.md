# tiny-curl

> A tiny CURL wrapper for node


## Install

```sh
$ npm install tiny-curl
```


## Usage

```js
const curl = require('tiny-curl');
const url = 'https://api.github.com/users/52cik';

curl(url, { json: true }).then(({ body }) => {
  console.log(body.name); // 楼教主
});

// async/await
(async () => {
  const { body } = await curl(url, { json: true });
  console.log(body.name); // 楼教主
})();

```


## API

#### curl(url, [options])

##### url

Type: `string`

##### options

Type: `Object`

Any of the `http.request` options.

###### body

Type: `string` `Object`

###### encoding

Type: `string` `null`  
Default: `'utf8'`

###### json

Type: `boolean`  
Default: `false`


###### query

Type: `string` `Object`


#### curl.get(url, [options])

#### curl.post(url, [options])

#### curl.put(url, [options])

#### curl.patch(url, [options])

#### curl.head(url, [options])

#### curl.delete(url, [options])

Sets `options.method` to the method name and makes a request.