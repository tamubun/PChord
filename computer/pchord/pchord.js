'use strict'

$(function() {
  var Names = 'C,Cs,D,Ds,E,F,Fs,G,Gs,A,As,B'.split(',');
  var Chords = {
    /*  和音名:[<密3の列>,<密4の列>]
        <密3/密4の列> --- [[<構成音>,...], ...] パターンがループするまで
        <構成音> --- 基音からの距離で表現

	<開の列> = <密の列>の上から二つ目の音をオクターブ下げる */
    ' ':     [[[0,4,7], [4,7,12], [7,12,16]],
              [[-5,0,4,7], [0,4,7,12], [4,7,12,16]]],
    'm':     [[[0,3,7], [3,7,12], [7,12,15]],
              [[-5,0,3,7], [0,3,7,12], [3,7,12,15]]],
    '7':     [[[0,4,10], [4,10,12], [10,12,16]],
              [[0,4,7,10], [4,7,10,12], [7,10,12,16], [10,12,16,19]]],
    'M7':    [[[-1,0,4], [0,4,11], [4,11,12]],
              [[-1,0,4,7],[0,4,7,11],[4,7,11,12],[7,11,12,16]]],
    'm7':    [[[0,3,10], [3,10,12], [10,12,15]],
              [[0,3,7,10], [3,7,10,12], [7,10,12,15], [10,12,15,19]]],
    'dim7':  [[[3,6,9], [6,9,15], [9,15,18]],
              [[0,3,6,9], [3,6,9,12], [6,9,12,15], [9,12,15,18]]],
    'm7b5':  [[[3,6,10], [6,10,15], [10,15,18]],
              [[0,3,6,10], [3,6,10,12], [6,10,12,15], [10,12,15,18]]],
    'aug':   [[[0,4,8], [4,8,12], [8,12,16]],
              [[-4,0,4,8], [0,4,8,12], [4,8,12,16]]],
    'sus4':  [[[0,5,7], [5,7,12], [7,12,17]],
              [[-5,0,5,7], [0,5,7,12], [5,7,12,17]]],
    '7sus4': [[[0,5,10], [5,10,12], [10,12,17]],
              [[0,5,7,10], [5,7,10,12], [7,10,12,17], [10,12,17,19]]],
    '6':     [[[4,7,9], [7,9,16], [9,16,19]],
              [[0,4,7,9], [4,7,9,12], [7,9,12,16], [9,12,16,19]]],
    'add9':  [[[2,4,7], [4,7,14], [7,14,16]],
              [[0,2,4,7], [2,4,7,12], [4,7,12,14], [7,12,14,16]]]
  };

  var context = new AudioContext(),
      req, buffer;

  req = new XMLHttpRequest();
  req.open('GET', 'scale.mp3', true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    context.decodeAudioData(req.response, function(b) {
      buffer = b;
      $('button').click(function() { play(nameToPos($(this).text()));})
      $('#chord-input').keydown(function(ev) {
        if ( ev.which === 13 )
          playChord($(this).val());
      });
    });
  };
  req.send();

  function play(pos) {
    var src = context.createBufferSource();

    src.buffer = buffer;
    src.connect(context.destination);
    src.start(0, pos+0.05, 0.95);
  }

  function playChord(input) {
    var v = input.split(',');

    if ( v.length < 1 || v.length > 4 )
      return;

    $(v).each(function(i, name) {
      var pos = nameToPos(name);
      if ( pos === null || pos < 0 )
        return;
      play(pos);
    });
  }

  function posToName(pos) {
    return Names[pos%12] + (1 + Math.floor(pos / 12));
  }

  function nameToPos(name) {
    var found = name.toUpperCase().match(/([A-H])([FS]?)([1-6])/),
        doremi, acc, oct;

    if ( found === null )
      return null;

    doremi = found[1];
    acc = found[2].toLowerCase();
    oct = +found[3];

    if ( doremi === 'H' )
      doremi = 'B';
    if ( acc === 's' && ( doremi === 'E' || doremi === 'B' ) ||
         acc === 'f' && ( doremi === 'F' || doremi === 'C' ) )
      return null;

    if ( acc === 'f' ) {
      doremi = String.fromCharCode(doremi.charCodeAt(0)-1);
      acc = 's';
    }

    return 12 * (+oct-1) + Names.indexOf(doremi+acc);
  }
});
