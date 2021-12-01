/**
 * @author  Dario Del Piano (dario@metacell.us)
 */

import * as React from "react";
import PropTypes from 'prop-types';
import { getResultsSOLR } from "./datasources/SOLRclient";
import { DatasourceTypes } from './datasources/datasources';
import { Component, FC, useState, useRef, useEffect } from "react";

import { makeStyles } from '@material-ui/core/styles';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Button, Grid, Input, InputAdornment, MenuList, MenuItem, Paper } from "@material-ui/core";

import { SearchProps, SearchState, ResultsProps, FiltersProps } from './SearchInterfaces';

declare var require: any

// Global used to sort the results from the sorter function declared in the searchConfiguration
declare global {
  interface Window { spotlightString: string; }
}

let style = require('./style/search.less');

let globalStyle = {
  inputWrapper: {
      "position": "absolute",
      "paddingLeft": "2.5%",
      "height": "100%",
      "width": "100%",
      "top": "10%"
  },
  searchText: {
      "width": "100vh",
      "zIndex": "1",
      "fontSize": "22px",
      "color": "black",
      "backgroundColor": "white",
      "padding": "12px 20px 12px 20px",
      "border": "3px solid #11bffe",
      "marginRight": "-8px",
  },
  filterIcon: {
      "right": "25px",
      "bottom": "15px",
      "zIndex": "5",
      "cursor": "pointer",
      "fontSize": "25px",
      "position": "absolute",
      "color": "black",
  },
  closeIcon: {
      "position": "relative",
      "color": "#11bffe",
      "bottom": "50px",
      "right": "22px",
      "fontWeight": "bold",
      "fontSize": "20px",
      "cursor": "pointer",
  },
  paperResults: {
      "left": "15%",
      "height": "50%",
      "width": "70%",
      "position": "absolute",
      "textAlign": "center",
      "backgroundColor": "#333333",
      "margin": "10px 10px 10px 10px",
      "padding": "12px 20px 12px 20px",
      "overflow": "scroll",
      "zIndex": "5",
  },
  paperFilters: {
      "minHeight": "280px",
      "minWidth": "240px",
      "position": "absolute",
      "backgroundColor": "#141313",
      "color": "white",
      "overflow": "scroll",
      "zIndex": "6",
      "border": "3px solid #11bffe",
      "fontFamily": "Barlow, Khand, sans-serif",
      "fontSize": "16px",
      "top": "58px",
      "right": "0px",
      "userSelect": "none",
      "-moz-user-select": "none",
      "-khtml-user-select": "none",
      "-webkit-user-select": "none",
      "-o-user-select": "none",

      "&::focus": {
        "outline": "0 !important",
      },
  },
  singleResult: {
      "color": "white",
      "&:hover": {
        "color": "#11bffe",
        "background-color": "#252323",
      },
  },
  main: {
      "position": "absolute",
      "top": "0px",
      "left": "0px",
      "width": "100%",
      "height": "100%",
      "margin": "0",
      "padding": "0",
      "zIndex": "3",
      "backgroundColor": "rgba(51, 51, 51, 0.7)",
      "textAlign": "center",
      "display": "flex",
      "alignItems": "center",
      "justifyContent": "center",
  }
};

/*
 * Results Functional Component
 * @param data: Array<any>
 * @param closeHandler: Function
 * @param clickHandler: Function
 */

const useStyles = makeStyles({
  root: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  icon: {
    borderRadius: 3,
    width: 16,
    height: 16,
    boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
    backgroundColor: '#f5f8fa',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
    '$root.Mui-focusVisible &': {
      outline: '2px auto #11bffe',
      outlineOffset: 2,
    },
    'input:hover ~ &': {
      backgroundColor: '#ebf1f5',
    },
    'input:disabled ~ &': {
      boxShadow: 'none',
      background: 'rgba(206,217,224,.5)',
    },
  },
  checkedIcon: {
    backgroundColor: '#11bffe',
    backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
    '&:before': {
      display: 'block',
      width: 16,
      height: 16,
      backgroundImage:
        "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
        " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
        "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E\")",
      content: '""',
    },
    'input:hover ~ &': {
      backgroundColor: '#11bffe',
    },
  },
});

