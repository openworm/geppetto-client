
import React from 'react';

import Loader from '@geppettoengine/geppetto-ui/loader/Loader';

export default class LoadingSpinner extends React.Component{

  /**
   * Legacy way to hide the spinner
   */
  hideSpinner (){
    this.props.hideSpinner();
  }
  
  /**
   * Legacy way to show the spinner
   * @param {} label 
   */
  showSpinner (label){
    this.props.showSpinner(label);
  }

  componentDidMount (){
    GEPPETTO.Spinner = this;
  }

  render () {
    const { spinner } = this.props;
      

    return (
      <Loader
        active={Object.values(spinner).length !== 0}
        handleClose={this.handleClose}
        messages={Object.values(spinner)}
        fullscreen={true}
      />
    );
  }
    
            
}

