export function extend (destObj, sourceObj) {

  for (let v in sourceObj) {
    if (destObj[v] !== undefined) {
      console.warn('extending', destObj, 'with', sourceObj, 'is overriding field ' + v);
    }
    destObj[v] = sourceObj[v];
  }
}
