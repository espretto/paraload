// Debug Helpers
// =============

if ( typeof DEBUG === 'undefined' ) {

  DEBUG = {};

  DEBUG.now = function() {
    return (
      window.performance && performance.now() ||
      Date.now && Date.now() || +new Date()
    );
  };

  DEBUG.log = ( function( root, whif ) {

    var document = root.document,

      LOGID = 'log',

      log = whif( function( resolve, reject ) {
        var log_elem;
        ( function poll() {
          log_elem = document.getElementById( LOGID );
          if ( !log_elem ) {
            setTimeout( poll, 15 );
          } else {
            resolve( log_elem )
          }
        }() )
      } ),

      now = DEBUG.now();

    return function() {
      var message = [].join.call( arguments, ' ' );
      log.then( function( log_elem ) {
        var li_node = document.createElement( 'LI' );
        var span_node = document.createElement( 'SPAN' );
        var time = ( DEBUG.now() - now );
        var time_node = document.createTextNode( time );
        var text_node = document.createTextNode( message );
        span_node.appendChild( time_node );
        li_node.appendChild( span_node );
        li_node.appendChild( text_node );
        log_elem.appendChild( li_node );
      } )
    };

  }( this, whif ) )
}

// Deferred Javascript
// ===================

( function( window, whif ) {

  // baseline setup
  // ==============

  var // one to var them all

  version = '0.2.0',

  // regular expressions
  // -------------------

  re_trim = /^\s\s*|\s*\s$/g,
  re_ext = /\.([^\.\/][^\.\/\?]*)([?#]|$)/,
  re_lines = /\n/g,
  re_readystate = /complete|loaded/,

  // quick access to natives
  // -----------------------

  string_trim = version.trim || function() {
    return this.replace( re_trim, '' );
  },

  // DOM reflection
  // --------------
  
  document = window.document,
  implementation = document.implementation,
  head = document.head || getElementByTagName( 'HEAD' ),

  tree_root = (
    document.getElementById( 'paraload' ) ||
    getElementByTagName( 'XML' )
  ),

  isFirefox = typeof window.InstallTrigger !== 'undefined',

  // Firefox specific
  // ----------------

  orphanage = (
    isFirefox &&
    document.adoptNode &&
    implementation &&
    implementation.createDocument('','')
  ),

  // public namespace
  // ----------------
  
  paraload = {};

  // HTML or XML?
  // ------------

  if ( tree_root.XMLDocument ) {
    tree_root = tree_root.XMLDocument.documentElement;
  }

  DEBUG && DEBUG.log( 'tree root: ', tree_root.nodeName );

  // helpers
  // -------

  function extend( target, source ) {
    for ( var key in source ) {
      // ignore don't enum bug
      if ( source.hasOwnProperty( key ) ) {
        target[ key ] = source[ key ];
      }
    }
    return target;
  }

  function ext( url ) {
    // re-/abuse `url` as match assignee
    return ( url = re_ext.exec( url ) ) && url[ 1 ];
  }

  // helpers DOM
  // -----------

  function getElementByTagName( tag_name ) {
    return document.getElementsByTagName( tag_name )[ 0 ];
  }

  function createElement( tag_name, attributes ) {
    return extend( document.createElement( tag_name ), attributes );
  }

  function insertInto( parent, node ) {
    parent.insertBefore( node, parent.lastChild );
  }

  // event handling
  // --------------

  function on( elem, callback ) {

    elem.onload = elem.onerror = elem.onreadystatechange = function() {

      if ( DEBUG ) {
        var e = arguments[ 0 ] || window.event;
        DEBUG.log( elem.nodeName, e.type, elem.readyState, elem.src || elem.href );
      }

      // images not inserted into the DOM will always be `'uninitialized'`
      var readyState = elem.readyState;
      if (
        elem.nodeName === 'IMG' || !readyState ||
        re_readystate.test( readyState )
      ) {
        callback();
      }
    }
  }

  function off( elem ) {
    elem.onload = elem.onerror = elem.onreadystatechange = null;
  }

  // paraload
  // ========

  paraload.load = function( url ) {

    DEBUG && DEBUG.log( 'loading', url )

    return whif( function( resolve ) {

      var elem, orphan;

      if ( orphanage ) {
        elem = createElement( 'SCRIPT', {
          type: 'text/javascript',
          async: true
        } );
      } else {
        elem = createElement( 'IMG' );
      }

      on( elem, function() {
        off( elem );
        if( orphan ){
          off( orphan );
          orphan = document.adoptNode( orphan );
        }

        elem = orphan = null;

        DEBUG && DEBUG.log( 'loaded', url );

        resolve( url );
      } );

      elem.src = url;

      if ( orphanage ) {
        insertInto( head, elem );
        elem = head.removeChild( elem );
        orphan = orphanage.adoptNode( elem );
      }
    } );
  };

  paraload.exec = function( url ) {

    DEBUG && DEBUG.log( 'executing', url )

    return whif( function( resolve ) {
      
      var extension = ext( url ), elem;

      if ( extension === 'css' ) {
        elem = createElement( 'LINK', {
          rel: 'stylesheet',
          type: 'text/css',
          href: url
        } );
      } else if ( extension === 'js' || true ) { // fall through
        elem = createElement( 'SCRIPT', {
          type: 'text/javascript',
          src: url
        } );
      }

      on( elem, function() {
        off( elem );
        elem = null;
        DEBUG && DEBUG.log( 'executed', url );
        resolve( url );
      } );

      insertInto( head, elem );
    } );
  }

  // dependency tree traversal
  // =========================

  DEBUG && DEBUG.log( '------------------------------------------' );

  ( function traverse( node, promise ) {

    var node_reset = node;
    var promises = [];

    // text nodes
    // ----------
    // for each node on this level - verbose functional:
    // ```
    // node
    //  .nodeValue
    //  .split( re_lines )
    //  .map( String.trim )
    //  .filter( function( str ){ return !!str })
    //  .forEach( function( url ){
    //    var loaded = paraload.load( url );
    //    var group = whif.group( loaded, promise );
    //    group.then( function( values ){
    //      var loaded_url = values[ 0 ];
    //      var executed = paraload.exec( loaded_url );
    //      return executed;
    //    } )
    //  } )
    // ```
    for ( ; node; node = node.nextSibling ) {

      if ( node.nodeType === 3 ) {

        var lines = node.nodeValue.split( re_lines ),
          len = lines.length,
          i = 0;

        for ( ; i < len; i++ ) {

          var url = lines[ i ];
          url = string_trim.call( url );

          if ( url ) {

            DEBUG && DEBUG.log( 'found', url );

            promises
              .push( whif
                .group( paraload.load( url ), promise )
                .then( function( values ) {
                  return paraload.exec( values[ 0 ] );
            }));
          }
        }
      }
    }

    // element nodes
    // -------------

    node = node_reset;
    var group = promises.length ? whif.group.apply( 0, promises ) : promise;

    for ( ; node; node = node.nextSibling ) {
      if ( node.nodeType === 1 && node.firstChild ) {
        traverse( node.firstChild, group );
      }
    }

  } )( tree_root, whif()._resolve() );

  // export
  // ======

  var previous_paraload = window.paraload;

  paraload.noConflict = function() {
    window.paraload = previous_paraload;
    return paraload;
  }

  window.paraload = paraload;

}( this, whif ) )