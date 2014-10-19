'use strict'

$(function() {
  var Names = 'C,Cs,D,Ds,E,F,Fs,G,Gs,A,As,B'.split(',');
  var Chords = {
    /*  和音名:[<密3の列>,<密4の列>]
        <密3/密4の列> --- [s, d0, d1, d2, ...]
          s --- 最初の音の基音からの距離
          d0, d1, d2, .... --- 最初の音からの距離。最後は12

        <開の列> = <密の列>の上から二つ目の音をオクターブ下げる */
    '':      [[0, 4, 7, 12], [0, 4, 7, 12]],
    'm':     [[0, 3, 7, 12], [0, 3, 7, 12]],
    '7':     [[0, 4, 10, 12], [0, 4, 7, 10, 12]],
    'M7':    [[0, 4, 11, 12], [0, 4, 7, 11, 12]],
    'm7':    [[0, 3, 10, 12], [0, 3, 7, 10, 12]],
    'dim7':  [[3, 3, 7, 12], [0, 3, 6, 9, 12]],
    'm7b5':  [[3, 3, 7, 12], [0, 3, 6, 10, 12]],
    'aug':   [[0, 4, 8, 12], [0, 4, 8, 12]],
    'sus4':  [[0, 5, 7, 12], [0, 5, 7, 12]],
    '7sus4': [[0, 5, 10, 12], [0, 5, 7, 10, 12]],
    '6':     [[4, 3, 5, 12], [0, 4, 7, 9, 12]],
    'add9':  [[2, 2, 5, 12], [0, 2, 4, 7, 12]]
  };

  var context = new AudioContext(),
      req, buffer;

  req = new XMLHttpRequest();
  req.open('GET', 'scale.mp3', true);
  req.responseType = 'arraybuffer';
  req.onload = function() {
    context.decodeAudioData(req.response, function(b) {
      buffer = b;
      $('.sound').click(function() { play(nameToPos($(this).text()));})
      $('.gen').click(generate)
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

  function generate() {
    var chord, base, pattern, shift, num, dense, i, txt;

    base = $('#base').val();
    pattern = $('#pattern').val();
    shift = +$('#shift').val();
    num = +$('#num').val();
    dense = $('#dense').val() === 'true';
    chord = generateChord(base, pattern, shift, num, dense);

    txt = []
    for ( i = 0; i < chord.length; ++i )
      txt.push(posToName(chord[i]));
    txt = txt.join(',');
    $('#chord-input').val(txt);
    playChord(txt);
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

  function getDist(seq, idx) {
    var dist = seq[0], len = seq.length - 1;

    dist += 12 * Math.floor(idx/len);
    if ( idx >= 0 ) {
      if ( idx % len > 0 )
        dist += seq[idx % len];
    } else {
      if ( idx % len <= -1 )
        dist  += seq[len + idx % len]
    }
    return dist;
  }

  function generateChord(base, pattern, shift, num, dense) {
    var seq = Chords[pattern], pos_b, ans = [], i, offset, p;

    if ( seq === undefined || shift < -6 || shift > 6 || num < 3 || num > 4 )
      return null;
    base = base+'4';
    pos_b = nameToPos(base);
    if ( pos_b === null )
      return null;

    seq = (num === 3) ? seq[0] : seq[1];
    offset = 0;
    while ( pos_b + getDist(seq, num + offset - 1) >= 47 ) {
      // 一番上の音がB4より高くならないようにずらす
      --offset;
    }

    for ( i = offset; i < num + offset; ++i ) {
      p = pos_b + getDist(seq, shift + i);
      if ( !dense && i == num + offset - 2 ) {
        ans.unshift(p-12);
      } else {
        ans.push(p);
      }
    }

    return ans;
  }
});
