import React, { Component } from 'react';
import SortableTree from 'react-sortable-tree';
import {
  toggleExpandedForAll,
  changeNodeAtPath,
  walk,
} from 'react-sortable-tree';
import { withStyles } from '@material-ui/core';
import 'react-sortable-tree/style.css';
import PropTypes from 'prop-types';

const styles = () => ({ treeViewer: { height: '100%' } });

class Tree extends Component {
  constructor (props) {
    super(props);

    this.updateTreeData = this.updateTreeData.bind(this);
    this.expandAll = this.expandAll.bind(this);
    this.collapseAll = this.collapseAll.bind(this);
    this.state = { treeData: this.props.treeData };
  }

  updateTreeData (treeData) {
    this.setState({ treeData });
  }

  expand (expanded) {
    this.setState({
      treeData: toggleExpandedForAll({
        treeData: this.state.treeData,
        expanded,
      }),
    });
  }

  expandAll () {
    this.expand(true);
  }

  collapseAll () {
    this.expand(false);
  }

  handleClick (event, rowInfo) {
    const toggleMode = this.props.toggleMode;
    let currentTreeData = this.state.treeData;
    // If node has children, we expand/collapse the node
    if (
      rowInfo.node.children != undefined
      && rowInfo.node.children.length > 0
    ) {
      // If parents can be activate, iterate over the whole tree
      if (this.props.activateParentsNodeOnClick) {
        walk({
          treeData: currentTreeData,
          getNodeKey: ({ treeIndex }) => treeIndex,
          ignoreCollapsed: true,
          callback: rowInfoIter => {
            const isActive = rowInfoIter.treeIndex == rowInfo.treeIndex;
            /*
             * If toggleMode just toggle to activate/inactivate selected node and expand/collapse
             * If non toggle mode inactive all nodes but selected and expand/collapse
             */
            if (isActive && toggleMode) {
              rowInfoIter.node.active = !rowInfoIter.node.active;
              rowInfoIter.node.expanded = !rowInfoIter.node.expanded;
              currentTreeData = changeNodeAtPath({
                treeData: currentTreeData,
                path: rowInfoIter.path,
                newNode: rowInfoIter.node,
                getNodeKey: ({ treeIndex }) => treeIndex,
                ignoreCollapsed: true,
              });
            } else if (isActive && !toggleMode) {
              rowInfoIter.node.active = isActive;
              rowInfoIter.node.expanded = !rowInfoIter.node.expanded;
              currentTreeData = changeNodeAtPath({
                treeData: currentTreeData,
                path: rowInfoIter.path,
                newNode: rowInfoIter.node,
                getNodeKey: ({ treeIndex }) => treeIndex,
                ignoreCollapsed: true,
              });
            } else if (isActive != rowInfoIter.node.active && !toggleMode) {
              rowInfoIter.node.active = isActive;
              currentTreeData = changeNodeAtPath({
                treeData: currentTreeData,
                path: rowInfoIter.path,
                newNode: rowInfoIter.node,
                getNodeKey: ({ treeIndex }) => treeIndex,
                ignoreCollapsed: true,
              });
            }
          },
        });
      } else {
        rowInfo.node.expanded = !rowInfo.node.expanded;
        currentTreeData = changeNodeAtPath({
          treeData: currentTreeData,
          path: rowInfo.path,
          newNode: rowInfo.node,
          getNodeKey: ({ treeIndex }) => treeIndex,
          ignoreCollapsed: true,
        });
      }
    } else if (rowInfo.node.children == undefined) {
      // If node has no children, we select the node
      walk({
        treeData: currentTreeData,
        getNodeKey: ({ treeIndex }) => treeIndex,
        ignoreCollapsed: true,
        callback: rowInfoIter => {
          const isActive = rowInfoIter.treeIndex == rowInfo.treeIndex;
          /*
           * If toggleMode just toggle to activate/inactivate selected node
           * If non toggle mode inactive all nodes but selected
           */
          if (isActive && toggleMode) {
            rowInfoIter.node.active = !rowInfoIter.node.active;
            currentTreeData = changeNodeAtPath({
              treeData: currentTreeData,
              path: rowInfoIter.path,
              newNode: rowInfoIter.node,
              getNodeKey: ({ treeIndex }) => treeIndex,
              ignoreCollapsed: true,
            });
          } else if (isActive != rowInfoIter.node.active && !toggleMode) {
            rowInfoIter.node.active = isActive;
            currentTreeData = changeNodeAtPath({
              treeData: currentTreeData,
              path: rowInfoIter.path,
              newNode: rowInfoIter.node,
              getNodeKey: ({ treeIndex }) => treeIndex,
              ignoreCollapsed: true,
            });
          }
        },
      });
    }

    // Update tree with latest changes
    this.updateTreeData(currentTreeData);

    // If there is a callback, we use it
    if (this.props.handleClick != undefined) {
      this.props.handleClick(event, rowInfo);
    }
  }

  getNodeProps (rowInfo) {
    let nodeProps = {};
    nodeProps['onClick'] = event => this.handleClick(event, rowInfo);

    if (this.props.getButtons !== undefined) {
      nodeProps['buttons'] = this.props.getButtons(rowInfo);
    }
    if (rowInfo.node.instance !== undefined) {
      nodeProps['style'] = { cursor: 'pointer' };
    }
    if (rowInfo.node.active) {
      nodeProps['className'] = 'activeNode';
    }
    if (this.props.getNodesProps !== undefined) {
      nodeProps['title'] = this.props.getNodesProps(rowInfo);
    }
    return nodeProps;
  }

  render () {
    const {
      classes,
      style,
      rowHeight,
      searchQuery,
      onlyExpandSearchedNodes,
      controls,
    } = this.props;
    return (
      <div className={classes.treeViewer} style={style}>
        {controls ? controls : null}
        <SortableTree
          style={style}
          treeData={this.state.treeData}
          canDrag={false}
          rowHeight={rowHeight}
          scaffoldBlockPxWidth={22}
          generateNodeProps={rowInfo => this.getNodeProps(rowInfo)}
          onChange={treeData => this.updateTreeData(treeData)}
          searchQuery={searchQuery !== undefined ? searchQuery : null}
          onlyExpandSearchedNodes={
            onlyExpandSearchedNodes !== undefined
              ? onlyExpandSearchedNodes
              : false
          }
        />
      </div>
    );
  }
}

Tree.propTypes = {
  /**
   * Tree data with the following keys: title, subtitle, expanded, children
   */
  treeData: PropTypes.array.isRequired,
  /**
   * Style applied to the container wrapping the tree
   */
  style: PropTypes.object.isRequired,
  /**
   * Either a fixed row height (number) or a function that returns the height of a row given its index
   */
  rowHeight: PropTypes.any.isRequired,
  /**
   * Function to handle node's click events
   */
  handleClick: PropTypes.func.isRequired,
  /**
   * Function to add buttons
   */
  getButtons: PropTypes.func.isRequired,
  /**
   * Boolean to activate/inactivate selected node
   */
  toggleMode: PropTypes.bool,
  /**
   * Boolean to allow parents activation or not
   */
  activateParentsNodeOnClick: PropTypes.bool,
  /**
   * Generate an object with additional props to be passed to the node render
   */
  getNodesProps: PropTypes.func,
  /**
   * Controls
   */
  controls: PropTypes.obj,
};

export default withStyles(styles)(Tree);
