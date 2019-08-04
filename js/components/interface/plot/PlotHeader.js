import React, { Component } from 'react'
import Icon from '@material-ui/core/Icon';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core';

const anchor = {
  origin: {
    vertical: 'bottom',
    horizontal: 'center',
  },

  transform: {
    vertical: 'top',
    horizontal: 'center',
  },

}

const style = { 
  dropDownItem: {
    paddingTop: "2px",
    paddingBottom: "2px"
  },
  headerContainer: { 
    height: "16px",
    width: "100%"
  },

  tooltip: { fontSize: "12px" }
}

class PlotHeader extends Component {
  state = { openHeaderIconOptions: null }

  render (){
    const { headerIcons, classes } = this.props
    const { openHeaderIconOptions } = this.state
    
    const { className = '' } = openHeaderIconOptions ? openHeaderIconOptions : {};
    const headerIcon = headerIcons.find(iconElement => className.includes(iconElement.icon))

    return (
      <div className={classes.headerContainer}>
        {headerIcons.map(({ icon, action, options, tooltip }) => (
          <Tooltip key={tooltip} title={tooltip} placement="bottom" enterDelay={300} classes={{ tooltip: classes.tooltip }}>
            <Icon 
              className={'widget-title-bar-button ' + icon}
              style={{ cursor: "pointer", fontSize: "15px", width: "16px" }}
              onClick={options ? e => this.setState({ openHeaderIconOptions: e.currentTarget }) : action}
            />
          </Tooltip>
        ))}
        <Popover
          anchorOrigin={anchor.origin}
          anchorEl={openHeaderIconOptions}
          transformOrigin={anchor.transform}
          open={Boolean(openHeaderIconOptions)}
          onClose={() => this.setState({ openHeaderIconOptions: null })}
          
        >
          {headerIcon && headerIcon.options.map(headerIconOption => 
            <MenuItem
              key={headerIconOption}
              className={classes.dropDownItem}
              onClick={() => {
                headerIcon.action(headerIconOption)
                this.setState({ openHeaderIconOptions: null })
              }}
            >
              {headerIconOption}
            </MenuItem>
          )}
        </Popover>
      </div>
    )
  }
}

export default withStyles(style)(PlotHeader)