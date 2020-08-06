import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './CameraControls.less';

export const cameraControlsActions = {
    PAN_LEFT: "panLeft",
    PAN_UP: "panUp",
    PAN_RIGHT: "panRight",
    PAN_DOWN: "panDown",
    CAMERA_HOME: "panLeft",
    ROTATE_LEFT: "rotateLeft",
    ROTATE_UP: "rotateUp",
    ROTATE_RIGHT: "rotateRight",
    ROTATE_DOWN: "rotateDown",
    ROTATE_Z: "rotateZ",
    ROTATE_MZ: "rotateMZ",
    ROTATE: "rotate",
    ZOOM_IN: "zoomIn",
    ZOOM_OUT: "zoomOut",
    WIREFRAME: "wireframe",

}

export default class CameraControls extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { cameraControlsHandler, wireframeEnabled } = this.props;
        return (
            <div className="position-toolbar">
                <button className="btn squareB fa fa-chevron-left pan-left" onClick={() => cameraControlsHandler(cameraControlsActions.PAN_LEFT)}></button>
                <button className="btn squareB fa fa-chevron-up pan-top" onClick={() => cameraControlsHandler(cameraControlsActions.PAN_UP)}></button>
                <button className="btn squareB fa fa-chevron-right pan-right" onClick={() => cameraControlsHandler(cameraControlsActions.PAN_RIGHT)}></button>
                <button className="btn squareB fa fa-chevron-down pan-bottom" onClick={() => cameraControlsHandler(cameraControlsActions.PAN_DOWN)}></button>
                <button className="btn squareB fa fa-home pan-home" onClick={() => cameraControlsHandler(cameraControlsActions.PAN_DOWN)}></button>

                <button className="btn squareB fa fa-undo rotate-left" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_LEFT)}></button>
                <button className="btn squareB fa fa-repeat rotate90 rotate-top" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_UP)}></button>
                <button className="btn squareB fa fa-repeat rotate-right" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_RIGHT)}></button>
                <button className="btn squareB fa fa-undo rotate90 rotate-bottom" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_DOWN)}></button>
                <button className="btn squareB fa fa-undo rotate-z" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_Z)}></button>
                <button className="btn squareB fa fa-repeat rotate-mz" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE_MZ)}></button>
                <button className="btn squareB fa fa-video-camera rotate-home" onClick={() => cameraControlsHandler(cameraControlsActions.ROTATE)}></button>

                <button className="btn squareB fa fa-search-plus zoom-in" onClick={() => cameraControlsHandler(cameraControlsActions.ZOOM_IN)}></button>
                <button className="btn squareB fa fa-search-minus zoom-out" onClick={() => cameraControlsHandler(cameraControlsActions.ZOOM_OUT)}></button>
                {wireframeEnabled ? <button className="btn squareB gpt-sphere_wireframe-jpg wireframe" onClick={() => cameraControlsHandler(cameraControlsActions.WIREFRAME)}></button> : undefined}
            </div>
        )
    }
}

CameraControls.defaultProps = {

    wireframeEnabled: false,
};

CameraControls.propTypes = {
    /**
     * Function to callback on camera controls changes
     */
    cameraControlsHandler: PropTypes.func.isRequired,

    /**
   * Boolean to enable/disable wireframe
   */
    wireframeEnabled: PropTypes.bool,

};

