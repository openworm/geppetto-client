import React from 'react';
import ListViewer from '../../ListViewer';
import instances from '../instances-small.json';

export default class ListViewerShowcaseScroll extends React.Component {
  render () {
    return (
      <div>
        <div
          style={{
            height: '400px',
            width: '1200px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ListViewer infiniteScroll={true} instances={instances} />
        </div>
      </div>
    );
  }
}
