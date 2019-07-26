import React from 'react';
import MenuPopper from './MenuPopper';
import MenuItem from '@material-ui/core/MenuItem';

class MenuSingleItem extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      anchorEl: null,
      subMenuOpened: false,
      sectionOpened: undefined,
    }

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
  }

  handleClick = (event, action) => {
    const { currentTarget } = event;
    this.setState(state => ({ anchorEl: state.anchorEl ? null : currentTarget, }));
    this.props.menuHandler(action);
  };

  handleMouseOver = (event, index) => {
    const { currentTarget } = event;
    if (this.state.sectionOpened !== index) {
      this.setState(state => ({
        anchorEl: currentTarget,
        sectionOpened: index
      }));
    }
  };

  render () {
    const { anchorEl } = this.state;
    const { classes } = this.props;
    var menuToRender = undefined;
    var MenuItemClass = undefined;
    let menuItems = this.props.menuList.map((item, index) => {
      if (item.hasOwnProperty('list')) {
        if ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) {
          menuToRender = (<MenuPopper
            position={item.position}
            menuList={item.list}
            parentRef={anchorEl}
            menuHandler={this.props.menuHandler}
            menuHandlerDirect={this.props.menuHandlerDirect}
            awayClickHandler={this.props.awayClickHandler}
            drawersStyle={this.props.drawersStyle}
            labelsStyle={this.props.labelsStyle}
          />);
          MenuItemClass = this.props.labelsStyle.hover;
        } else {
          menuToRender = undefined;
          MenuItemClass = this.props.labelsStyle.standard;
        }
        return (
          <MenuItem
            id={index}
            key={index}
            onClick={e => {
              this.handleClick(e, item.action)
            }}
            onMouseOver={e => {
              this.handleMouseOver(e, index)
            }}
            ContainerProps={{ menuHandlerDirect: this.props.menuHandlerDirect }}
            style={MenuItemClass}>
            {item.icon !== "" ? <span style={{ display: "inline-block", width: "25px" }}><i className={item.icon}></i></span> : undefined}
            {item.label}
            <i className="fa fa-chevron-right" style={{
              marginLeft: '10px',
              position: 'absolute',
              marginRight: '0px',
              paddingRight: '0px',
              right: '5px'
            }} />
            {menuToRender}
          </MenuItem>
        );
      } else if (item.hasOwnProperty('dynamicListInjector')) {
        if ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) {
          var tempList = this.props.menuHandlerDirect(item.dynamicListInjector);
          menuToRender = (<MenuPopper
            position={item.position}
            menuList={tempList}
            parentRef={anchorEl}
            menuHandler={this.props.menuHandler}
            menuHandlerDirect={this.props.menuHandlerDirect}
            awayClickHandler={this.props.awayClickHandler}
            drawersStyle={this.props.drawersStyle}
            labelsStyle={this.props.labelsStyle}
          />);
          MenuItemClass = this.props.labelsStyle.hover;
        } else {
          menuToRender = undefined;
          MenuItemClass = this.props.labelsStyle.standard;
        }
        return (
          <MenuItem
            id={index}
            key={index}
            onClick={e => {
              this.handleClick(e, item.action)
            }}
            onMouseOver={e => {
              this.handleMouseOver(e, index)
            }}
            ContainerProps={{ menuHandlerDirect: this.props.menuHandlerDirect }}
            style={MenuItemClass}>
            {item.icon !== "" ? <span style={{ display: "inline-block", width: "25px" }}><i className={item.icon}></i></span> : undefined}
            {item.label}
            <i className="fa fa-chevron-right" style={{
              marginLeft: '10px',
              position: 'absolute',
              marginRight: '0px',
              paddingRight: '0px',
              right: '5px'
            }} />
            {menuToRender}
          </MenuItem>
        );
      } else {
        if ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) {
          MenuItemClass = this.props.labelsStyle.hover;
        } else {
          MenuItemClass = this.props.labelsStyle.standard;
        }
        return (
          <MenuItem
            key={index}
            onClick={e => {
              this.handleClick(e, item.action)
            }}
            onMouseOver={e => {
              this.handleMouseOver(e, index)
            }}
            ContainerProps={{ menuHandlerDirect: this.props.menuHandlerDirect }}
            menuaction={item.action}
            style={MenuItemClass}
          >
            {item.icon !== ""
              ? <span style={{ display: "inline-block", width: "25px" }}>
                <i className={item.icon}></i>
              </span>
              : undefined}
            {item.label}
          </MenuItem>
        );
      }
    });

    return (
      <React.Fragment>
        {menuItems}
      </React.Fragment>
    );
  }
}

export default MenuSingleItem;
