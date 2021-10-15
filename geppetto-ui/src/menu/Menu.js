import React from 'react';
import PropTypes from 'prop-types';
import MenuSection from './MenuSection';

// TODO: these styles are not in line with the new styling principles, currently needed for vfb as 05/20/2020
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
      background: '#11bffe',
      backgroundColor: '#11bffe',
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
    },
  },
  labelsStyle: {
    standard: {
      backgroundColor: '#44414112',
      '&:hover': {
        background: '#11bffe',
        backgroundColor: '#11bffe',
        color: '#ffffff',
      },
      borderRadius: 0,
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'Khand, sans-serif',
      paddingTop: 0,
      paddingBottom: 0,
    },
    hover: {
      background: '#11bffe',
      backgroundColor: '#11bffe',
      '&:hover': {
        background: '#11bffe',
        backgroundColor: '#11bffe',
        color: '#ffffff',
      },
      borderRadius: 0,
      color: '#ffffff',
      fontSize: '14px',
      fontFamily: 'Khand, sans-serif',
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  iconStyle: {
    display: 'inline-block',
    color: '#ffffff',
    minWidth: '25px',
    width: '25px',
  },
};

class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      menuOpen: false,
      sectionOpened: undefined,
    };

    this.menuClick = this.menuClick.bind(this);
    this.menuHandler = this.menuHandler.bind(this);
  }

  menuClick (clicked, index) {
    this.setState({
      menuOpen: clicked,
      sectionOpened: index,
    });
  }

  menuHandler (action) {
    this.setState(
      {
        menuOpen: false,
        sectionOpened: undefined,
      },
      () => {
        if (action !== '') {
          this.props.menuHandler(action);
        }
      }
    );
  }
  componentDidUpdate (prevProps) {
    // We need a way to close the menu on zoom, scroll, right click, etc events on other parts of the application
    if (this.props.open === false && prevProps.open === true) {
      this.menuHandler('');
    }
  }

  render () {
    const buttonsStyle = {
      ...menuStyle.buttonsStyle,
      ...this.props.configuration.global.buttonsStyle,
    };
    const drawersStyle = {
      ...menuStyle.drawersStyle,
      ...this.props.configuration.global.drawersStyle,
    };
    const labelsStyle = {
      ...menuStyle.labelsStyle,
      ...this.props.configuration.global.labelsStyle,
    };
    const iconStyle = {
      ...menuStyle.iconStyle,
      ...this.props.configuration.global.iconStyle,
    };
    const itemOptions = this.props.configuration.itemOptions;

    var buttonsToRender = this.props.configuration.buttons.map(
      (button, index) => (
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
          iconStyle={iconStyle}
          itemOptions={itemOptions}
        />
      )
    );

    return <span>{buttonsToRender}</span>;
  }
}

Menu.propTypes = {
  /**
   * All the required and optional configurations for instantiating a new instance of a Menu
   *
   */
  configuration: PropTypes.shape({
    /**
     * The property button defines the list of buttons the menu will have at the first level
     */
    buttons: PropTypes.arrayOf(
      PropTypes.shape({
        /**
         * Defines the name displayed on the button itself.
         */
        label: PropTypes.string.isRequired,
        /**
         * Defines where the window with the full menu expanded for that button has to appear. this might be one of the
         * following choices: 'bottom-end', 'bottom-start', 'bottom', 'left-end', 'left-start', 'left', 'right-end',
         * 'right-start', 'right', 'top-end', 'top-start', 'top'.
         */
        position: PropTypes.string,
        /**
         * Defines the list of objects that we need to use to populate the 1st level menu
         */
        list: PropTypes.arrayOf(
          PropTypes.shape({
            /**
             * Defines the name displayed on the menu item.
             */
            label: PropTypes.string.isRequired,
            /**
             * Another object that contains handlerAction property, the handlerAction property function triggers when the
             * Menu item associated with it is clicked.
             */
            action: PropTypes.shape({
              /**
               * The name of the action to be triggered when the Menu item is clicked, will be used by the handler function to
               * decide which action has to be executed for this menu item.
               */
              handlerAction: PropTypes.string.isRequired,
              /**
               * Parameters associated with the handlerAction when needed.
               */
              parameters: PropTypes.arrayOf(PropTypes.string.isRequired),
            }).isRequired,
          })
        ).isRequired,
        /**
         * If the property 'list' is not provided we can use the property dynamicListInjector and connect this to the
         * menuHandler to feed this button with a dynamic list created by the menu handler.
         */
        dynamicListInjector: PropTypes.arrayOf(
          PropTypes.shape({
            /**
             * Defines the name displayed on the menu item.
             */
            label: PropTypes.string.isRequired,
            /**
             * Another object that contains handlerAction property, the handlerAction property function triggers when the
             * Menu item associated with it is clicked.
             */
            action: PropTypes.shape({
              /**
               * The name of the action to be triggered when the Menu item is clicked, will be used by the handler function to
               * decide which action has to be executed for this menu item.
               */
              handlerAction: PropTypes.string.isRequired,
              /**
               * Parameters associated with the handlerAction when needed.
               */
              parameters: PropTypes.arrayOf(PropTypes.string.isRequired),
            }),
          })
        ),
      })
    ).isRequired,
  }),
};

export default Menu;
