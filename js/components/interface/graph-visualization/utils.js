export function splitter (str, l){
  var strs = [];
  var cuts
  if (str.length <= l) {
    cuts = [l]
  } else if (str.length <= 2 * l) {
    cuts = [Math.floor(l * 0.9), Math.floor(l * 0.9)]
  } else {
    cuts = [Math.floor(l * 0.75), l, Math.floor(l * 0.75)]
  }

  var nextLength = cuts[0]
  while (str.length > nextLength){
    var pos = str.substring(0, nextLength).lastIndexOf(' ');
    pos = pos <= 0 ? nextLength : pos;
    strs.push(str.substring(0, pos));
    var i = str.indexOf(' ', pos) + 1;
    if (i < pos || i > pos + nextLength) {
      i = pos;
    }
    str = str.substring(i);
    nextLength = cuts[strs.length]
  }
  strs.push(str);
  return strs;
}

/**
 * Use to darken / lighten colors in rgba, rgb, or hex representation
 *
 * @param {String} col String representing a Color in format rgba, rgb or hex. Example 'rgba(11,22,33,0.5)' or '#123456'
 * @param {Int} atm Level of dark. Example -30 is darker than -10. Use positive number for lighter colors
 *
 * @returns {String} - rgba color darkened by arm value
 *
 */
export function getDarkerColor (col, amt = -30) {

  if (col.startsWith('#')) {
    let num = parseInt(col.slice(1),16);
    col = Array(4)
    col[0] = (num >> 16) + amt;
    col[1] = ((num >> 8) & 0x00FF) + amt;
    col[2] = (num & 0x0000FF) + amt;
    col[3] = 1
  
  } else if (col.startsWith('rgba')) {
    col = col.replace('rgba', '').replace('(', '').replace(')', '').split(',')
  } else if (col.startsWith('rgb')) {
    col = col.replace('rgb', '').replace('(', '').replace(')', '').split(',').push[1]
  } else {
    throw "Color format error. Accepted formats: #dddddd, rgba(ddd,ddd,ddd,f), rgb(ddd,ddd,ddd). Check parameters on GeppettoGraphVisualization";
  }

  for (let i = 0; i < 3; i++) {
    col[i] += amt
    if (col[i] > 255) {
      col[i] = 255
    } else if (col[i] < 0){
      col[i] = 0
    }
  }

  return `rgba(${col[0]},${col[1]},${col[2]},${col[3]})`

}