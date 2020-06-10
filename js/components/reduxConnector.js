import { connect } from "react-redux";
import {
  controlPanelOpen,
  controlPanelClose,
  showSpinner,
  spinLogo,
  stopLogo,
  spinPersist,
  spotlightClosed,
  spotlightLoaded,
  startTutorial,
  updateCamera,
} from '../common/actions/actions';

import _Canvas from './interface/3dCanvas/Canvas';
export const Canvas = connect(
  (state, ownProps) => ({
    id: ownProps.id,
    name: ownProps.name,
    style: ownProps.style,
    baseZoom: ownProps.baseZoom,
    wireframeEnabled: ownProps.wireframeEnabled,
    hideCameraControls: ownProps.hideCameraControls,
    geppettoInstances: state.client.instances,
    latestUpdate: state.client.components.canvas.latestUpdate,
  }),
  dispatch => ({ updateCamera: () => dispatch(updateCamera()) }),
  null,
  { withRef: true }
)(_Canvas);

import _Console from './interface/console/Console';
export const Console = connect(
  (state, ownProps) => ({
    id: ownProps.id,
    settings: ownProps.settings,
    log_mode: state.client.logs.mode,
    log_message: state.client.logs.message,
    log_timestamp: state.client.logs.timestamp,
  }),
  null,
  null,
  { withRef: true }
)(_Console);

import _ControlPanel from './interface/controlPanel/controlpanel';
export const ControlPanel = connect(
  (state, ownProps) => ({
    icon: ownProps.icon,
    enableInfiniteScroll: ownProps.enableInfiniteScroll,
    useBuiltInFilters: ownProps.useBuiltInFilters,
    resultsPerPage: ownProps.resultsPerPage,
    enablePagination: ownProps.enablePagination,
    showMenuButton: ownProps.showMenuButton,
    menuButtonItems: ownProps.menuButtonItems,
    showClose: ownProps.showClose,
    menuButtonClickHandler: ownProps.menuButtonClickHandler,
    listenToInstanceCreationEvents: ownProps.listenToInstanceCreationEvents,
    projectStatus: state.client.project.status,
    projectSaved: state.client.project.properties.properties_saved,
    experimentSaved: state.client.experiment.properties.properties_saved,
    parametersSet: state.client.experiment.properties.parameters_set,
    geppettoInstances: state.client.instances,
  }),
  dispatch => ({
    controlPanelOpen: () => dispatch(controlPanelOpen()),
    controlPanelClose: () => dispatch(controlPanelClose()),
  }),
  null,
  { withRef: true }
)(_ControlPanel);

import _ExperimentControls from './interface/simulationControls/ExperimentControls';
export const SimulationControls = connect(
  (state, ownProps) => ({
    runConfiguration: ownProps.runConfiguration,
    hideHelp: ownProps.hideHelp,
    hideRun: ownProps.hideRun,
    hidePlay: ownProps.hidePlay,
    hidePause: ownProps.hidePause,
    hideStop: ownProps.hideStop,
    controlsDisabled: state.client.controls_disabled,
    experimentId: state.client.experiment.id,
    experimentStatus: state.client.experiment.status,
    projectStatus: state.client.project.status,
  }),
  null
)(_ExperimentControls);

import _ExperimentsTable from './interface/experimentsTable/ExperimentsTable';
export const ExperimentsTable = connect(
  (state, ownProps) => ({
    experimentStatus: state.client.experiment.status,
    projectStatus: state.client.project.status,
  }),
  dispatch => ({ showSpinner: message => dispatch(showSpinner(message)) }),
  null,
  { withRef: true }
)(_ExperimentsTable);

import _HelpButton from './interface/simulationControls/buttons/HelpButton';
export const HelpButton = connect(
  (state, ownProps) => ({
    id: ownProps.id,
    icon: ownProps.icon,
    label: ownProps.label,
    className: ownProps.className,
    helpVisible: state.client.components.help.visible,
    projectStatus: state.client.project.status,
  }),
  null,
  null,
  { withRef: true }
)(_HelpButton);

import _HelpModal from './interface/simulationControls/HelpModal';
export const HelpModal = connect(
  null,
  dispatch => ({ startTutorial: message => dispatch(startTutorial()) }),
  null,
  { withRef: true }
)(_HelpModal);

import _LoadingSpinner from './interface/loadingSpinner/LoadingSpinner';
export const LoadingSpinner = connect(
  (state, ownProps) => ({
    spinnerMessage: state.client.components.spinner.message,
    spinnerVisible: state.client.components.spinner.visible,
  }),
  null,
  null,
  { withRef: true }
)(_LoadingSpinner);


import _Logo from './interface/logo/Logo';
export const Logo = connect(
  (state, ownProps) => ({
    logo: ownProps.logo,
    logoSpinning: state.client.components.logo.running,
  }),
  null,
  null,
  { withRef: true }
)(_Logo);

import _PythonConsole from './interface/pythonConsole/PythonConsole';
export const PythonConsole = connect(
  (state, ownProps) => ({
    iframeHeight: ownProps.iframeHeight,
    pythonNotebookPath: ownProps.pythonNotebookPath,
    extensionLoaded: state.client.jupyter_geppetto_extension.loaded,
  }),
  null,
  null,
  { withRef: true }
)(_PythonConsole);

import _SaveControl from './interface/save/SaveControl';
export const SaveControl = connect(
  (state, ownProps) => ({
    projectStatus: state.client.project.status,
    spinPersistRunning: state.client.components.persist_spinner.running,
  }),
  dispatch => ({ spinPersist: message => dispatch(spinPersist()) }),
  null,
  { withRef: true }
)(_SaveControl);

import _SlideshowImageComponent from './interface/query/customComponents/slideshowImageComponent';
export const SlideshowImageComponent = connect(
  (state, ownProps) => ({
    data: ownProps.data,
    rowData: ownProps.rowData,
    metadata: ownProps.metadata,
    geppettoInstances: state.client.instances,
  }),
  null,
  null,
  { withRef: true }
)(_SlideshowImageComponent);

import _Spotlight from './interface/spotlight/spotlight';
export const Spotlight = connect(
  (state, ownProps) => ({
    icon: ownProps.icon,
    modelStatus: state.client.model.status,
    projectStatus: state.client.project.status,
    experimentId: state.client.experiment.id,
    experimentStatus: state.client.experiment.status,
    geppettoInstances: state.client.instances,
  }),
  dispatch => ({
    spotlightClosed: () => dispatch(spotlightClosed()),
    spotlightLoaded: () => dispatch(spotlightLoaded()),
  }),
  null,
  { withRef: true }
)(_Spotlight);

import _SpotlightButton from './interface/foregroundControls/buttons/SpotlightButton';
export const SpotlightButton = connect(
  null,
  dispatch => ({
    spinLogo: () => dispatch(spinLogo()),
    stopLogo: () => dispatch(stopLogo()),
  }),
  null,
  { withRef: true }
)(_SpotlightButton);

import _Tutorial from './interface/tutorial/Tutorial';
export const Tutorial = connect(
  (state, ownProps) => ({
    closeHandler: ownProps.closeHandler,
    tutorialData: ownProps.tutorialData,
    closeByDefault: ownProps.closeByDefault,
    showMemoryCheckbox: ownProps.showMemoryCheckbox,
    tutorialsList: ownProps.tutorialsList,
    tutorialMessageClass: ownProps.tutorialMessageClass,
    tutorialURL: ownProps.tutorialURL,
    modelStatus: state.client.model.status,
    tutorialVisible: state.client.components.tutorial.visible,
  }),
  null,
  null,
  { withRef: true }
)(_Tutorial);
