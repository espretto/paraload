
// html log
// ========
// minimalistic logging via unordered html list.
// 
// create log entry
// ```
// DEBUG && DEBUG.log( seperated, by, space )
// ```
// timestamps preceded.
// 
// meant to be used in conjunction with uglify's ability
// to declare global variables, namely `DEBUG`.
// 
// required html:
// ```
// <ul id="log"></ul>
// ```

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
    }, true ),

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