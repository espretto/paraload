/*!
 * paraload javascript library released under MIT licence
 * http://mariusrunge.com/mit-licence.html
 */

/* global whif, __VERSION__ */

(function (window, whif) {

  // private
  // =======
  // one to var them all

  var document = window.document,
  head = document.head || getFirstElementByTagName('HEAD'),
  paraload = { VERSION: '0.2.3' },

  // eventing
  // --------
  // properly added event listeners fire earlier. don't bother to fall
  // back on IE's attach-/detachEvent though. you cannot .call() them :(
  
  readyStates = {
    'loaded': true,
    'complete': true,
    'undefined': true
  },

  events = ['load', 'error', 'readystatechange'],
  eCount = events.length,

  addEventListener = document.addEventListener || function (event, handler) {
    this['on'+event] = handler;
  },

  removeEventListener = document.removeEventListener || function (event) {
    this['on'+event] = null;
  },

  // string manipulation
  // -------------------
  reTrim = /^\s\s*|\s*\s$/g,
  reLines = /\r?\n|\u2028|\u2029/g,
  reFileExtension = /\.([^\.\/][^\.\/\?#]*)([?#]|$)/,

  stringTrim = ''.trim || function () {
    return this.replace(reTrim, '');
  },
  
  // Firefox specific
  // ----------------
  implementation = document.implementation,
  isFirefox = !readyStates[typeof window.InstallTrigger], // bytes for ugliness

  orphanage = (
    isFirefox &&
    document.adoptNode &&
    implementation &&
    implementation.createDocument('', '', null)
  ),

  // HTML or XML?
  // ------------
  treeRoot = document.getElementById('paraload') || getFirstElementByTagName('XML'),

  __tmp; // bytes for ugliness
  if (treeRoot && (__tmp = treeRoot.XMLDocument)) {
    treeRoot = __tmp.documentElement;
  }

  // helpers DOM
  // -----------
  function insertInto (parent, node) {
    parent.insertBefore(node, parent.lastChild);
  }

  function getFirstElementByTagName (tagName) {
    return document.getElementsByTagName(tagName)[0];
  }

  function createElement (tagName, attributes) {
    var elem = document.createElement(tagName), key;
    for (key in attributes){
      if (attributes.hasOwnProperty(key)){
        elem.setAttribute(key, attributes[key]);
      }
    }
    return elem;
  }

  // event handling
  // --------------
  function on (elem, fn, param) {

    // choose var declaration for proper referencing by removeEventListener
    var handler = function () {
      if (elem.nodeName === 'IMG' || readyStates[elem.readyState]) {
        for (var i = eCount; i--;) {
          removeEventListener.call(elem, events[i], handler, false);
        }
        fn(param);
        elem = null; // avoid memory leak
      }
    };

    for (var i = eCount; i--;) {
      addEventListener.call(elem, events[i], handler, false);
    }
  }

  // public
  // ======
  paraload.load = function (url) {
    return whif(function (resolve) {
      var elem, orphan;

      if (orphanage) {
        elem = createElement('SCRIPT', {
          type: 'text/javascript',
          async: true
        });
      } else {
        elem = createElement('IMG');
      }

      on(elem, function () {
        orphan && document.adoptNode(orphan); // re-adopt
        elem = orphan = null; // avoid memory leaks
        resolve(url);
      });

      elem.src = url;

      if (orphanage) {
        insertInto(head, elem);
        elem = head.removeChild(elem);
        orphan = orphanage.adoptNode(elem);
      }
    });
  };

  paraload.exec = function (url) {
    return whif(function (resolve) {
      var elem,
          match = url.match(reFileExtension),
          extension = match && match[1];

      if (extension === 'css') {
        elem = createElement('LINK', {
          rel: 'stylesheet',
          type: 'text/css',
          href: url
        });
      } else if (extension === 'js' || true) { // fall through
        elem = createElement('SCRIPT', {
          type: 'text/javascript',
          src: url
        });
      }

      on(elem, resolve, url);
      insertInto(head, elem);
    });
  };

  // dependency tree traversal
  // =========================

  (function traverse (node, dependency) {

    var nodeReset = node,
        promises = [],
        firstChild,
        lines,
        url,
        execURL = function (values){
          return paraload.exec(values[0]);
        };

    // text nodes
    // ----------
    for (; node; node = node.nextSibling) {
      if (node.nodeType === 3) {
        for (lines = node.nodeValue.split(reLines); lines.length;) {
          if (url = stringTrim.call(lines.shift())) {
            promises.push(
              whif.join([paraload.load(url), dependency])
                  .sync()
                  .then(execURL)
            );
          }
        }
      }
    }

    if (promises.length) dependency = whif.join(promises);

    // element nodes
    // -------------
    for (node = nodeReset; node; node = node.nextSibling) {
      firstChild = node.firstChild;
      if (node.nodeType === 1 && firstChild) {
        traverse(firstChild, dependency);
      }
    }

  }(treeRoot, whif.resolve()));

  // export
  // ======

  var previousParaload = window.paraload;

  paraload.noConflict = function () {
    window.paraload = previousParaload;
    return paraload;
  };

  window.paraload = paraload;

}(this, whif));
