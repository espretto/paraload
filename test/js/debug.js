
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

if (typeof DEBUG === 'undefined') (function(window){

  var DEBUG = window.DEBUG = {},
      LOGID = 'log',
      arrayJoin = [].join,
      perf = window.performance,
      doc = window.document,
      elem,
      time,
      cache = [];

  DEBUG.now = (
    perf && perf.now.bind(perf) ||
    Date.now ||
    function(){ return new Date().getTime(); }
  );

  time = DEBUG.now();

  (function poll(entry) {
    elem = doc.getElementById(LOGID);
    if (elem) while(cache.length) log(cache.shift());
    else setTimeout(poll, 15);
  }());

  DEBUG.log = function(entry) {
    if(elem) log(entry);
    else cache.push({
      text: arrayJoin.call(arguments, ' '),
      time: (DEBUG.now() - time).toFixed(3)
    });
  };

  function log(entry){
    var li = document.createElement('LI'),
        span = document.createElement('SPAN');

    span.appendChild(document.createTextNode(entry.time));
    li.appendChild(span);
    li.appendChild(document.createTextNode(entry.text));
    elem.appendChild(li);
  }

  DEBUG.log('debug-log', 'ready');

}(this));