function StyledCheckbox(props) {
  const itemState = props.checked;

  switch (itemState) {
    case "disabled":
      return (
        <i
          style={{
            cursor: 'pointer',
            paddingTop: '3px',
            paddingLeft: '5px',
            paddingRight: '4px',
            fontSize: '20px' }}
          className="fa fa-square"
          onClick={() => {
            props.filterHandler(props.filter, props.filtersListener);
          }}/>
      );
      break;
    case "positive":
      return (
        <i
          style={{
            color: 'green',
            fontSize: '20px' ,
            cursor: 'pointer',
            paddingTop: '3px',
            paddingLeft: '5px',
            paddingRight: '4px', }}
          className="fa fa-plus-square"
          onClick={() => {
            props.filterHandler(props.filter, props.filtersListener);
          }}/>
      );
      break;
    case "negative":
      return (
        <i
          style={{
            color: 'red',
            fontSize: '20px' ,
            cursor: 'pointer',
            paddingTop: '3px',
            paddingLeft: '5px',
            paddingRight: '4px', }}
          className="fa fa-minus-square"
          onClick={() => {
            props.filterHandler(props.filter, props.filtersListener);
          }}/>
      );
      break;
    default:
      return (
        <i
          style={{
            fontSize: '20px' ,
            cursor: 'pointer',
            paddingTop: '3px',
            paddingLeft: '5px',
            paddingRight: '4px',  }}
          className="fa fa-square"
          onClick={() => {
            props.filterHandler(props.filter, props.filtersListener);
          }}/>
      );
      break;
  }
}

const Results: FC<ResultsProps> = ({ data, configuration, closeHandler, clickHandler, topAnchor, searchStyle }) => {
  // if data are available we display the list of results
  if (data == undefined || data.length == 0) return null;
  let clone = Object.assign({}, searchStyle.paperResults);
  clone.top = topAnchor.toString() + "px";
  return (
      <Paper style={ searchStyle.paperResults } id="paperResults">
        <MenuList>
          {data.map((item, index) => {
            return ( <MenuItem style={ searchStyle.singleResult }
              key={index}
              className="searchResult"
              onClick={() => {
                clickHandler(item);
                closeHandler(false);
              }}>
              {configuration.label_manipulation ? configuration.label_manipulation(item[configuration.resultsMapping["name"]]) : item[configuration.resultsMapping["name"]]}
              { item[configuration.resultsMapping["labels"]] && <span className="label types badges">
                {item[configuration.resultsMapping["labels"]].map((label, index) => {
                	return <span className={"label label-" + label}>{label}</span>;
                })}
              </span>
              }
            </MenuItem> );
          })}
        </MenuList>
      </Paper>
  );
};

/*
 * Filters Functional Component
 * @param filters: Array<any>
 * @param setFilters: Function
 * @param openFilters: Function
 */

