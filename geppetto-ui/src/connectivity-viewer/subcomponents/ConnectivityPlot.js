import React, { Component } from 'react';
import * as util from '../../utilities';
import Instance from '@geppettoengine/geppetto-core/model/Instance';
import { withStyles } from '@material-ui/core';
import IconText from './IconText';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import ConnectivityTooltip from './ConnectivityTooltip';
const d3 = require('d3');

const styles = theme => ({
  legends: {
    marginTop: theme.spacing(4),
    marginLeft: theme.spacing(1),
  },
  legendTitle: {
    fontSize: '14px',
    color: 'white',
  },
});

class ConnectivityPlot extends Component {
  constructor (props) {
    super(props);
    this.height = this.props.size.height;
    this.width = this.props.size.width;
    this.linkCache = {};

    this.defaultOptions = {
      nodeType: function (node) {
        if (node instanceof Instance) {
          return node.getParent().getId();
        } else {
          return node.getPath().split('_')[0];
        }
      },
      linkWeight: function (conn) {
        return 1;
      },
      linkType: function (conn) {
        return 1;
      },
      library: this.props.modelFactory.geppettoModel.common,
    };

    this.setNodeColormap(this.props.colorMap);
    this.subRef = React.createRef();
    this.tooltipRef = React.createRef();
  }

  shouldComponentUpdate (nextProps, nextState, nextContext) {
    return this.props.toolbarVisibility === nextProps.toolbarVisibility;
  }

  componentDidMount () {
    this.setOptions();
    this.setData(this.props.data);
    this.setNodeColormap(this.props.colorMap);
    this.draw();
    this.forceUpdate();
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (
      prevProps.options !== this.props.options
      || prevProps.layout !== this.props.layout
      || this.options === null
    ) {
      this.setOptions();
    }
    this.setData(this.props.data);
    this.setNodeColormap(this.props.colorMap);
    this.draw();
  }

  /**
   *
   * Sets connectivity auxiliary functions
   *
   * @command setOptions()
   */

  setOptions () {
    this.options = this.defaultOptions;
    if (this.props.linkType != null) {
      this.options.linkType = this.props.linkType;
    }
    if (this.props.nodeType != null) {
      this.options.nodeType = this.props.nodeType;
    }
    if (this.props.linkWeight != null) {
      this.options.linkWeight = this.props.linkWeight;
    }
    if (this.props.library != null) {
      this.options.library = this.props.library;
    }
  }

  /**
   *
   * Creates dataset with provided data
   *
   * @command setData(data)
   *
   * @param data
   */
  setData (data) {
    this.dataset = {};
    this.mapping = {};
    this.mappingSize = 0;
    this.dataset['root'] = data;
  }

  /**
   *
   * Sets nodeColormap
   *
   * @command setNodeColormap(nodeColormap)
   *
   * @param nodeColormap
   */
  setNodeColormap (nodeColormap) {
    if (nodeColormap != null) {
      this.nodeColormap = nodeColormap;
    } else {
      this.nodeColormap = this.defaultColorMapFunction();
    }
  }

  /**
   *
   * Returns default colorScale
   *
   * @command defaultColorMapFunction()
   *
   */
  defaultColorMapFunction () {
    const domain = this.props.names;
    const range = this.props.colors;
    return d3.scaleOrdinal(range).domain(domain);
  }

  /**
   *
   * Creates connections and draws layout
   *
   * @command draw()
   *
   */
  draw () {
    if (this.createDataFromConnections()) {
      this.drawLayout();
    }
  }

  /**
   *
   * Creates data from connections
   *
   * @command createDataFromConnections()
   */
  createDataFromConnections () {
    const connectionVariables = this.props.modelFactory
      .getAllTypesOfType(this.options.library.connection)[0]
      .getVariableReferences();
    if (connectionVariables.length > 0) {
      if (
        this.dataset['root'].getMetaType()
        === this.props.resources.INSTANCE_NODE
      ) {
        const subInstances = this.dataset['root'].getChildren();
        this.dataset['nodes'] = [];
        this.dataset['links'] = [];
        for (let k = 0; k < subInstances.length; k++) {
          const subInstance = subInstances[k];
          if (
            subInstance.getMetaType()
            === this.props.resources.ARRAY_INSTANCE_NODE
          ) {
            const populationChildren = subInstance.getChildren();
            for (let l = 0; l < populationChildren.length; l++) {
              const populationChild = populationChildren[l];
              this.createNode(
                populationChild.getId(),
                this.options.nodeType(populationChild)
              );
            }
          }
        }
        for (let x = 0; x < connectionVariables.length; x++) {
          const connectionVariable = connectionVariables[x];
          const source = connectionVariable.getA();
          const target = connectionVariable.getB();
          const sourceId = source
            .getElements()[source.getElements().length - 1].getPath();
          const targetId = target
            .getElements()[source.getElements().length - 1].getPath();
          this.createLink(
            sourceId,
            targetId,
            this.options.linkType.bind(this)(
              connectionVariable,
              this.linkCache
            ),
            this.options.linkWeight(connectionVariable)
          );
        }
      }
      this.dataset.nodeTypes = util
        .uniq(util.pluck(this.dataset.nodes, 'type'))
        .sort();
      this.dataset.linkTypes = util
        .uniq(util.pluck(this.dataset.links, 'type'))
        .sort();
      return true;
    }
    return false;
  }

