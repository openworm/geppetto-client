import React from 'react';
import PropTypes from 'prop-types';
import MenuSection from './MenuSection';

const menuStyle = {
  buttonsStyle: {
    standard: {
      background: '#010101',
      borderRadius: 0,
      border: 0,
      boxShadow: '0px 0px',
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Khand, sans-serif',
      margin: '0px 0px 0px 0px',
      minWidth: '44px',
      height: '30px',
      textTransform: 'capitalize',
      textAlign: 'left',
      justifyContent: 'start',
      marginTop: '1px',
    },
    hover: {
      background: "#11bffe",
      backgroundColor: "#11bffe",
      borderRadius: 0,
      border: 0,
      boxShadow: '0px 0px',
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Khand, sans-serif',
      margin: '0px 0px 0px 0px',
      minWidth: '44px',
      height: '30px',
      textTransform: 'capitalize',
      textAlign: 'left',
      justifyContent: 'start',
      marginTop: '1px'
    }
  },
  drawersStyle: {
    standard: {
      top: '1px',
      backgroundColor: '#444141f2',
      borderRadius: 0,
      color: '#ffffff',
      fontSize: '12px',
      fontFamily: 'Khand, sans-serif',
      minWidth: '110px',
      borderLeft: '1px solid #585858',
      borderRight: '1px solid #585858',
      borderBottom: '1px solid #585858',
      borderBottomLeftRadius: '2px',
      borderBottomRightRadius: '2px',
    }
  },
  labelsStyle: {
    standard: {
      backgroundColor: '#44414112',
      "&:hover": {
        background: "#11bffe",
        backgroundColor: "#11bffe",
        color: '#ffffff'
      },
      borderRadius: 0,
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'Khand, sans-serif',
      paddingTop: 0,
      paddingBottom: 0,
    },
    hover: {
      background: "#11bffe",
      backgroundColor: "#11bffe",
      "&:hover": {
        background: "#11bffe",
        backgroundColor: "#11bffe",
        color: '#ffffff'
      },
      borderRadius: 0,
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'Khand, sans-serif',
      paddingTop: 0,
      paddingBottom: 0,
    }
  }
};

class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      menuOpen: false,
      sectionOpened: undefined
    }

    this.menuClick = this.menuClick.bind(this);
    this.menuHandler = this.menuHandler.bind(this);
  }

  menuClick (clicked, index) {
    this.setState({
      menuOpen: clicked,
      sectionOpened: index
    });
  }

  menuHandler (action) {
    this.setState({
      menuOpen: false,
      sectionOpened: undefined
    }, () => {
      if (action !== "") {
        this.props.menuHandler(action)
      }
    });
  }

  render () {


    const buttonsStyle = {...menuStyle.buttonsStyle, ...this.props.configuration.global.buttonsStyle};
    const drawersStyle = {...menuStyle.drawersStyle, ...this.props.configuration.global.drawersStyle};
    const labelsStyle = {...menuStyle.labelsStyle, ...this.props.configuration.global.labelsStyle};
    const itemOptions = this.props.configuration.itemOptions;

    var buttonsToRender = this.props.configuration.buttons.map((button, index) => (
      <MenuSection
        id={index}
        key={index}
        button={button}
        list={button.list}
        menuHandler={this.menuHandler}
        menuHandlerDirect={this.props.menuHandler}
        menuClickHandler={this.menuClick}
        menuOpen={this.state.menuOpen}
        sectionOpened={this.state.sectionOpened}
        buttonsStyle={buttonsStyle}
        drawersStyle={drawersStyle}
        labelsStyle={labelsStyle}
        itemOptions={itemOptions}
      />
    ));

    return (
      <span>
        {buttonsToRender}
      </span>
    );
  }
}

Menu.propTypes = {
  configuration: PropTypes.object.isRequired,
  menuHandler: PropTypes.func.isRequired
};

export default Menu;
