import React from 'react';
import JSZip from "jszip";
import FileSaver from "file-saver";
import Plotly from 'plotly.js/lib/core';
import createPlotlyComponent from 'react-plotly.js/factory';

Plotly.register([require('plotly.js/lib/scatter')]);
const ScatterPlot = createPlotlyComponent(Plotly);

import { unit } from 'mathjs';
import PlotHeader from './PlotHeader';
import AbstractComponent from '../../AComponent';
import { defaultLayout, defaultTrace, defaultLine, defaultConfig, defaultAxisLayout } from './configuration/plotConfiguration';
import ExternalInstance from '../../../geppettoModel/model/ExternalInstance';
import { withStyles } from '@material-ui/core';

import AStateVariableCapability from '../../../geppettoModel/capabilities/AStateVariableCapability';

const style = { 
  container: {
    width: '100%',
    height: '100%'
  },
  headerIcons: { fontSize: '15px' },
  plot: {
    width: '100%',
    height: "calc(100% - 16px)"
  }
}

class PlotComponent extends AbstractComponent {

  state = {};
  reset = true;
  revision = 0;
  analysis = [];
  getLegendName = this.props.getLegendName ? this.props.getLegendName.bind(this) : this.getLegendName.bind(this);
  extractLegendName = this.props.extractLegendName ? this.props.extractLegendName.bind(this) : this.extractLegendName.bind(this);

  headerIconList = [
    { 
      icon: 'fa fa-home', 
      action: () => this.resetAxes(),
      tooltip: 'Reset plot zoom'
    },
    { 
      icon: 'fa fa-list', 
      action: () => this.toggleLegend(),
      tooltip: 'Toggle legend'
    },
    { 
      icon: 'fa fa-picture-o', 
      action: imageType => this.downloadImage(imageType),
      options: ['Save as PNG', 'Save as SVG', 'Save as JPEG'],
      tooltip: 'Save as image'
    },
    { 
      icon: 'fa fa-download', 
      action: () => this.downloadPlotData(),
      tooltip: 'Download plot data'
    },
    { 
      icon: 'fa gpt-analysis', 
      action: analysisOption => this.plotAverage(analysisOption),
      options: ['Plot average', 'Remove analysis'],
      tooltip: 'Analysis'
    },
    { 
      icon: 'fa fa-history', 
      action: () => {},
      tooltip: 'Show navigation history'
    }
  ]

  shouldComponentUpdate (nextProps, nextState) {
    const { plots } = this.props;

    if (nextProps.forceChange || plots.length != nextProps.plots.length) {
      return true
    }

    for (let i in plots) {
      
      if (nextProps.plots[i].x != this.props.plots[i].x){
        return true;
      }
      if (nextProps.plots[i].y != this.props.plots[i].y){
        return true;
      }
      for (let key in nextProps.plots[i].lineOptions) {
        if (nextProps.plots[i].lineOptions[key] != this.props.plots[i].lineOptions[key]){
          return true;
        }
        
      }
      
    }
    return false;
    
  }

  initPlot () {
    if (this.reset) {
      this.data = [];
      this.frames = [];
      this.instances = {};
    

      let labelX = undefined, labelY = undefined;
      for (let plotDefinition of this.props.plots) {
      
        if (plotDefinition) {
          const instanceY = Instances.getInstance(plotDefinition.y);
          const instanceX = Instances.getInstance(plotDefinition.x);
          const lineOptions = plotDefinition.lineOptions;
          if (!instanceY || !instanceX){
            console.error(`Instance`, plotDefinition, `does not seems to contain data or time instances.`);
            return;
          }
          const instanceData = this.getInstanceData(instanceY, instanceX, lineOptions);
          this.data.push(instanceData);

          const instanceLabelX = this.getUnitLabel(instanceX.getUnit());
          const instanceLabelY = this.getUnitLabel(instanceY.getUnit());
 
          labelY = !labelY || labelY != instanceLabelY ? instanceLabelY : "SI Units";
          labelX = !labelX || labelX != instanceLabelX ? instanceLabelX : "SI Units";


        } else {
          console.warn(`No instance path defined for Plot component.`);
        }
      }
      this.updateLayoutConf(labelX, labelY);
    }
    this.reset = true
  }

  
  getInstanceData (instanceY, instanceX, lineOptions) {
    let legendName = this.extractLegendName(instanceY);

    const trace = {
      ...this.getSinglePlotConfiguration(lineOptions),
      x: instanceX.getTimeSeries(),
      y: instanceY.getTimeSeries(),
      path: instanceY.getInstancePath(),
      name: legendName,
    };

    return trace;
  }


