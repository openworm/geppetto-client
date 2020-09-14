import React from 'react';
import { plugins, ColumnDefinition, RowDefinition } from 'griddle-react';
import Griddle from './utils/Griddle'
import BaseIconComponent from './BaseIconComponent';

import PopupColorPicker from './PopupColorPicker';
import './listviewer.less';
import { mapToObject, mapSourceToRow, extractGriddleData, isString } from './utils';

/**
 * Allows to group multiple components in a single column
 * @param {*} conf 
 */
export const GroupComponent = conf => ({ value }) => conf.map(
  ({ id, customComponent, configuration, source, visible }) => {

    if (value.get) { // is a map coming from griddle. instanceof Map does not work here
      value = mapToObject(value);
    }
    if (visible !== undefined) {
      const isVisible = visible instanceof Function ? visible(value) : visible;
      if (!isVisible) {
        return '';
      }
    }

    if (!customComponent) {
      customComponent = WrapperComponent;
    }
    if (configuration) {
      customComponent = customComponent(configuration);
    }
    const componentValue = source ? mapSourceToRow(source, value) : value;

    return React.createElement(customComponent, { key: id, value: componentValue });
  }

);


/**
 * Shows a fontAwesome icon. Allows an action to be specified
 * @param { icon, action, color, tooltip } 
 */
export const IconComponent = ({ icon, action, color, tooltip }) =>
  ({ value }) =>
    <BaseIconComponent
      color={color}
      title={tooltip}
      action={() => action(value)}
      icon={icon} />;


export const MultiStatusComponent = availableStatuses => class Comp extends React.Component {
  constructor (props) {
    super(props);
    // State contains the index of a circular list
    this.state = { statusIdx: 0 };
    this.value = props.value;
  }


  render () {
    const { statusIdx } = this.state;

    const { tooltip, icon, action, color } = availableStatuses[this.state.statusIdx];

    return <BaseIconComponent
      color={color}
      title={tooltip}
      action={() => {
        this.setState({ statusIdx: statusIdx + 1 < availableStatuses.length ? statusIdx + 1 : 0 });
        action(this.value);
      }}
      icon={icon} />;

  }
};

/**
 * Wraps a component implementing a click action on it.
 * @param {*} action 
 * @param {*} customComponent 
 */
export const WrapperComponent = (action, customComponent) => ({ value }) =>
  (<span onClick={() => action(value)}>{customComponent ? React.createElement(customComponent, { value: value }) : value}
  </span>);

/**
 * Shows an image from the data field. If the data field has no value, a default image is shown instead.
 * 
 * @param { title, alt, defaultImg, action } configuration
 */
export const ImageComponent = ({ title, alt, defaultImg, action }) =>
  ({ value }) =>
    <img src={value ? value : defaultImg}
      title={title}
      alt={alt ? alt : title}
      onClick={() => action(value)}
      className="thumbnail-img" />;

/**
 * Allows to specify an input field.
 * 
 * The value can be processed on the onBlur action
 * 
 * @param { placeholder, onBlur, onKeyPress, readOnly, classString, unit, defaultValue } configuration
 */
export const ParameterInputComponent = ({ placeholder, onBlur, onKeyPress, readOnly, classString, unit, defaultValue }) => ({ value }) =>
  <React.Fragment>
    <input
      placeholder={placeholder}
      defaultValue={defaultValue instanceof Function ? defaultValue(value) : defaultValue}
      onBlur={evt => onBlur(value, evt.target.value)}
      onKeyPress={evt => onKeyPress(value, evt.target.value)}
      className={classString}
      title=""
      readOnly={readOnly} />
    <span className="control-panel-parameter-unit">{unit}</span>
  </React.Fragment>;


export const ColorComponent = ({ action, defaultColor, icon }) => ({ value }) =>
  <React.Fragment>
    <PopupColorPicker
      color={isString(defaultColor) ? defaultColor : defaultColor(value)}
      action={hex => action({ ...(isString(value) ? { path: value } : value), color: hex })}
      icon={icon}
    />
  </React.Fragment>;
/**
 * Shows the data value as a link
 */
export const LinkComponent = ({ text }) => ({ value }) => <a href={value} target="_blank" rel="noopener noreferrer">{text ? text : value}</a>;


export const defaultColumnConfiguration = [
  {
    id: "path",
    title: "Path",
    source: 'path',
  },
  {
    id: "metaType",
    title: "Meta Type",
    source: 'metaType',
  },
  {
    id: "type",
    title: "Type",
    source: 'type',
  },
];


export default class ListViewer extends React.Component {

  builtInComponents = { GroupComponent, IconComponent, WrapperComponent, LinkComponent, ImageComponent }

