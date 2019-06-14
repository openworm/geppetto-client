import React from 'react';
import Plotly from 'plotly.js/lib/core';
import createPlotlyComponent from 'react-plotly.js/factory';

Plotly.register([ require('plotly.js/lib/scatter') ]);
const ScatterPlot = createPlotlyComponent(Plotly);


/*
 * import update from 'immutability-helper';
 * import $ from 'jquery';
 */

import { unit } from 'mathjs';
import AbstractComponent from '../../AComponent';
import { defaultLayout, defaultTrace, defaultLine, defaultConfig } from './reduxConfiguration/plotConfiguration';
import ExternalInstance from '../../../geppettoModel/model/ExternalInstance';


export default class ReduxPlot extends AbstractComponent {

  constructor (props) {
    super(props);
    this.state = {
      layout: defaultLayout(),
      data: [],
      frames: [],
      variables: {},
      revision: 0
    };
  }

  getUnitLabel (unitSymbol) {
    if (unitSymbol != null || unitSymbol != undefined){
      unitSymbol = unitSymbol.replace(/_per_/gi, " / ");
    } else {
      unitSymbol = "";
    }

    var unitLabel = unitSymbol;

    if (unitSymbol != undefined && unitSymbol != null && unitSymbol != "") {
      var formattedUnitName = "";
      if (GEPPETTO.UnitsController.hasUnit(unitSymbol)){
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

  updateAxisTitles (xInstance, yInstance, layout) {
    const { variables } = this.state;
    const { xaxis, yaxis, margin } = layout;
    const title = 'title';
    const { [title]: xtitle } = xaxis;
    const { [title]: ytitle } = yaxis;

    const inhomogeneousUnits = new Set(Object.values(variables).map(v => v.getUnit())).size > 1;

    const labelY = inhomogeneousUnits ? "SI Units" : this.getUnitLabel(yInstance.getUnit());
    
    return { 
      ...layout,
      xaxis:  { ...xaxis, title: { ...xtitle, text: this.getUnitLabel(xInstance.getUnit()) } },
      yaxis:  { ...yaxis, title: { ...ytitle, text: labelY } },
      margin: { ...margin, l: (labelY == null || labelY == "") ? 30 : 50 }
    }

    
  }

  updateAxisRanges () {
    const { layout } = this.state;
    const { xaxis, yaxis } = layout;

    return { 
      ...layout,
      xaxis: { ...xaxis, autorange: true },
      yaxis: { ...yaxis, autorange: true }
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

  plotInstance (instanceY, lineOptions = {}, instanceX = window.time) {
    const { data } = this.state
    let legendName = instanceY.getInstancePath();
    if (instanceY instanceof ExternalInstance){
      legendName = this.getLegendName(
        instanceY.projectId,
        instanceY.experimentId,
        instanceY,
        window.Project.getId() == instanceY.projectId
      );
    }

    const trace = {
      ...defaultTrace(), 
      x: instanceX.getTimeSeries(),
      y: instanceY.getTimeSeries(),
      path: instanceY.getInstancePath(),
      name: legendName,
      line: { ...defaultLine, ...lineOptions }
    };

    const newVariables = { 
      ...this.state.variables, 
      [legendName]: instanceY 
    }
    
    let newLayout = this.updateAxisRanges();
    newLayout = this.updateAxisTitles(instanceX, instanceY, newLayout);
    
    const newData = [ ...data.concat(trace) ]

    this.setState( ({ revision, layout }) => ({
      data: newData, 
      variables: newVariables,
      revision: revision + 1,
      layout: { ...newLayout, datarevision: layout.datarevision + 1 }

    }))

  }

  componentDidMount (){
    const { instancePath } = this.props;
    if (instancePath) {
      try {
        const instanceY = Instances.getInstance(`${instancePath}.data`)
        const instanceX = Instances.getInstance(`${instancePath}.time`)
        this.plotInstance(instanceY, {}, instanceX)
      } catch (error) {
        console.log(`Instance ${instancePath} does not seems to contain data or time instances.`)
      }
    } else {
      console.log(`There is no instance path property defined for Plotly component.`)
    }
    
  }

  render () {
    const { data, layout, revision } = this.state;
    return (
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: '100%',
          height: '100%'
        }}
      >
        {
          data.length > 0 && (
            <ScatterPlot
              ref="plotly"
              config={defaultConfig()}
              data={data}
              onDoubleClick={() => {}}
              revision={revision}
              layout={layout}
              useResizeHandler
              style={{ width: '95%', height: '95%' }}
            />)
        }
      </div>
    )
  }
}