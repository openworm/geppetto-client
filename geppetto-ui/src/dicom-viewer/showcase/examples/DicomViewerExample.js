import React, { Component } from 'react';
import DicomViewer from '../../DicomViewer';

export default class DicomViewerExample extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    const data
      = 'https://s3.amazonaws.com/patient-hm-august-2017/MRI/IN+SITU+2008+MPRAGE+1MM-ISO/IN-SITU-2008-MPRAGE-1MM-ISO-ALT2.nii.gz';

    return (
      <div
        style={{
          position: 'relative',
          height: '800px',
          width: '1000px',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <DicomViewer
          id="DicomViewerContainer"
          mode={'quad_view'}
          data={data}
          onShiftClick="goToPoint"
          onCtrlClick="togglMode"
          showDownloadButton={true}
        />
      </div>
    );
  }
}
