import React from 'react';
import Griddle, { plugins, ColumnDefinition, RowDefinition } from 'griddle-react';
import BaseIconComponent from './BaseIconComponent';

import PopupColorPicker from './PopupColorPicker';
import './listviewer.less';


function mapToObject ( aMap ) {
  const obj = {};
  aMap.forEach ((v,k) => {
    obj[k] = v 
  });
  return obj;
}

/**
 * Allows to group multiple components in a single column
 * @param {*} conf 
 */
export const GroupComponent = conf => ({ value }) => conf.map(
  ({ id, customComponent, configuration, source }) => {
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
export const IconComponent = ({ icon, action, color, tooltip, condition = value => true }) => 
  ({ value }) => 
    condition(value) ? <BaseIconComponent 
      color = {color} 
      title={tooltip}
      action={() => action(value)}
      icon={icon} />
      : ''


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
      color = {color} 
      title={tooltip}
      action={() => {
        this.setState({ statusIdx: statusIdx + 1 < availableStatuses.length ? statusIdx + 1 : 0 });
        action(this.value);
      }}
      icon={icon} />

  }
}

/**
 * Wraps a component implementing a click action on it.
 * @param {*} action 
 * @param {*} customComponent 
 */
export const WrapperComponent = (action, customComponent) => ({ value }) => 
  (<span onClick={() => action(value)}>{customComponent ? React.createElement(customComponent, { value: value }) : value}
  </span>)

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
      className="thumbnail-img" />

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
  </React.Fragment>


export const ColorComponent = ({ action, defaultColor }) => ({ value }) => 
  <React.Fragment>
    <PopupColorPicker color={ defaultColor } action={ hex => action(value, hex) }/>
  </React.Fragment>
/**
 * Shows the data value as a link
 */
export const LinkComponent = ({ text }) => ({ value }) => <a href={value} target="_blank" rel="noopener noreferrer">{text ? text : value }</a>


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


function extractGriddleData (data, listViewerColumnsConfiguration) {
  return data.map(row => listViewerColumnsConfiguration.reduce(
    reduceEntityToGriddleRow(row), {}
  ));
}
function reduceEntityToGriddleRow (row) {
  return (processedRow, { id, source }) => ({
    ...processedRow,
    [id]: mapSourceToRow(source, row)
  });
}


function mapSourceToRow (source, row) {
  if (row.get){ // is a map coming from griddle. instanceof Map does not work here
    row = mapToObject(row);
  }
  return source === undefined ? row : source instanceof Function ? source(row) : row[source];
}


export default class ListViewer extends React.Component {
  
  builtInComponents = { GroupComponent, IconComponent, WrapperComponent, LinkComponent, ImageComponent }

  constructor (props, context) {
    super(props, context);
    this.preprocessColumnConfiguration = this.preprocessColumnConfiguration.bind(this);
    this.handlerObject = this.props.handler;
    this.init();
  }

  componentDidUpdate () {
    this.init();
  }


  init () {
    this.columnConfiguration = this.preprocessColumnConfiguration(
      this.props.columnConfiguration !== undefined
        ? this.props.columnConfiguration
        : defaultColumnConfiguration
    );
    this.data = extractGriddleData(this.props.filter ? this.props.instances.filter(this.props.filter) : this.props.instances, this.columnConfiguration);
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
      return conf.map(this.preprocessColumnConfiguration)
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
    if (this.isString(action)){
      if (!this.handlerObject[action]){
        throw new Error('Bad ListViewer configuration: the function ' + action + ' is not defined in the specified handler ' + this.handlerObject);
      }
      return entity => this.handlerObject[action](entity)
    } else {
      return action.bind(this.handlerObject);
    } 
  }

  isString (obj) {
    return typeof obj === 'string' || obj instanceof String;
  }

  preprocessComponent (customComponent) {
    if (this.isString(customComponent)) {
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

    if ( action) {
      customComponent = WrapperComponent(action, customComponent);
    }
     
    return React.createElement(ColumnDefinition, { ...conf, key: id, configuration: undefined, customComponent: customComponent, source: undefined });
  }

  getColumnDefinitions () {
    return this.columnConfiguration.map(colConf => this.getColumnDefinition(colConf));
  }

  getLayout () {
    return ({ Table, Pagination, Filter, SettingsWrapper }) => ( <div className="listviewer-container">
      <Filter />
      <Table />
      <Pagination />
    </div> );
  }

  render () {
    // const { data, currentPage, pageSize, recordCount } = this.state;
    console.log("ColumnConfiguration", this.columnConfiguration);
    window.conf = this.columnConfiguration;
    return <section className="listviewer">

      <Griddle

        data={this.data}

        plugins={this.props.infiniteScroll 
          ? [plugins.LocalPlugin, plugins.PositionPlugin({})] 
          : [plugins.LocalPlugin]
        }

        components={{ Layout: this.getLayout() }}
        /*
         * pageProperties={{
         *     currentPage: currentPage,
         *     pageSize: pageSize,
         *     recordCount: recordCount,
         * }} 
         */
      >
        <RowDefinition>
          {
            this.getColumnDefinitions()
          }
        </RowDefinition>
      </Griddle>

    </section>
  }
  
 
}


