import React from 'react';
import ListViewer from '../../ListViewer';
import instances from '../instances-small.json';

export default class ListViewerShowcaseFilter extends React.Component {
  render () {
    return (
      <div
        style={{ width: '1200px', }}
      >
        <ListViewer
          filter={row => row.metaType === 'CompositeType'}
          instances={instances}
        />
      </div>
    );
  }
}
