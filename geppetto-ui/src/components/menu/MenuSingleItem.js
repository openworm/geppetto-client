import React from 'react';
import MenuPopper from './MenuPopper';
import MenuItem from '@material-ui/core/MenuItem';

class MenuSingleItem extends React.Component {
  constructor(props) {
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

  renderArrow() {
    const { customArrow } = this.props;
    return customArrow ?
      customArrow :
      <i className="fa fa-chevron-right" style={{
        marginLeft: '10px',
        position: 'absolute',
        marginRight: '0px',
        paddingRight: '0px',
        right: '5px'
      }}
      />
  }

  renderMenuItem(item, index) {
    if(!item.label){
      return <React.Fragment key={index}>{item}</React.Fragment>; // Free markup, e.g. for dividers
    }
    const { anchorEl } = this.state;
    const { classes } = this.props;
    var menuToRender = undefined;
    var MenuItemClass = anchorEl && index === Number(this.state.sectionOpened) ? this.props.labelsStyle.hover : this.props.labelsStyle.standard;
    const { action, icon, ...others } = item;



    if (anchorEl && index === Number(this.state.sectionOpened)) {
      var tempList = item.list ? item.list :
        item.dynamicListInjector ? this.props.menuHandlerDirect(item.dynamicListInjector) :
          null;
      if (tempList) {
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
      }

    }

    return (
      <MenuItem
        key={index}
        id={item.label}
        onClick={e => {
          this.handleClick(e, item.action)
        }}
        onMouseOver={e => {
          this.handleMouseOver(e, index)
        }}
        ContainerProps={{ menuHandlerDirect: this.props.menuHandlerDirect }}
        menuaction={item.action}
        style={MenuItemClass}
        {...others}
      >
        {item.icon !== ""
          ? <span style={{ display: "inline-block", width: "25px" }}>
            <i className={item.icon}></i>
          </span>
          : undefined}
        {item.label}
        {item.list || item.dynamicListInjector ? <React.Fragment>{this.renderArrow()}{menuToRender}</React.Fragment> : ''}
      </MenuItem>
    );
  }



  render() {


    let menuItems = this.props.menuList.map((item, index) => this.renderMenuItem(item, index));

    return (
      <React.Fragment>
        {menuItems}
      </React.Fragment>
    );
  }
}

export default MenuSingleItem;
