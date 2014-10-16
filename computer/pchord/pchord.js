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
    if ( n < 2 ) {
      var src = context.createBufferSource();

      src.buffer = buffer;
      src.connect(context.destination);
      src.start(0, 30+n*2+0.05, 0.9);
    } else {
      var src1 = context.createBufferSource(),
          src2 = context.createBufferSource();

      src1.buffer = buffer;
      src1.connect(context.destination);
      src2.buffer = buffer;
      src2.connect(context.destination);
      src1.start(0, 30+0.05, 0.9);
      src2.start(0, 30+2.05, 0.9);
    }
  }
});
