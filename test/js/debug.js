
// html log
// ========
// minimalistic logging via unordered html list. meant to be use
// in conjunction with uglify's ability to declare global variables,
// namely `DEBUG`.
// 
// usage
// -----
// add `<ul id="log"></ul>` to your html-document and
// log via `DEBUG && DEBUG.log(seperated, by, space)`.
// 

/* global whif */

if (typeof DEBUG === 'undefined') (function(window){

  var DEBUG = window.DEBUG = {},
      LOGID = 'log',
      arrayJoin = [].join,
      perf = window.performance,
      doc = window.document,
      log,
      time;

  log = whif(function(resolve, reject) {
    (function poll(elem) {
      elem = doc.getElementById(LOGID);
      if (!elem) setTimeout(poll, 15);
      else resolve(elem);
    }());
  });

  DEBUG.now = perf && perf.now.bind(perf) || Date.now || function(){
    return new Date().getTime();
  };

  time = DEBUG.now();

  DEBUG.log = function() {
    var text = [].join.call(arguments, ' ');

    log.then(function(elem) {
      var li = document.createElement('LI'),
          span = document.createElement('SPAN'),
          diffTime = (DEBUG.now() - time).toFixed(3);

      span.appendChild(document.createTextNode(diffTime));
      li.appendChild(span);
      li.appendChild(document.createTextNode(text));
      elem.appendChild(li);
    });
  };

  DEBUG.log('debug-log', 'ready');

}(this));