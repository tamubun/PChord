'use strict'

$(function() {
  var Names = 'C,Cs,D,Ds,E,F,Fs,G,Gs,A,As,B'.split(',');

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