  /**
   *
   * Prepocesses node degrees
   *
   * @command calculateNodeDegrees(normalize)
   * @param normalize
   */
  calculateNodeDegrees (normalize) {
    const indegrees = util.countBy(this.dataset.links, function (link) {
      return link.source;
    });

    const outdegrees = util.countBy(this.dataset.links, function (link) {
      return link.target;
    });
    let maxDeg = 1;
    this.dataset.nodes.forEach(function (node, idx) {
      const idg = typeof indegrees[idx] === 'undefined' ? 0 : indegrees[idx];
      const odg = typeof outdegrees[idx] === 'undefined' ? 0 : outdegrees[idx];
      node.degree = idg + odg;
      if (node.degree > maxDeg) {
        maxDeg = node.degree;
      }
    });
    if (normalize) {
      this.dataset.nodes.forEach(function (node) {
        node.degree /= maxDeg;
      });
    }
  }

  /**
   *
   * Creates node
   *
   * @command createNode(id, type)
   *
   * @param id
   * @param type
   */
  createNode (id, type) {
    if (!(id in this.mapping)) {
      const nodeItem = {
        id: id,
        type: type,
      };
      this.dataset['nodes'].push(nodeItem);
      this.mapping[nodeItem['id']] = this.mappingSize;
      this.mappingSize++;
    }
  }

  /**
   *
   * Creates link
   *
   * @command createLink(sourceId, targetId, type, weight)
   *
   * @param sourceId
   * @param targetId
   * @param type
   * @param weight
   */
  createLink (sourceId, targetId, type, weight) {
    const linkItem = {
      source: this.mapping[sourceId],
      target: this.mapping[targetId],
      type: type,
      weight: weight,
    };
    this.dataset['links'].push(linkItem);
  }

  /**
   *
   * Draws the layout
   *
   * @command drawLayout()
   *
   */
  drawLayout () {
    this.width = this.props.size.width;
    this.height = this.props.size.height;
    this.cleanCanvas();
    this.svg = d3
      .select('#' + this.props.id)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.props.layout.draw(this);
  }

  /**
   *
   * Cleans the canvas
   *
   * @command cleanCanvas()
   *
   */

  cleanCanvas () {
    if (this.svg) {
      this.svg.remove();
    }
  }

  render () {
    const { id, classes, legendsVisibility, layout } = this.props;

    let legends = [];
    if (layout && this.nodeColormap && this.dataset) {
      const layoutLegends = layout.getLegends(this);
      for (const obj of layoutLegends) {
        if (obj.title) {
          legends.push(
            <Typography
              key={obj.title}
              className={classes.legendTitle}
              variant="h6"
              gutterBottom
            >
              {obj.title}
            </Typography>
          );
        }
        let domain = obj.colorScale.domain().slice().sort();
        for (const [i, v] of domain.entries()) {
          legends.push(
            <IconText
              key={v}
              icon="fa fa-square-full legend-item"
              color={obj.colorScale(i)}
              subtitle={v}
              width={'20px'}
              height={'20px'}
            />
          );
        }
      }
    }
    let plot = (
      <Grid item sm={9} xs={12}>
        <ConnectivityTooltip ref={this.tooltipRef} layout={layout} />
        <div id={id} />
      </Grid>
    );

    let show;
    if (legends.length === 0 || !legendsVisibility) {
      show = <Grid container>{plot}</Grid>;
    } else {
      show = (
        <Grid container>
          <Grid item sm xs>
            <div ref={this.subRef}>
              {legendsVisibility ? legends.map(entry => entry) : ''}
            </div>
          </Grid>
          {plot}
        </Grid>
      );
    }
    return show;
  }
}

export default withStyles(styles)(ConnectivityPlot);