const Filters: FC<FiltersProps> = ({ filters, searchStyle, filtersListener, setFilters, openFilters, filters_expanded }) => {
  var paperRef = useRef(null);
  const [ state, setState ] = useState({ open: filters_expanded, top: "0", left: "0" });

  // hook for the event listener to detect when we click outside the component
  useEffect(() => {
    document.addEventListener("click", handleClickOutside, false);
    return () => {
      document.removeEventListener("click", handleClickOutside, false);
    };
  }, []);

  // function to handle the click outside the filters to close the component
  const handleClickOutside = event => {
    if (paperRef.current && !paperRef.current.contains(event.target)) {
      setState(() => {
        return { open: false, top: "0px", left: "0px"}
      });
    }
  };

  const filterHandler = (item, filtersListener) => {
    if (item.enabled === undefined) {
      item.enabled = "disabled"
    } else {
      switch(item.enabled) {
        case "disabled":
          item.enabled = "positive"
          break;
        case "positive":
          item.enabled = "negative"
          break;
        case "negative":
          item.enabled = "disabled"
          break;
        default:
          item.enabled = "disabled"
          break;
      }
    }
    if (item.type === 'array') {
      item.values.map(singleCheck => {
        singleCheck.enabled = item.enabled;
        setFilters(singleCheck);
      });
    }
    setFilters(item);
    filtersListener(item);
    setState(() => { return { open: true, top: state.top, left: state.left} });
  };

  const resetFilters = () => {
    filters.map((item, index) => {
      switch (item.type) {
        case 'string':
          item.enabled = "disabled";
          setFilters(item);
          break;
        case 'array':
          item.enabled = "disabled";
          item.values.map(singleCheck => {
            singleCheck.enabled = "disabled";
            setFilters(singleCheck);
          });
          setFilters(item);
          break;
        }
      });
    setState(() => { return { open: true, top: state.top, left: state.left} });
  };

  // If filters are not defined we don't visualise anything
  if (filters == undefined || filters.length == 0) return null;

  // if filters are defined we check if the filter's paper is open and display them
  if (state.open) {
    return (
      <span ref={paperRef}>
        <FilterListIcon style={ searchStyle.filterIcon } onClick={ (event:any) => {
            // let heightPosition = (event.currentTarget as HTMLDivElement).offsetTop + 15;
            let heightPosition = event.pageY + 30;
            setState(() => { return { open: false, top: heightPosition + "px", left: "0px" } });
          }} />
        <Paper id="paperFilters" style={ searchStyle.paperFilters } >
          <MenuList>
            {filters.map((item, index) => {
              switch (item.type) {
                case 'string':
                  return (
                    <div key={index} style={{ textAlign: "left", fontSize: "16px", height: "25px" }}>
                      <StyledCheckbox
                        filter={item}
                        checked={item.enabled}
                        filtersListener={filtersListener}
                        filterHandler={filterHandler} />
                      <span>
                        {item.filter_name}
                      </span>
                    </div>);
                  break;
                case 'array':
                  return (
                    <div key={index} style={{ textAlign: "left", fontSize: "16px", height: "25px", marginBottom: "5px", }}>
                      { item.disableGlobal === true
                      ? <span style={{ paddingLeft: "5px"}} />
                      : <StyledCheckbox
                          filter={item}
                          checked={item.enabled}
                          filtersListener={filtersListener}
                          filterHandler={filterHandler} /> }
                      <span>
                        {item.filter_name}
                      </span>

                      {item.values.map((value, innerIndex) => {
                        return (
                          <div key={index + "_" + innerIndex} style={{ marginTop: "5px", marginLeft: "20px", height: "25px" }}>
                            <StyledCheckbox
                              filter={value}
                              checked={value.enabled}
                              filtersListener={filtersListener}
                              filterHandler={filterHandler} />
                            <span style={{verticalAlign: "middle"}}>
                              {value.filter_name}
                            </span>
                          </div>);
                        })
                      }
                      <div style={{ paddingTop: "18px", paddingLeft: "10px" }}>
                        <Button
                          style={{
                            fontSize: "12px",
                            fontFamily: 'Barlow',
                            borderRadius: '0px',
                            color: 'white',
                            borderColor: 'white'
                          }}
                          variant="outlined"
                          onClick={resetFilters}>
                          Clear Filters
                        </Button>
                      </div>
                    </div>);
                  break;
                default:
                  return (
                    <div key={index} style={{ fontSize: "16px" }} >
                      "Error filter " + {item.key} + " configuration"
                    </div>
                  );
                  break;
              }
            })}
          </MenuList>
        </Paper>
      </span>
    );
  } else {
    return (
      <span ref={paperRef}>
        <FilterListIcon style={ searchStyle.filterIcon } onClick={ (event:any) => {
          // let heightPosition = (event.currentTarget as HTMLDivElement).offsetTop + 15;
          let heightPosition = event.pageY + 30;
          setState(() => { return { open: true, top: heightPosition + "px", left: "0px" } });
        }} />
      </span>
    );
  }
};

/*
 * Search Component
 * @param datasources: string
 * @param searchConfiguration: any
 * @param datasourceConfiguration: any
 * @param clickHandler: Function
 * @param customDatasourceHandler?: Function
 */

class Search extends Component<SearchProps, SearchState> {
    private results: Array<any>;
    private getResults: Function;
    private resultsHeight: number;
    private inputRef: any;
    private datasourceConfiguration: any;

    constructor (props: SearchProps) {
        super(props);

        // Initialise state from props is an antipattern if the source of truth can diverge from the state
        // in our case that is not an issue since we are using the prop only to inialise the state, then
        // the application rely on the state and not on the prop itself (this is for the filters)
        const initialFilters = (props.searchConfiguration.filters !== undefined) ? props.searchConfiguration.filters : [];
        this.state = {
          value: "",
          isOpen: false,
          filters: initialFilters
        };

        this.results = [];
        this.resultsHeight = 0;

        this.openSearch = this.openSearch.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        this.setFilters = this.setFilters.bind(this);
        this.escFunction = this.escFunction.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleResults = this.handleResults.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.filterSelection = this.filterSelection.bind(this);
        this.lookupFilter = this.lookupFilter.bind(this);
        this.datasourceConfiguration = JSON.parse(JSON.stringify(props.datasourceConfiguration));
      };

