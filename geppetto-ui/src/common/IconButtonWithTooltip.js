import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const styles = { lightTooltip: { fontSize: 12, }, };

export default withStyles(styles)(({ onClick, tooltip, disabled, className, classes, icon }) => (
  <Tooltip
    title={tooltip}
    placement="left"
    disableFocusListener
    disableTouchListener
    classes={{ tooltip: classes.lightTooltip }}
  >
    <IconButton
      disabled={disabled}
      onClick={event => onClick(event)}
      className={className}
      disableRipple
    >
      {icon != null
        && <FontAwesomeIcon icon={icon} className={" fa-xs "} />
      }
    </IconButton>
  </Tooltip>
))