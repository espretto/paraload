paraload
========

asset loader ( ~1.6 kb minified and gzipped ) for parallel loading yet ordered execution of `<script>`s ( and `<link>`s ) with respect to their dependencies.

usage
-----
loads all listed resources in parallel yet executes them in the order given by your dependency tree. the `<xml>`, one root tag within ( no root siblings ) and the `<script>` below that are required. tag names within `<xml>` can be random. separate url by line terminators. in this typical example jquery and underscore will be loaded as soon as they arrive. backbone will start loading right away just like the others but will only be executed after the parent level resources have been executed.

```html
...
<head>
  ...
  <xml style="display:none"><r>
    //ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
    //cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js
    <r>
      //cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min.js
    </r>
  </r></root>
  </xml>
  <script src="path/to/dist/paraload.min.js"></script>
  ...
</head>
...
```

paraload makes use of a Promise A+ v1.1 comliant implementation, thus exposes two globals `Promise` and `paraload` ( which you may both rename via `.noConflict()` hook ).

how it works
------------
### load without execution
a resource is loaded via an `<img>` tag with its `url` attribute set. when loaded, its `error` event fires which resolve a promise, thereby creating another for execution, which in turn will execute the next lower level's scripts when resolved and loaded respectively. when the time has come for a script to execute a `<script>` tag is created and inserted into the DOM which will fetch the already loaded script from the browser's cache and execute it immediately.

Firefox however, uses a separate cache for `<img>`s, which leads to the script being loaded twice. other implementations like [ControlJS][1] or [headjs][2] wait until the `<body>` tag is rendered and then insert `<object>` tags using their `data` attribute to set the url. paraload however, uses `document.implementation.createDocument` to create an internal, non-active document to `adoptNode` once inserted `<script>` tags which will then not be executed when loaded but fire their error event just like the `<img>` tag did.

### why `<xml>`?
IE < 10 still parses [xml data islands][3] which is an abandoned feature once used to simply serve xml data within html pages e.g. for reuse within country select fields. those browsers will thus parse the xml and not render it onto the screen while it's still accessible to javascript. the names given to the tags can thus be given at random and chosen as short as possible. if the `<xml>` tag was different IE would render its `textContent` but ignore the tags completely.

all other browsers render unknown tags as default inlined DOM elements. that's why we have to add the inline `style="display:none"` ( or `class="hide"` from your already loaded css in case you don't mind the [FOUC][4], though you should ). their parsed html is of course equally traversable like IE's xml.

[1]: http://stevesouders.com/controljs/
[2]: http://headjs.com/
[3]: http://msdn.microsoft.com/library/ms766512.aspx
[4]: http://www.paulirish.com/2009/avoiding-the-fouc-v3/

tests & docs
------------
### setup
```sh
$ git clone <this-repo> <target-folder>
$ cd path/to/<target-folder>
$ npm install
```

### build
- generates the annotated source to the `./docs` folder
- uglifys source to `./dist/paraload.min.js` for production environments ( ~3.4 kb )
```sh
$ grunt build
```
for convenience there is a ready-made gzip command to further compress the minified version to `./dist/promise.min.js.gz` ( ~1.6 kb ( requires gzip ))
```sh
$ npm run-script gzip
```
### run tests in your browser
( requires `grunt build` )

```sh
$ python -m SimpleHTTPServer
```
then fire up your favorite browser and point it to [localhost:8000/tests](http://localhost:8000/test) to run the tests or [localhost:8000/docs](localhost:8000/docs/src/promise.js.html) to read Paraload's story - the annotated source.