      // literal object to extract the getter function based on the datasource we pick
      getDatasource = {
        [DatasourceTypes.CUSTOM]: this.props.customDatasourceHandler,
        [DatasourceTypes.SOLRClient]: getResultsSOLR,
      };

      // handle the component opening / closing
      openSearch(requestedAction) {
        if (requestedAction !== undefined) {
          this.results = [];
          this.setState({ isOpen: requestedAction, value: "" });
        } else {
          this.results = [];
          this.setState({ isOpen: !this.state.isOpen, value: "" });
        }
        if (event !== undefined && requestedAction) {
          event.stopPropagation();
        }
      }
      
      clickHandler(result) {
        const id = result[this.props.searchConfiguration.resultsMapping["id"]];
        let shortForm = result && result.short_form;
        let self = this;
        if ( self.props.searchConfiguration.Neo4jLabels ) {
          const neo4jLabels = Object.values(self.props.searchConfiguration.Neo4jLabels);
          result.facets_annotation.forEach( annotation => {
            let facet = "facets_annotation:" + annotation;
            if ( neo4jLabels.includes(annotation) && !self.datasourceConfiguration.query_settings.fq.includes(facet) ) {
              self.datasourceConfiguration.query_settings.fq.push(facet); 
            }
          });
        }
        
        this.props.searchConfiguration.clickHandler(id);
      }

      // results handler, the name says everything
      handleResults(status:string, data:any, value:string) {
        switch(status) {
            case "OK":
                if (this.state.value !== value) {
                  if (value === "") {
                    this.results = [];
                  } else {
                    this.results = data;
                  }
                  this.setState({ value: value });
                }
                break;
            case "ERROR":
                break;
            default:
                console.log("This is a case not considered");
        }
      };

      // update the filters, handler used to trigger the update from the filter component
      setFilters(filter) {
        let newFilters = this.state.filters.map(item => {
          if (item.key === filter.key) {
            return filter;
          } else {
            return item;
          }
        });
        this.setState({ filters: newFilters });
      };

      // filter the results when 1 or more than one filter is provided
      applyFilters() {
        var allFiltersDisabled:boolean = true;
        var newResults:Array<any> = [];

        let filters = this.state.filters.map(filter => {
          switch(filter.type) {
            case 'string':
              if (filter.enabled !== undefined && filter.enabled !== 'disabled') {
                allFiltersDisabled = false;
                return filter;
              }
              break;
            case 'array':
              let filtersList = filter.values.filter(innerFilter => {
                if (innerFilter.enabled !== undefined && innerFilter.enabled !== 'disabled') {
                  allFiltersDisabled = false;
                  return true;
                }
              });
              if (filtersList.length > 0) {
                let newFilter = { ...filter }
                newFilter.values = filtersList;
                return newFilter;
              }
              break;
            default:
              console.log("Error filter " + filter.key + " configuration");
          }
        }).filter( item => item !== undefined );

        if (allFiltersDisabled) {
          return this.results;
        } else if (this.results.length > 0) {
          newResults = this.results.filter(record => {
            var recordToBeAdded:boolean = true;
            for (let i = 0; i < filters.length; i++) {
              switch(filters[i].type) {
                case 'string':
                  if (recordToBeAdded && filters[i].key !== undefined && record[filters[i].key] !== undefined) {
                    if (filters[i].enabled === "positive" && !(record[filters[i].key].toLowerCase().indexOf(this.state.value.toLowerCase()) > -1)) {
                      recordToBeAdded = false;
                    }
                    if (filters[i].enabled === "negative" && record[filters[i].key].toLowerCase().indexOf(this.state.value.toLowerCase()) > -1) {
                      recordToBeAdded = false;
                    }
                  }
                  break;
                case 'array':
                  if (record[filters[i].key] !== undefined) {
                    for (let j = 0; j < filters[i].values.length; j++) {
                      if (recordToBeAdded && filters[i].values[j].key !== undefined) {
                        if (filters[i].values[j].enabled === "positive" && !(record[filters[i].key].includes(filters[i].values[j].key))) {
                          recordToBeAdded = false;
                        }
                        if (filters[i].values[j].enabled === "negative" && record[filters[i].key].includes(filters[i].values[j].key)) {
                          recordToBeAdded = false;
                        }
                      }
                    }
                  }
                  break;
                default:
                  recordToBeAdded = false;
                  console.log("Error filter " + filters[i].key + " configuration");
              }
            }
            return recordToBeAdded;
          });
          return newResults;
        } else {
          return newResults;
        }
      }

