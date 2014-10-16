'use strict'

$(function() {
  var context = new AudioContext(),
      req, buffer;

  req = new XMLHttpRequest();
  req.open('GET', 'scale.mp3', true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    context.decodeAudioData(req.response, function(b) {
      buffer = b;
      $('button').click(function() { play(+$(this).attr('num'));})
    });
  };
  req.send();

  function play(n) {
    if ( n < 10 ) {
      var src = context.createBufferSource();

      src.buffer = buffer;
      src.connect(context.destination);
      src.start(0, 36+n+0.05, 0.95);
    } else {
      var src1 = context.createBufferSource(),
          src2 = context.createBufferSource(),
          src3 = context.createBufferSource();

      src1.buffer = buffer;
      src1.connect(context.destination);
      src2.buffer = buffer;
      src2.connect(context.destination);
      src3.buffer = buffer;
      src3.connect(context.destination);
      src1.start(0, 36+0.05, 0.95);
      src2.start(0, 36+4.05, 0.95);
      src3.start(0, 36+7.05, 0.95);
    }
  }
});