  getUnitLabel (unitSymbol) {
    if (unitSymbol != null || unitSymbol != undefined) {
      unitSymbol = unitSymbol.replace(/_per_/gi, " / ");
    } else {
      unitSymbol = "";
    }

    var unitLabel = unitSymbol;

    if (unitSymbol != undefined && unitSymbol != null && unitSymbol != "") {
      var formattedUnitName = "";
      if (GEPPETTO.UnitsController.hasUnit(unitSymbol)) {
        formattedUnitName = GEPPETTO.UnitsController.getUnitLabel(unitSymbol);
      } else {
        try {
          var mathUnit = unit(1, unitSymbol);
          formattedUnitName = (mathUnit.units.length > 0) ? mathUnit.units[0].unit.base.key : "";
          (mathUnit.units.length > 1) ? formattedUnitName += " OVER " + mathUnit.units[1].unit.base.key : "";
        } catch (error) {
          console.log(`Unit symlob <${unitSymbol}> does not represent a physical quantity`)
        }
      }

      if (formattedUnitName != "") {
        formattedUnitName = formattedUnitName.replace(/_/g, " ");
        formattedUnitName = formattedUnitName.charAt(0).toUpperCase() + formattedUnitName.slice(1).toLowerCase();
        unitLabel = formattedUnitName + " (" + unitSymbol.replace(/-?[0-9]/g, function (letter) {
          return letter.sup();
        }) + ")";
      }

      return unitLabel;
    }
  }

  resize () {
    this.refs.plotly.resizeHandler();
  }


  updateLayoutConf (labelX, labelY) {
    this.layout = { ...defaultLayout(), ...this.props.layout ? this.props.layout : {}, title: this.props.title };
    const layoutConf = this.getAxisLayoutConfiguration(labelX, labelY);
    this.layout.xaxis = { ...this.layout.xaxis, ...layoutConf.xaxis };
    this.layout.yaxis = { ...this.layout.yaxis, ...layoutConf.yaxis };
    this.layout.margin = { ...this.layout.margin, ...layoutConf.margin };
    this.layout.datarevision = this.revision + 1
    this.revision = this.revision + 1
  }

  getAxisLayoutConfiguration (labelX, labelY) {
    return {
      
      xaxis: { title: { text: labelX }, autorange: true },
      yaxis: { title: { text: labelY }, autorange: true },
      margin: { l: (labelY == null || labelY == "") ? 30 : 50 }
    }
  }

  getLegendName (projectId, experimentId, instance, sameProject) {
    const instancePath = instance.getInstancePath();

    if (sameProject) {
      window.Project.getExperiments().forEach(experiment => {
        if (experiment.id == experimentId) {
          return `${instancePath} [${experiment.name}]`;
        }
      })
    } else {
      GEPPETTO.ProjectsController.getUserProjects().forEach(project => {
        if (project.id == projectId) {
          project.experiments.forEach(experiment => {
            if (experiment == experimentId) {
              return `${instancePath} [${project.name} - ${experiment.name}]`;
            }
          })
        }
      })
    }
  }
 

  getSinglePlotConfiguration (lineOptions) {
    const defaultConf = defaultTrace();
    return { ...defaultConf, line: lineOptions ? lineOptions : defaultConf.line };
  }

  extractLegendName (instanceY) {
    let legendName = instanceY.getInstancePath();
    if (instanceY instanceof ExternalInstance) {
      legendName = this.getLegendName(instanceY.projectId, instanceY.experimentId, instanceY, window.Project.getId() == instanceY.projectId);
    }  
    return legendName;
  }
  
  toggleLegend () {
    this.layout.showlegend = !this.layout.showlegend;
    this.reset = false
    this.forceUpdate()
  }

  resetAxes () {
    this.forceUpdate()
  }


  openHeaderIconMenu (anchor) {
    this.reset = false
  }

