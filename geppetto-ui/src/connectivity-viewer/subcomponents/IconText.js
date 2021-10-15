import React from 'react';
import Icon from '@material-ui/core/Icon';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  inline: { display: "inline" },
  legend: {
    fontSize: "12px",
    fontWeight: "100",
    color: "white", 
  },
  gridWrapper:{
    display: "grid",
    gridTemplateColumns: "auto auto",
    columnGap: "5px",
    justifyContent: "start",

  },
};

export default withStyles(styles)(({ icon, subtitle, color, width, height, classes }) => (
  <div className={classes.gridWrapper}>
    <Icon className={icon} style={{ background: color, width: width, height: height }} />
    <Typography className={classes.legend} variant="subtitle1" gutterBottom>
      {subtitle}
    </Typography>
  </div>
))