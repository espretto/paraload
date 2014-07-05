/*!
 * paraload javascript library released under MIT licence
 * http://mariusrunge.com/mit-licence.html
 */

(function (window, whif) {

  // baseline setup
  // ==============

  var // one to var them all

  // regular expressions
  // -------------------

  re_trim = /^\s\s*|\s*\s$/g,
  re_ext = /\.([^\.\/][^\.\/\?#]*)([?#]|$)/,
  re_lines = /\r?\n|\u2028|\u2029/g,

  // quick access to natives
  // -----------------------

  string_trim = ''.trim || function() {
    return this.replace(re_trim, '');
  },

  // DOM reflection
  // --------------

  document = window.document,
  implementation = document.implementation,
  head = document.head || getElementByTagName('HEAD'),
  tree_root = document.getElementById('paraload') || getElementByTagName('XML'),
  isFirefox = typeof window.InstallTrigger !== 'undefined',

  // Firefox specific
  // ----------------

  orphanage = (
    isFirefox &&
    document.adoptNode &&
    implementation &&
    implementation.createDocument('', '')
  ),

  // public namespace
  // ----------------

  paraload = {
    version: '0.2.0'
  };

  // HTML or XML?
  // ------------

  if (tree_root && tree_root.XMLDocument) {
    tree_root = tree_root.XMLDocument.documentElement;
  }

  // helpers
  // -------

  function extend(target, source) {
    for (var key in source) {
      // ignore don't enum bug
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function ext(url) {
    // re-/abuse `url` as match assignee
    return (url = re_ext.exec(url)) && url[1];
  }

  // helpers DOM
  // -----------

  function getElementByTagName(tag_name) {
    return document.getElementsByTagName(tag_name)[0];
  }

  function createElement(tag_name, attributes) {
    return extend(document.createElement(tag_name), attributes);
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
    }
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
  }

  // dependency tree traversal
  // =========================

  (function traverse(node, promise) {

    var node_reset = node,
      promises = [],
      promise_group,
      firstChild,
      lines,
      url;

    for (; node; node = node.nextSibling) {
      if (node.nodeType === 3) {
        for (lines = node.nodeValue.split(re_lines); lines.length;) {
          url = string_trim.call(lines.shift());
          if (url) {
            promises.push(whif
              .group([paraload.load(url), promise])
              .then(function(values) {
                return paraload.exec(values[0]);
              })
            );
          }
        }
      }
    }

    // element nodes
    // -------------

    node = node_reset;
    promise_group = promises.length ? whif.group(promises) : promise;

    for (; node; node = node.nextSibling) {
      firstChild = node.firstChild;
      if (node.nodeType === 1 && firstChild) {
        traverse(firstChild, promise_group);
      }
    }

  })(tree_root, new whif()._resolve());

  // export
  // ======

  var previous_paraload = window.paraload;

  paraload.noConflict = function () {
    window.paraload = previous_paraload;
    return paraload;
  }

  window.paraload = paraload;

}(this, whif))