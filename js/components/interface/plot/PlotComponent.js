import React from 'react';
import Plotly from 'plotly.js/lib/core';
import createPlotlyComponent from 'react-plotly.js/factory';

Plotly.register([require('plotly.js/lib/scatter')]);
const ScatterPlot = createPlotlyComponent(Plotly);


/*
 * import update from 'immutability-helper';
 * import $ from 'jquery';
 */

import { unit } from 'mathjs';
import AbstractComponent from '../../AComponent';
import { defaultLayout, defaultTrace, defaultLine, defaultConfig, defaultAxisLayout } from './configuration/plotConfiguration';
import ExternalInstance from '../../../geppettoModel/model/ExternalInstance';


export default class PlotComponent extends AbstractComponent {

  /**
   * 
   * @param {instances, title, forceChange} props 
   */
  constructor (props) {
    super(props);
    this.revision = 0;

  }

  revision = 0 

  componentDidMount () {
    
  }

  
  shouldComponentUpdate (prevProps) {
 
    if (this.props.forceChange) {
      return true;
    }
    if (this.props.plots.length != prevProps.plots.length) {
      return true;
    }
    for (let i in this.props.plots) {
      
      if (prevProps.plots[i].x != this.props.plots[i].x){
        return true;
      }
      if (prevProps.plots[i].y != this.props.plots[i].y){
        return true;
      }
      for (let key in prevProps.plots[i].lineOptions) {
        if (prevProps.plots[i].lineOptions[key] != this.props.plots[i].lineOptions[key]){
          return true;
        }
        
      }
      
    }
    return false;
    
  }

  initPlot () {
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

  render () {
    this.initPlot();
    const { plotConfig } = this.props;
    const { data, layout, revision } = this;
    const config = { ...defaultConfig(), ...plotConfig }
    
    return (
      <div
        style={{
          /*
           * display: "flex",
           * alignItems: "center",
           * justifyContent: "center",
           */
          width: '100%',
          height: '100%'
        }}
      >
        {
          data.length > 0 && (
            <ScatterPlot
              ref="plotly"
              config={config}
              data={data}
              revision={revision}
              onDoubleClick={() => { }}
              layout={layout}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
            />)
        }
      </div>
    )
  }
}