      // wrapper to call the getter with all the required params for the generic datasource call.
      requestData(e) {
        window.spotlightString = e.target.value;
        this.getResults(e.target.value,
                        this.handleResults,
                        this.props.searchConfiguration.sorter,
                        this.datasourceConfiguration);
      };

      handleResize() {
        if (this.refs.inputRef !== undefined) {
          this.resultsHeight = ((this.refs.inputRef as HTMLInputElement).parentNode as HTMLDivElement).offsetHeight + ((this.refs.inputRef as HTMLInputElement).parentNode as HTMLDivElement).offsetTop + 10;
          // this setState it's actually an hack to re-render when the browser is resized
          // TODO: the render can be improved to avoid the filter function when this happen
          this.setState({ value: this.state.value });
        }
      }

      escFunction(event){
        if(event.keyCode === 27) {
          this.openSearch(false);
        }
      }

      handleClickOutside (event) {
        if (this.state.isOpen
            && (this.refs.containerRef && !(this.refs.containerRef as HTMLDivElement).contains(event.target))) {
          this.openSearch(false);
        }
      };

      componentDidUpdate() {
        if (this.inputRef !== undefined && this.inputRef !== null) {
          this.inputRef.focus();
        }
      }

      componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', this.escFunction, false);
        window.addEventListener("click", this.handleClickOutside, false);
        if (this.inputRef !== undefined && this.inputRef !== null) {
          this.inputRef.focus();
        }
      }

      componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('keydown', this.escFunction, false);
        window.removeEventListener("click", this.handleClickOutside, false);
      }

      // link the function getResults to the datasource getter that we decided in the prop datasource
      componentWillMount() {
        this.getResults = this.getDatasource[this.props.datasource]
      };
      
      lookupFilter (item, bq, filterValue){
        let lookup = "facets_annotation:" + item.key;
        let re = new RegExp(lookup, 'g');
        let found = bq.match(re);
        if ( found ){
          return bq.replace(found[0] + filterValue, "");
        }
        return bq;
      }

      filterSelection (item) {    
        let bq = this.datasourceConfiguration.query_settings.bq;

        switch (item.enabled) {
          case "disabled":
            bq = this.lookupFilter(item, bq, this.props.searchConfiguration.filter_positive);
            bq = this.lookupFilter(item, bq, this.props.searchConfiguration.filter_negative);
            break;
          case "positive":
            bq = this.lookupFilter(item, bq, this.props.searchConfiguration.filter_negative);
            bq += " facets_annotation:" + item.key + "^100";
            break;
          case "negative":
            bq = this.lookupFilter(item, bq, this.props.searchConfiguration.filter_positive);
            bq += " facets_annotation:" + item.key + "^0.001";
            break;
          default:
            break;
        }
        let updatedConfiguration = Object.assign(this.datasourceConfiguration , {
          query_settings : {
            ...this.datasourceConfiguration.query_settings,
            bq : bq
          }
        });        
      }

      render() {
        if (!this.state.isOpen) {
          return null;
        }

        let searchStyle = (this.props.searchStyle !== undefined) ? this.props.searchStyle : globalStyle;
        let filteredResults:Array<any> = this.applyFilters();
        return (
          <div>
            <Paper id="mainPaper" style={searchStyle.main}>
              <div style={searchStyle.inputWrapper} ref="containerRef">
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Input style={searchStyle.searchText} type="text"
                    ref={(input) => { this.inputRef = input; }}
                    id="searchInput"
                    autoComplete="virtualflybrain"
                    autoFocus={true}
                    onChange={ (e:any) => {
                      this.resultsHeight = e.currentTarget.offsetTop + 65;
                      this.requestData(e);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Filters
                          filters_expanded={this.props.searchConfiguration.filters_expanded}
                          filtersListener={this.filterSelection}
                          searchStyle={searchStyle}
                          filters={this.state.filters}
                          setFilters={this.setFilters} />
                      </InputAdornment>}
                    />

                  <span style={searchStyle.closeIcon} id="closeIcon" className="fa fa-times" onClick={ () => {
                    this.openSearch(false); }}/>
                  </Grid>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Results
                      data={filteredResults}
                      searchStyle={searchStyle}
                      configuration={this.props.searchConfiguration}
                      closeHandler={this.openSearch}
                      clickHandler={this.clickHandler}
                      topAnchor={this.resultsHeight} />
                  </Grid>
                </Grid>

              </div>
            </Paper>
          </div>
        );
      }
};

export default Search;
