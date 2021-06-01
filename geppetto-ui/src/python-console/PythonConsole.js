/**
 * React component for displaying a Python console.
 *
 * @author Adrian Quintana (adrian@metacell.us)
 * @author Dario Del Piano
 */
define(function (require) {
  var React = require('react');
  var CreateClass = require('create-react-class');
  var { CircularProgress } = require('@material-ui/core')
  require('./PythonConsole.less');
  // $.widget.bridge('uitooltip', $.ui.tooltip);


  return CreateClass({
    getInitialState: function () {
      return { loading: true };
    },

    UNSAFE_componentWillReceiveProps: function (nextProps) {
      if (nextProps.extensionLoaded && nextProps.extensionLoaded !== this.props.extensionLoaded) {
        this.setState({ loading: false });
      }
    },

    render: function () {

      return (
        <div className="col-lg-6 panel-body" id="pythonConsoleOutput">
          <iframe id="pythonConsoleFrame" src={this.props["pythonNotebookPath"]} marginWidth="0"
            marginHeight="0" frameBorder="no" scrolling="yes"
            allowtransparency="true"
            style={{
              width:'100%',
              visibility: this.state.loading ? "hidden" : "visible",
              height:this.props.iframeHeight + 'px' 
            }}>
          </iframe>
          {this.state.loading && <CircularProgress 
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, margin: 'auto' }}
          />}
        </div>
      );
    }
  });
});
