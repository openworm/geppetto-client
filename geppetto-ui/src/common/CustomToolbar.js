import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButtonWithTooltip from "./IconButtonWithTooltip";
import Toolbar from "@material-ui/core/Toolbar";

const styles = theme => ({
  toolbar: {
    padding: theme.spacing(0),
    marginLeft: theme.spacing(1)
  },
  button: {
    padding: theme.spacing(1),
    top: theme.spacing(0),
    color: theme.palette.button.main
  },
  toolbarBox: { backgroundColor: theme.palette.toolbarBackground.main },
});


class CustomToolbar extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    const { classes, buttons, elements } = this.props;
    const customButtons = buttons ? buttons : [];
    const customElements = elements ? elements : [];
    return (
      <div>
        <Toolbar className={classes.toolbar}>
          <div className={classes.toolbarBox}>
            {customButtons.map(customButton =>
              <IconButtonWithTooltip
                key={customButton.id}
                disabled={false}
                onClick={() => customButton.action()}
                className={classes.button}
                tooltip={customButton.tooltip}
                icon={customButton.icon}
              />
            )}
            {customElements.map(customElement =>
              customElement
            )}
          </div>
        </Toolbar>
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(CustomToolbar);