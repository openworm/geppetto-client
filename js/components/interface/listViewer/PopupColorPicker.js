import React from 'react';
import reactCSS from 'reactcss';
import { SketchPicker, CompactPicker, SwatchesPicker } from 'react-color';
import BaseIconComponent from './BaseIconComponent';

export default class PopupColorPicker extends React.Component {
  

  constructor (props){
    super(props);
    this.state = {
      displayColorPicker: false,
      color: props.color ? props.color : '#FFFFFF',
    };
    this.Picker = this.props.picker ? this.props.picker : CompactPicker;
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };
  handleChange = color => {
    this.setState({ color: color.hex, displayColorPicker: false });
    this.props.action(color.hex);
  };

  render () {

    const styles = reactCSS({
      'default': {
       container: {
         position: 'relative'
       },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        
      },
    });

    return (
      <div style={ styles.container } >
        <BaseIconComponent action={ this.handleClick } color={ this.state.color } icon="tint" />

        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleClose }/>
          {
             React.createElement(this.Picker, { color: this.state.color, onChange: this.handleChange })
          }
        </div> : null }

      </div>
    )
  }
}