  downloadImage (imageType) {
    const { id } = this.props;
    const { layout } = this;
    imageType = imageType.replace('Save as ', '').toLowerCase()
    
    layout.paper_bgcolor = "rgb(255,255,255)";
    layout.xaxis.linecolor = "rgb(0,0,0)";
    layout.yaxis.linecolor = "rgb(0,0,0)";
    layout.xaxis.tickfont.color = "rgb(0,0,0)";
    layout.yaxis.tickfont.color = "rgb(0,0,0)";
    layout.yaxis.title.font.color = "rgb(0,0,0)";
    layout.xaxis.title.font.color = "rgb(0,0,0)";
    layout.xaxis.tickfont.size = 18;
    layout.yaxis.tickfont.size = 18;
    layout.xaxis.title.font.size = 18;
    layout.yaxis.title.font.size = 18;
    layout.legend.font.size = 18;
    layout.legend.font.family = 'Helvetica Neue, Helvetica, sans-serif';
    layout.legend.font.color = "rgb(0,0,0)";
    layout.legend.bgcolor = "rgb(255,255,255)";
    
    Plotly.relayout(id, layout);
    Plotly.downloadImage(id, { format: imageType });
    this.forceUpdate()
  }

  downloadPlotData () {
    const { data } = this;
    const { plots, id } = this.props
    
    // instancePaths 
    let text = plots.map(plot => this.removeLastPath(plot.y))
    text.unshift(plots[0].x);
    text = text.join(' ')

    // data
    const dataToSave = data.map(dataset => dataset.y)
    dataToSave.unshift(data[0].x);

    // convert instancePaths to bytes
    const bytesNames = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) {
      bytesNames[i] = text.charCodeAt(i);
    }

    // arange data in table like format
    let content = "";
    for (let i = 0; i < dataToSave[0].length; i++) {

      for (let j = 0; j < dataToSave.length; j++){
        let size = dataToSave[j][i].toString().length;
        let space = "";
        for (var l = 25; l > size; l--){
          space += " ";
        }
        content += dataToSave[j][i] + space;
      }
      content += "\r\n";
    }

    // convert data to bytes
    const bytesResults = new Uint8Array(content.length);
    for (var i = 0; i < content.length; i++) {
      bytesResults[i] = content.charCodeAt(i);
    }
      
    const zip = new JSZip();
    zip.file("outputMapping.dat", bytesNames);
    zip.file("results.dat", bytesResults);
    zip.generateAsync({ type:"blob" })
      .then(function (blob) {
        let d = new Date();
        let n = d.getTime();
        FileSaver.saveAs(blob, id + "-" + n.toString() + ".zip");
      });
    
  }

  removeLastPath (path){
    // hello.there.here.I.go => hello.there.here.I
    if (typeof path === "string" && path.length > 3 && path.indexOf('.') > -1) {
      return path.split('.').filter((el, index, arr) => index != arr.length - 1).join('.')
    }
  }

  plotAverage (actionName) {
    if (actionName.startsWith("Plot") && this.analysis.length == 0) {
      var result = [];
      const { data } = this;
      var arrays = data.map(dataset => dataset.y);
      for (let i in arrays[0]) {
        let total = 0;
        for (let arr of arrays) {
          total += +arr[i]
        }
        result.push(total / arrays.length);
      }
      for (let dataset of data) {
        dataset.opacity = 0.4;
      }
      this.analysis.push({
        hoverinfo: "all",
        line: { color: "#e27300" },
        mode: "lines",
        name: "Average",
        path: "",
        type: "scatter",
        x: data[0].x,
        y: result
      })
      this.forceUpdate()
    } else if (actionName.startsWith("Remove") && this.analysis.length > 0) {
      this.analysis.pop()
      this.forceUpdate()
    }
  }


  render () {

    this.initPlot();
    const { plotConfig, id, classes } = this.props;
    const { data, layout, revision, analysis } = this;
    const config = { ...defaultConfig(), ...plotConfig }

    return (
      <div className={classes.container}>
        {data.length > 0 && (
          <div className={classes.container}>

            <PlotHeader headerIcons={this.headerIconList} />

            <ScatterPlot
              ref="plotly"
              divId={id}
              config={config}
              data={[...data, ...analysis]}
              revision={revision}
              onDoubleClick={() => { }}
              layout={layout}
              useResizeHandler
              className={classes.plot}
            />
          </div>
        )}
      </div>
    )
  }
}

export default withStyles(style)(PlotComponent)