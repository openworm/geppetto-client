# Plot Viewer

A plot viewer component that can plot any time series. The viewer can render basic line plots, as well as scatter plots. This component wraps [plotly.js](https://www.npmjs.com/package/plotly.js) and augments it with some functionality. 

Notable features:
* Plot zooming
* Legend toggle on/off
* Save plot as image (png, svg, jpeg)
* Download plot data in original source format
* Configurable plot analysis (e.g. average of various time series plotted) 
* Navigation history support (revert to previous plots and navigate history)

```element
plot/PlotComponent
```

## Examples

### Plot Component Example

Plotting a simple sinusoid function.

```
plot/showcase/examples/PlotShowcase
```

## Libraries

[plotly.js](https://www.npmjs.com/package/plotly.js)

[mathjs](https://www.npmjs.com/package/mathjs)

[jszip](https://www.npmjs.com/package/jszip)

[file-saver](https://www.npmjs.com/package/file-saver)

[@Material-ui/core](https://www.npmjs.com/package/@material-ui/core)