  constructor (props, context) {
    super(props, context);
    this.preprocessColumnConfiguration = this.preprocessColumnConfiguration.bind(this);
    this.handlerObject = this.props.handler;

  }

  getColumnConfiguration () {
    return this.preprocessColumnConfiguration(
      this.props.columnConfiguration !== undefined
        ? this.props.columnConfiguration
        : defaultColumnConfiguration
    );
  }

  getData () {
    return extractGriddleData(this.props.filter
      ? this.props.instances.filter(this.props.filter)
      : this.props.instances, this.getColumnConfiguration());
  }

  /**
   * Parses the configuration for further processing, inserting defaults and adjusting types
   * @param {id, action, customComponent, configuration} colConf 
   */
  preprocessColumnConfiguration (conf) {
    if (this.incrementalId === undefined) {
      this.incrementalId = 0;
    }
    if (conf instanceof Array) {
      return conf.map(this.preprocessColumnConfiguration);
    }

    if (conf.configuration && !conf.customComponent) {
      console.warn("Configuration was specified for column", conf.id, "but no customComponent was specified.");
    }

    return {
      ...conf,
      id: conf.id ? conf.id : this.incrementalId++,
      action: conf.action === undefined ? undefined : this.preprocessAction(conf.action),
      onBlur: conf.onBlur === undefined ? undefined : this.preprocessAction(conf.onBlur),
      onChange: conf.onChange === undefined ? undefined : this.preprocessAction(conf.onChange),
      onKeyPress: conf.onKeyPress === undefined ? undefined : this.preprocessAction(conf.onKeyPress),
      customComponent: conf.customComponent === undefined ? undefined : this.preprocessComponent(conf.customComponent),
      configuration: conf.configuration === undefined ? undefined : this.preprocessColumnConfiguration(conf.configuration)
    };

  }

  preprocessAction (action) {
    if (isString(action)) {
      if (!this.handlerObject[action]) {
        throw new Error('Bad ListViewer configuration: the function ' + action + ' is not defined in the specified handler ' + this.handlerObject);
      }
      return entity => this.handlerObject[action](entity);
    } else {
      return action.bind(this.handlerObject);
    }
  }

  preprocessComponent (customComponent) {
    if (isString(customComponent)) {
      if (this.builtInComponents[customComponent]) {
        return this.builtInComponents[customComponent];
      } else if (window[customComponent]) {
        return window[customComponent];
      } else {
        throw new Error('ListViewer configuration error: ' + customComponent + ' not defined. Try attach to the global (window) context or pass the imported object instead.');
      }
    }
    return customComponent;
  }

  getFilterFn () {
    return this.props.filterFn ? this.props.filterFn : () => true;
  }

  /**
   * <ColumnDefinition key="path" id="path" customComponent={CustomColumn} />,
   * <ColumnDefinition key="controls" id="actions" customHeadingComponent={CustomHeading} customComponent={CustomActions(buttonsConf)} />
   * @param {*} param0 
   */
  getColumnDefinition (conf) {
    let { id, customComponent, configuration, action } = conf;

    if (configuration && customComponent) {
      customComponent = customComponent(configuration);
    }

    if (action && !customComponent) {
      customComponent = WrapperComponent(action, customComponent);
    }

    return React.createElement(ColumnDefinition, { ...conf, key: id, configuration: undefined, customComponent: customComponent, source: undefined });
  }

  getColumnDefinitions () {
    return this.getColumnConfiguration().map(colConf => this.getColumnDefinition(colConf));
  }

  getLayout () {
    if (this.props.layout) {
      return this.props.layout;
    }
    return ({ Table, Pagination, Filter, SettingsWrapper }) => (<div className="listviewer-container">
      <Filter />
      <Table />
      <Pagination />
    </div>);
  }

  getPlugins () {
    const { remoteInfiniteScroll = false, plugins: extraPlugins = [] } = this.props
    if (remoteInfiniteScroll) {
      return [plugins.PositionPlugin({ disablePointerEvents: true }), ...extraPlugins]
    }
    return this.props.infiniteScroll
      ? [plugins.LocalPlugin, plugins.PositionPlugin({ disablePointerEvents: true }), ...extraPlugins]
      : [plugins.LocalPlugin, ...extraPlugins]
  }

  render () {
    const customComponents = this.props.customComponents ? this.props.customComponents : {}
    const { events, ...others } = this.props
    return <section className="listviewer">
      <Griddle
        data={this.getData()}
        plugins={this.getPlugins()}
        components={{ Layout: this.getLayout(), ...customComponents }}
        events={{ ...events }}
      >
        <RowDefinition>
          {
            this.getColumnDefinitions()
          }
        </RowDefinition>
      </Griddle>
    </section>;
  }


}
