import React from 'react';
import MenuSingleItem from './MenuSingleItem';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

class MenuPopper extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    const anchorEl = this.props.parentRef;
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : null;

    if (anchorEl !== undefined || anchorEl !== null) {
      return (<Popper id={id} open={open} anchorEl={anchorEl} placement={String((this.props.position !== undefined) ? this.props.position : "right-start")} transition>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={50}>
            <React.Fragment>
              <ClickAwayListener onClickAway={this.props.awayClickHandler}>
                <Paper
                  style={this.props.drawersStyle.standard}
                  square={false}>
                  <MenuList>
                    <MenuSingleItem
                      position={this.props.position}
                      parentRef={anchorEl}
                      menuList={this.props.menuList}
                      menuHandler={this.props.menuHandler}
                      menuHandlerDirect={this.props.menuHandlerDirect}
                      awayClickHandler={this.props.awayClickHandler}
                      drawersStyle={this.props.drawersStyle}
                      labelsStyle={this.props.labelsStyle}
                      iconStyle={this.props.iconStyle}
                      {...this.props.itemOptions}
                    />
                  </MenuList>
                </Paper>
              </ClickAwayListener>
            </React.Fragment>
          </Fade>
        )}
      </Popper>);
    } else {
      return (
        <span></span>
      );
    }
  }
}

export default MenuPopper;
