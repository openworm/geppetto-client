import React from 'react';
import ReactPlotly from 'react-plotly.js';
/*
 * import update from 'immutability-helper';
 * import $ from 'jquery';
 */
import math from 'mathjs';
import AbstractComponent from '../../AComponent';
import { defaultLayout, defaultTrace, defaultLine } from './reduxConfiguration/plotConfiguration';
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

  /*
   * addButtonToTitleBar () {
   *   $("<div class='fa fa-home' title='Reset plot zoom'></div>")
   *     .on('click', function (event) {
   *       this.resetAxes();
   *     }.bind(this)
   *     )
   * }
   */

  componentDidMount () {
    /*
     * FIXME: this jquery should be retired
     * this.addButtonToTitleBar(
     *   $("<div class='fa fa-home' title='Reset plot zoom'></div>")
     *     .on('click', function (event) {
     *       this.resetAxes();
     *     }.bind(this)
     *     )
     * );
     */
    /*
     * this.dialog.dialog({
     *     resize: function (event, ui) {
     *         this.resize(true);
     *     }.bind(this)
     * });
     */
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
        var mathUnit = math.unit(1, unitSymbol);

        formattedUnitName = (mathUnit.units.length > 0) ? mathUnit.units[0].unit.base.key : "";
        (mathUnit.units.length > 1) ? formattedUnitName += " OVER " + mathUnit.units[1].unit.base.key : "";
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
    const { xtitle } = xaxis;
    const { ytitle } = yaxis;

    const inhomogeneousUnits = new Set(Object.values(variables).map(v => v.getUnit())).size > 1;
    const labelY = inhomogeneousUnits ? "SI Units" : this.getUnitLabel(yInstance.getUnit());
    
    return { 
      ...layout,
      xaxis:  { ...xaxis, title: { ...xtitle, text: this.getUnitLabel(xInstance.getUnit()) } },
      yaxis:  { ...yaxis, title: { ...ytitle, text: labelY } },
      margin: { ...margin, l: (labelY == null || labelY == "") ? 30 : 50 }
    }

    
  }

  updateAxisRanges (xData, yData) {
    const { layout } = this.state;
    const { xaxis, yaxis } = layout;

    const xmax = xData.reduce((value, max) => Math.max(value, max));
    const xmin = xData.reduce((value, min) => Math.min(value, min));
    const ymax = yData.reduce((value, max) => Math.max(value, max));
    const ymin = yData.reduce((value, min) => Math.min(value, min));

    return { 
      ...layout,
      xaxis: { ...xaxis, range: [xmin, xmax] },
      yaxis: { ...yaxis, range: [ymin, ymax] }
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
    
    let newLayout = this.updateAxisRanges(instanceX.getTimeSeries(), instanceY.getTimeSeries());
    newLayout = this.updateAxisTitles(instanceX, instanceY, newLayout);
    
    const newData = [ ...data.concat(trace) ]

    this.setState( ({ revision, layout }) => ({
      data: newData, 
      variables: newVariables,
      revision: revision + 1,
      layout: { ...newLayout, datarevision: layout.datarevision + 1 }

    }))

  }

  /*
   * resetAxes () {
   *   const { layout } = this.state;
   *   this.setState({ layout: { ...layout } });
   * }
   */

  componentDidUpdate (prevProps){
    const { instancePath2Plot } = this.props;

    if (instancePath2Plot && instancePath2Plot != prevProps.instancePath2Plot) {
      const instanceY = Instances.getInstance('nwbfile.acquisition.test_sine_1.data')
      const instanceX = Instances.getInstance('nwbfile.acquisition.test_sine_1.time')
      this.plotInstance(instanceY, {}, instanceX)
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
        <ReactPlotly
          ref="plotly"
          data={data}
          revision={revision}
          layout={layout}
          useResizeHandler
          style={{ width: '95%', height: '95%' }}
          onUpdate={figure => this.setState(figure)}
        />
      </div>

      
    )
  }
}