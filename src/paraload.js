/*!
 * paraload javascript library released under MIT licence
 * http://mariusrunge.com/mit-licence.html
 */

/* global whif */

(function (window, whif) {

  // baseline setup
  // ==============

  var // one to var them all

  // regular expressions
  // -------------------

  reTrim = /^\s\s*|\s*\s$/g,
  reExt = /\.([^\.\/][^\.\/\?#]*)([?#]|$)/,
  reLines = /\r?\n|\u2028|\u2029/g,

  // quick access to natives
  // -----------------------

  stringTrim = ''.trim || function() {
    return this.replace(reTrim, '');
  },

  // DOM reflection
  // --------------

  document = window.document,
  implementation = document.implementation,
  head = document.head || getElementByTagName('HEAD'),
  treeRoot = document.getElementById('paraload') || getElementByTagName('XML'),
  isFirefox = typeof window.InstallTrigger !== 'undefined',

  // Firefox specific
  // ----------------

  orphanage = (
    isFirefox &&
    document.adoptNode &&
    implementation &&
    implementation.createDocument('', '', null)
  ),

  // public namespace
  // ----------------

  paraload = {
    version: '0.2.2'
  };

  // HTML or XML?
  // ------------

  if (treeRoot && treeRoot.XMLDocument) {
    treeRoot = treeRoot.XMLDocument.documentElement;
  }

  // helpers
  // -------

  function ext(url) {
    // re-/abuse `url` as match assignee
    return (url = reExt.exec(url)) && url[1];
  }

  // helpers DOM
  // -----------

  function getElementByTagName(tagName) {
    return document.getElementsByTagName(tagName)[0];
  }

  function createElement(tagName, attributes) {
    var elem = document.createElement(tagName);
    for(var key in attributes){
      if(attributes.hasOwnProperty(key)){
        elem.setAttribute(key, attributes[key]);
      }
    }
    return elem;
  }

  function insertInto(parent, node) {
    parent.insertBefore(node, parent.lastChild);
  }

  // event handling
  // --------------

  // images not inserted into the DOM will always be `'uninitialized'`
  function on(elem, callback) {
    elem.onload = elem.onerror = elem.onreadystatechange = function() {
      var readyState = elem.readyState;
      if (
        elem.nodeName === 'IMG' ||
        !readyState ||
        readyState === 'complete' ||
        readyState === 'loaded'
      ) {
        callback();
      }
    };
  }

  function off(elem) {
    elem.onload = elem.onerror = elem.onreadystatechange = null;
  }

  // paraload
  // ========

  paraload.load = function(url) {
    return new whif(function(resolve) {
      var elem, orphan;

      if (orphanage) {
        elem = createElement('SCRIPT', {
          type: 'text/javascript',
          async: true
        });
      } else {
        elem = createElement('IMG');
      }

      on(elem, function() {
        off(elem);
        if (orphan) {
          off(orphan);
          orphan = document.adoptNode(orphan);
        }
        elem = orphan = null;
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

  paraload.exec = function(url) {
    return new whif(function(resolve) {
      var extension = ext(url), elem;

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

      on(elem, function() {
        off(elem);
        elem = null;
        resolve(url);
      });

      insertInto(head, elem);
    });
  };

  // dependency tree traversal
  // =========================

  (function traverse(node, dependency) {

    var nodeReset = node,
      promises = [],
      firstChild,
      lines,
      url,
      execUrl = function(values){
        return paraload.exec(values[0]);
      };

    for (; node; node = node.nextSibling) {
      if (node.nodeType === 3) {
        for (lines = node.nodeValue.split(reLines); lines.length;) {
          if (url = stringTrim.call(lines.shift())) {
            promises.push(
              whif.join([paraload.load(url), dependency]).then(execUrl)
            );
          }
        }
      }
    }

    // element nodes
    // -------------

    node = nodeReset;
    dependency = promises.length ? whif.join(promises) : dependency;

    for (; node; node = node.nextSibling) {
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