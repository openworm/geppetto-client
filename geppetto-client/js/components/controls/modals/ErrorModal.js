/**
 * Modal used to display error messages received from server
 *
 */


var React = require('react');
var CreateClass = require('create-react-class');

var GEPPETTO = require('geppetto');
const Resources = require('@geppettoengine/geppetto-core/Resources').default;
   
require("./ErrorModal.less");

const ErrorModal = CreateClass({
  mixins: [
    require('../mixins/bootstrap/modal.js')
  ],
        
  getDefaultProps: function () {
    return {
      title: Resources.ERROR_MODAL_TITLE,
      text: '',
      code: '',
      source: '',
      exception: '',
      githubButton : {
        enabled : true,
        url :  Resources.ERROR_MODAL_NEW_ISSUE_URL
      },
      twitterButton : {
        enabled : true,
        url : Resources.ERROR_MODAL_TWITTER_URL,
        message : Resources.ERROR_MODAL_TWITTER_MESSAGE
      }
    }
  },
    
  // Searches for property in GEPPETTO_CONFIGURATION JSON object, if not found returns undefined.
  getGeppettoConfigurationProperty: function (property) {
    return property.split(".").reduce(function (o, x) {
      return (typeof o == "undefined" || o === null) ? o : o[x];
    }, GEPPETTO_CONFIGURATION);
  },
        
  shareTwitter: function () {
    let urlProperty = this.getGeppettoConfigurationProperty("properties.errorDialog.twitterButton.url");
    let url = ( urlProperty != undefined ? urlProperty : this.props.twitterButton.url)
    let messageProperty = this.getGeppettoConfigurationProperty("properties.errorDialog.twitterButton.message");
    let message = ( messageProperty != undefined ? messageProperty : this.props.twitterButton.message)
    window.open('http://twitter.com/share?url=' + encodeURIComponent(url) + '&text='
        + encodeURIComponent(message), '', 'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
  },
        
  render: function () {
    let twiButProp = (this.getGeppettoConfigurationProperty("properties.errorDialog.twitterButton.enabled") == undefined 
      ? this.props.twitterButton.enabled : this.getGeppettoConfigurationProperty("properties.errorDialog.twitterButton.enabled"));
    let twitterButtonVisible = ( twiButProp ? null : { display: "none" })
    let gitButProp = (this.getGeppettoConfigurationProperty("properties.errorDialog.githubButton.enabled") == undefined 
      ? this.props.githubButton.enabled : this.getGeppettoConfigurationProperty("properties.errorDialog.githubButton.enabled"));
    let githubButtonVisible = ( gitButProp ? null : { display: "none" })
    let confGitURL = this.getGeppettoConfigurationProperty("properties.errorDialog.githubButton.url");
    let githubButtonURL = (confGitURL != undefined ? confGitURL : this.props.githubButton.url)
    let githubMessage = this.getGeppettoConfigurationProperty("properties.errorDialog.message")
    return (
      <div className="modal fade" id="errormodal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header" id="errormodal-header">
              <h3 id="errormodal-title" className="text-center">{this.props.title}</h3>
            </div>
            <div className="modal-body">
              <p id="errormodal-text">
                {githubMessage != undefined ? githubMessage : this.props.message}
              </p>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4 className="panel-title">
                    <a id="error_code" data-toggle="collapse" data-parent="#accordion" href="#collapseOne">{'Details ' + this.props.code}</a>
                  </h4>
                </div>
                <div id="collapseOne" className="panel-collapse collapse">
                  <div className="panel-body">
                    <p id="error_source">{this.props.source}</p>
                    <p id="error_exception">{this.props.exception}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" id="errormodal-footer">
              <button className="btn" onClick={this.shareTwitter} aria-hidden="true" style={twitterButtonVisible}>
                <i className="fa fa-twitter"></i> Shame on you
              </button>
              <a className="btn" href={githubButtonURL} target="_blank" aria-hidden="true" style={githubButtonVisible}>
                <i className="fa fa-bug"></i> Open issue
              </a>
              <button id="errormodal-btn" className="btn" data-dismiss="modal" aria-hidden="true">Close</button>
            </div>
          </div>
        </div>
      </div>    

    );
  }
});

// Compatibility with new imports and old require syntax
ErrorModal.default = ErrorModal;
module.exports = ErrorModal;
