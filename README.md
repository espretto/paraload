paraload
========

asset loader ( ~1.8 kb minified and gzipped ) for parallel loading yet ordered execution of `<script>`s ( and `<link>`s ) with respect to their dependencies.

usage
-----
loads all listed resources in parallel yet executes them in the order given by your __dependency tree__. the `<xml>`, one root tag within ( no root siblings ), and the `<script>` below are required. tag names within `<xml>` can be random. separate urls by line terminators. in this typical example _jquery_ and _underscore_ will be executed as soon as they arrive. _backbone_ will start loading right away just like the others but will only be executed after the parent level resources have been executed.

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
  </r></xml>
  <script src="path/to/dist/paraload.min.js"></script>
  ...
</head>
...
```

paraload comes with [whif](https://github.com/espretto/whif) ( [Promisese A+ v1.1](http://promises-aplus.github.io/promises-spec/) compliant ), thus exposes two globals `whif` and `paraload` ( which you may both rename via `.noConflict()` hook ).

public api
----------
paraload exposes two static functions which both return promises.
```js
paraload
  // works for './styles.css', too
  .load( 'url/to/script.js' )
  .then( function( url ){
    paraload
      .exec( url )
      .then( function( url ){
        // dependent code
      });
  }, function( reason ){
    // todo: timeout
  });
});

var rename = paraload.noConflict();
```

how it works
------------
### load without execution
a script is loaded via an `<img>` tag with its `src` attribute set. when loaded, the element's `error` event fires, the script gets inserted into the DOM which will fetch the already loaded file from the browser's cache and execute it immediately. this process is wrapped in a promise which, when resolved, executes the next lower level's scripts as soon as these are loaded.

Firefox however, uses a separate cache for `<img>`s, which leads to the script being loaded twice. other implementations like [ControlJS][1] or [headjs][2] wait until the `<body>` tag is rendered and then insert `<object>` tags using their `data` attribute to set the url. paraload however, uses `document.implementation.createDocument` to create an internal, non-active document to `adoptNode` once inserted `<script>` tags which will then not be executed when loaded but fire their error event just like the `<img>` tag did.

### why `<xml>`?
IE < 10 still parses [XML data islands][3] which is an abandoned feature once used to simply serve xml data within HTML pages e.g. for reuse within country select fields. those browsers will thus parse the XML and not render it onto the screen while it's still accessible to javascript. the names given to the tags can thus be given at random and chosen as short as possible. if the `<xml>` tag was different IE would render its `textContent` but ignore the tags completely.

all other browsers render unknown tags as default DOM elements. that's why we have to add the inline `style="display:none"` ( or `class="hide"` from your already loaded css in case you don't mind the [FOUC][4], though you should ). their parsed HTML is of course equally traversable like IE's XML.

[1]: http://stevesouders.com/controljs/
[2]: http://headjs.com/
[3]: http://msdn.microsoft.com/library/ms766512.aspx
[4]: http://www.paulirish.com/2009/avoiding-the-fouc-v3/

tests & docs
------------

### prerequisites
- python pygments for generating the annotated source
- grunt-cli for use of grunt build commands
- gzip for further compression of minified version

### setup
```sh
$ git clone <this-repo> <target-folder>
$ cd path/to/<target-folder>
$ npm install
```

### build
- generates the annotated source to the `./docs` folder
- uglifys source to `./dist/paraload.min.js` for production environments ( ~3.8 kb )
```sh
$ grunt build
```
for convenience there is a ready-made gzip command to further compress the minified version to `./dist/promise.min.js.gz` ( ~1.8 kb ( requires gzip ))
```sh
$ npm run-script gzip
```
### run tests in your browser
( requires `grunt build` )

```sh
$ python -m SimpleHTTPServer
```
then fire up your favorite browser and point it to [localhost:8000/tests](http://localhost:8000/test) to run the tests or [localhost:8000/docs](http://localhost:8000/docs/src/promise.js.html) to read paraload's story - the annotated source.

licence
-------
[MIT](http://mariusrunge.com/mit-licence.html)