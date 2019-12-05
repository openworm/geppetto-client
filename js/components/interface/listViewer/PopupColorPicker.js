import React from 'react';
import Popover from '@material-ui/core/Popover';
import { SketchPicker, CompactPicker, SwatchesPicker } from 'react-color';
import BaseIconComponent from './BaseIconComponent';

const styles = {
  container: { position: 'relative' },
  popover: {
    anchorOrigin:{
      vertical: 'bottom',
      horizontal: 'center',
    },
    transformOrigin:{
      vertical: 'top',
      horizontal: 'center',
    }
  },
};

export default class PopupColorPicker extends React.Component {
  

  constructor (props){
    super(props);
    this.state = {
      anchorEl: null,
      color: props.color ? props.color : '#FFFFFF',
    };
    this.Picker = this.props.picker ? this.props.picker : CompactPicker;
  }

  handleClick (currentTarget) {
    this.setState({ anchorEl: currentTarget });
  }

  handleClose () {
    this.setState({ anchorEl: null });
  }

  handleChange (color) {
    this.setState({ color: color.hex, anchorEl: null });
    this.props.action(color.hex);
  }
  

  render () {
    const { color, anchorEl } = this.state
    const open = Boolean(anchorEl);
    var container
    
    if (open) {
      const colorPicker = React.createElement(this.Picker, { 
        color, 
        onChange: color => this.handleChange(color) 
      })
      container = (
        <Popover 
          open={open} 
          anchorEl={anchorEl} 
          onClose={() => this.handleClose()}
          anchorOrigin={styles.popover.anchorOrigin}
          transformOrigin={styles.popover.transformOrigin}
        >
          {colorPicker}
        </Popover>
      )
    } else {
      container = null
    }
    
    return (
      <div style={ styles.container } >
        <BaseIconComponent 
          action={e => this.handleClick(e.currentTarget)} 
          color={ color } 
          icon={this.props.icon ? this.props.icon : "tint"}
        />
        { container }
      </div>
    )
  }
}