export const defaultConfig = () => ({ 
  scrollZoom: false, 
  displaylogo: false, 
  modeBarButtonsToRemove: [
    'resetScale2d', 
    'hoverClosestCartesian', 
    'hoverCompareCartesian', 
    'toggleSpikelines'] 
})
  
  
export const defaultLine = () => ({
  dash: 'solid',
  width: '2',
  color: 'rgb(0, 0, 0)',
})
  
export const defaultTrace = () => ({
  mode: "lines",
  line: defaultLine(),
  hoverinfo: 'all',
  type: 'scatter'
})
  
const defaultFont = () => 'Helvetica Neue, Helevtica, sans-serif';
  
const defaultAxisLayout = () => ({
  autorange: false,
  showgrid: false,
  showline: true,
  zeroline: false,
  mirror: true,
  ticklen: 1,
  tickcolor: 'white',
  linecolor: 'white',
  tickfont: { family: defaultFont(), size: 11, color: 'white!important' },
  titlefont: { family: defaultFont(), size: 12, color: 'white!important' },
  ticks: 'outside'
});
  
export const defaultLayout = () => ({
  autosize: true,
  showgrid: false,
  showlegend: true,
  xaxis: defaultAxisLayout(),
  yaxis: defaultAxisLayout(),
  margin: { l: 50, r: 10, b: 40, t: 10 },
  legend : {
    xanchor : "auto",
    yanchor : "auto",
    font: {
      family: defaultFont(),
      size: 12,
      color : '#fff'
    },
    x : 1,
  },
  transition: { duration: 0 },
  frame: {
    duration: 0,
    redraw: false
  },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  playAll : false,
  hovermode : 'none',
  datarevision: 0
});  