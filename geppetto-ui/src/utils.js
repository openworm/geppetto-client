function diffArrays (first, second) {
  return first.filter(function (item) {
    return second.indexOf(item) == -1;
  });
}

module.exports = { diffArrays }