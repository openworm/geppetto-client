
export function mapToObject ( aMap ) {
  const obj = {};
  aMap.forEach ((v,k) => {
    obj[k] = v; 
  });
  return obj;
}
  
export function isString (obj) {
  return typeof obj === 'string' || obj instanceof String;
}
  
  
export function extractGriddleData (data, listViewerColumnsConfiguration) {
  return data.map(row => listViewerColumnsConfiguration.reduce(
    reduceEntityToGriddleRow(row), {}
  ));
}


export function reduceEntityToGriddleRow (row) {
  return (processedRow, { id, source }) => ({
    ...processedRow,
    [id]: mapSourceToRow(source, row)
  });
}
  
  
export function mapSourceToRow (source, row) {
  if (row.get){ // is a map coming from griddle. instanceof Map does not work here
    row = mapToObject(row);
  }
  return source === undefined ? row : source instanceof Function ? source(row) : row[source];
}