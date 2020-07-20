import React from 'react';
import MenuPopper from './MenuPopper';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';

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

  renderArrow () {
    const { customArrow } = this.props;
    return customArrow
      ? customArrow
      : <i className="fa fa-chevron-right" style={{
        marginLeft: '10px',
        position: 'absolute',
        marginRight: '0px',
        paddingRight: '0px',
        right: '5px'
      }}
      />
  }

  renderMenuItem (item, index) {
    if (!item.label){
      return <React.Fragment key={index}>{item}</React.Fragment>; // Free markup, e.g. for dividers
    }
    const { anchorEl } = this.state;
    const { labelsStyle } = this.props;
    const { iconStyle } = this.props;
    var menuToRender = undefined;
    

    const { action, icon, trailerIcon, style, ...others } = item;
    const mergedStyle = { ...labelsStyle, ...style, hover: { ...labelsStyle?.hover, ...style?.hover }, standard: { ...labelsStyle?.standard, ...style?.standard } }
    const appliedStyle = anchorEl && index === Number(this.state.sectionOpened) ? mergedStyle.hover : mergedStyle.standard;

    if (anchorEl && index === Number(this.state.sectionOpened)) {
      var tempList = item.list ? item.list
        : item.dynamicListInjector ? this.props.menuHandlerDirect(item.dynamicListInjector)
          : null;
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
          iconStyle={this.props.iconStyle}
          itemOptions={{ customArrow: this.props.customArrow }}
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
        style={appliedStyle}
        {...others}
      >
        {item.icon
          ? <ListItemIcon style={ iconStyle }>
            <i className={item.icon}></i>
          </ListItemIcon>
          : undefined}
        <span className="menu-item-label">
          {item.label}
          {item.trailerIcon
            ? <i style={{ marginLeft: "5px" }} className={item.trailerIcon}></i>
            : undefined}
        </span>
        
        {item.list || item.dynamicListInjector ? <React.Fragment>{this.renderArrow()}{menuToRender}</React.Fragment> : ''}
      </MenuItem>
    );
  }


  render () {


    let menuItems = this.props.menuList.map((item, index) => this.renderMenuItem(item, index));

    return (
      <React.Fragment>
        {menuItems}
      </React.Fragment>
    );
  }
}

export default MenuSingleItem;
