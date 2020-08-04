/* eslint-disable no-param-reassign */
export function getSimulationData(simulation) {
  const { outputMapping, results } = simulation;
  const simulationMap = {};
  let columns = [];
  const outputMappingLines = outputMapping.split('\n');
  for (let i = 0; i < outputMappingLines.length - 1; ) {
    const colsLine = outputMappingLines[i + 1];
    const colsValues = colsLine.split(' ');
    if (i !== 0) {
      colsValues.shift();
    }
    columns = columns.concat(colsValues);
    i += 2;
  }
  const lines = [];
  const resultLines = [];
  for (const result of results) {
    resultLines.push(result.split('\n'));
  }
  const linesLength = resultLines[0].length;
  for (let line = 0; line < linesLength - 1; line++) {
    let lineContent = [];
    for (let j = 0; j < resultLines.length; j++) {
      const rline = resultLines[j][line].split('	');
      rline.pop();
      if (j !== 0) {
        rline.shift();
      }
      lineContent = lineContent.concat(rline);
    }
    lines.push(lineContent);
  }
  for (const line of lines) {
    const time = line[0];
    simulationMap[time] = {};
    for (let j = 1; j < columns.length; j++) {
      const col = columns[j];
      const val = line[j];
      simulationMap[time][col] = val;
    }
  }
  return simulationMap;
}

export function getVoltageColor(x) {
  x = (x + 0.07) / 0.1; // normalization
  if (x < 0) {
    x = 0;
  }
  if (x > 1) {
    x = 1;
  }
  if (x < 0.25) {
    return [0, x * 4, 1];
  }
  if (x < 0.5) {
    return [0, 1, 1 - (x - 0.25) * 4];
  }
  if (x < 0.75) {
    return [(x - 0.5) * 4, 1, 0];
  }
  return [1, 1 - (x - 0.75) * 4, 0];
}
