import React, { Component } from 'react';
import Tree from '../../Tree';
import '../TreeShowcase.less';

export default class TreeShowcase extends Component {
  constructor (props) {
    super(props);
    this.getButtons = this.getButtons.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  getButtons (rowInfo) {
    let buttons = [];
    if (rowInfo.node.children == undefined) {
      buttons.push(
        <i className={'gpt-telescope_tbo_full'} aria-hidden="true"></i>
      );
    }
    return buttons;
  }

  getTreeData () {
    const treeData = [
      {
        title: 'San Diego, APRIL 25-26, 2009',
        subtitle:
          '1.5 T General Electric (GE) Signa Excite. 8-channel, transmit-receive head coil',
        expanded: true,
        children: [
          {
            title: '3-D T1-WEIGHTED FSPGR',
            data: '3-D T1-WEIGHTED FSPGR',
            active: true,
          },
          {
            title: '3-D FAST SPIN ECHO',
            data: '3-D FAST SPIN ECHO',
          },
          {
            title: '2-D FAST SPIN ECHO',
            data: '2-D FAST SPIN ECHO',
          },
          {
            title: 'HIGH RES 3-D T1-WEIGHTED FSPGR',
            data: 'HIGH RES 3-D T1-WEIGHTED FSPGR',
          },
        ],
      },
    ];
    return treeData;
  }

  handleClick (event, rowInfo) {
    console.log('Click handler triggered.');
    console.log('Node data: ' + rowInfo.node.data);
  }

  render () {
    const style = {
      width: 400,
      height: 250,
    };
    const treeData = this.getTreeData();
    const rowHeight = 50;
    const toggleMode = false;

    return (
      <Tree
        style={style}
        treeData={treeData}
        handleClick={this.handleClick}
        getButtons={this.getButtons}
        rowHeight={rowHeight}
        toggleMode={toggleMode}
      />
    );
  }
}
