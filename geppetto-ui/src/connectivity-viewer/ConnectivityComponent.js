import React, { Component } from 'react';
import { withStyles } from '@material-ui/core';
import ConnectivityToolbar from './subcomponents/ConnectivityToolbar';
import ConnectivityPlot from './subcomponents/ConnectivityPlot';
import { Matrix } from './layouts/Matrix';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';

const styles = theme => ({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
  },
});

class ConnectivityComponent extends Component {
  constructor (props) {
    super(props);
    this.state = {
      layout: this.props.layout !== null ? this.props.layout : new Matrix(),
      toolbarVisibility: true,
      legendsVisibility: true,
      dimensions: null,
    };
    this.legendHandler = this.legendHandler.bind(this);
    this.deckHandler = this.deckHandler.bind(this);
    this.sortOptionsHandler = this.sortOptionsHandler.bind(this);
    this.plotRef = React.createRef();
    this.containerRef = React.createRef();
  }

  /**
   *
   * Handles legend toggle button
   *
   * @command legendHandler ()
   *
   */
  legendHandler () {
    this.setState(() => ({ legendsVisibility: !this.state.legendsVisibility }));
  }

  /**
   *
   * Handles toolbar visibility
   *
   * @command toolbarHandler (visibility)
   *
   */

  toolbarHandler (visibility) {
    this.setState(() => ({ toolbarVisibility: visibility }));
  }

  /**
   *
   * Handle layout selection
   *
   * @command deckHandler (layout)
   *
   * @param layout
   */
  deckHandler (layout) {
    this.setState(() => ({ layout: layout }));
  }

  /**
   *
   * Updates the sorting order
   *
   * @command sortOptionsHandler (option)
   *
   */
  sortOptionsHandler (option) {
    this.state.layout.setOrder(this.plotRef.current, option);
  }

  componentDidMount () {
    const toolbarHeight = 140;

    this.setState({
      dimensions: {
        width: this.containerRef.current.clientWidth,
        height: this.containerRef.current.clientHeight - toolbarHeight,
      },
    });
  }

  renderContent () {
    const {
      classes,
      id,
      data,
      colorMap,
      colors,
      names,
      modelFactory,
      resources,
      matrixOnClickHandler,
      nodeType,
      linkWeight,
      linkType,
      library,
    } = this.props;
    const {
      layout,
      toolbarVisibility,
      legendsVisibility,
      dimensions,
    } = this.state;

    return (
      <Grid className={classes.container} container spacing={2}>
        <Grid item sm={12} xs={12}>
          <ConnectivityToolbar
            id={id}
            layout={layout}
            toolbarVisibility={toolbarVisibility}
            legendsVisibility={legendsVisibility}
            legendHandler={this.legendHandler}
            deckHandler={this.deckHandler}
            sortOptionsHandler={this.sortOptionsHandler}
          />
        </Grid>
        <Grid item sm={12} xs>
          <ConnectivityPlot
            ref={this.plotRef}
            id={id}
            size={dimensions}
            data={data}
            colorMap={colorMap}
            colors={colors}
            names={names}
            layout={layout}
            legendsVisibility={legendsVisibility}
            toolbarVisibility={toolbarVisibility}
            modelFactory={modelFactory}
            resources={resources}
            matrixOnClickHandler={matrixOnClickHandler}
            nodeType={nodeType}
            linkWeight={linkWeight}
            linkType={linkType}
            library={library}
          />
        </Grid>
      </Grid>
    );
  }

  render () {
    const { classes } = this.props;
    const { dimensions } = this.state;

    const content = dimensions != null ? this.renderContent() : '';
    return (
      <div
        ref={this.containerRef}
        className={classes.container}
        onMouseEnter={() => this.toolbarHandler(true)}
        onMouseLeave={() => this.toolbarHandler(false)}
      >
        {content}
      </div>
    );
  }
}

ConnectivityComponent.propTypes = {
  /**
   * Component identifier
   */
  id: PropTypes.string.isRequired,
  /**
   * Array of colors to provide for each subtitle
   */
  colors: PropTypes.array.isRequired,
  /**
   * Model entities to be visualized
   */
  data: PropTypes.object.isRequired,
  /**
   * Geppetto Model Factory
   */
  modelFactory: PropTypes.object.isRequired,
  /**
   * Geppetto Resources
   */
  resources: PropTypes.object.isRequired,
  /**
   * Function to handle click events on Matrix layout
   */
  matrixOnClickHandler: PropTypes.func.isRequired,
  /**
   * Function returning a d3 scaleOrdinal
   */
  colorMap: PropTypes.func,
  /**
   * One of Matrix, Hive, Force or Chord objects. Defaults to Matrix
   */
  layout: PropTypes.object,
  /**
   * Function to colour links (synapses) by neurotransmitter
   */
  linkType: PropTypes.func,
  /**
   * Function to scale line widths based on the synaptic base conductance leve
   */
  linkWeight: PropTypes.func,
  /**
   * Function that maps the connection source node (object of class EntityNode ) onto any type of value (coercible to string) which qualitatively identifies the node category
   */
  nodeType: PropTypes.func,
  /**
   * Geppetto library that supplies a network type
   */
  library: PropTypes.func,
};

export default withStyles(styles)(ConnectivityComponent);
