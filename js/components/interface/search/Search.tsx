/**
 * @author  Dario Del Piano (dario@metacell.us)
 */

import * as React from "react";
import { getResultsSOLR } from "./datasources/SOLRclient";
import { DatasourceTypes } from './datasources/datasources';
import { Component, FC, useState, useRef, useEffect, createRef } from "react";

import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import FilterListIcon from '@material-ui/icons/FilterList';
import { Checkbox, Paper, MenuList, MenuItem, Input, InputAdornment } from "@material-ui/core";

import { SearchProps, SearchState, ResultsProps, FiltersProps } from './SearchInterfaces';

declare var require: any

// Global used to sort the results from the sorter function declared in the searchConfiguration
declare global {
  interface Window { spotlightString: string; }
}

let style = require('./style/search.less');

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
  const classes = useStyles();

  return (
    <Checkbox
      className={classes.root}
      disableRipple
      color="default"
      checkedIcon={<span className={clsx(classes.icon, classes.checkedIcon)} />}
      icon={<span className={classes.icon} />}
      inputProps={{ 'aria-label': 'decorative checkbox' }}
      {...props}
    />
  );
}

const Results: FC<ResultsProps> = ({ data, mapping, closeHandler, clickHandler, topAnchor }) => {
  // if data are available we display the list of results
  if (data == undefined || data.length == 0) return null;
  return (
      <Paper id="paperResults" style={{top: topAnchor + "px"}}>
        <MenuList>
          {data.map((item, index) => {
            return ( <MenuItem id="singleResult" style={{ fontSize: "16px" }}
              key={index}
              onClick={() => {
                clickHandler(item[mapping["id"]]);
                closeHandler(false);
              }}>
              {item[mapping["name"]]}
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

const Filters: FC<FiltersProps> = ({ filters, setFilters, openFilters }) => {
  var paperRef = useRef(null);
  const [ state, setState ] = useState({ open: false, top: "0", left: "0" });

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

  // If filters are not defined we don't visualise anything
  if (filters == undefined || filters.length == 0) return null;

  // if filters are defined we check if the filter's paper is open and display them
  if (state.open) {
    return (
      <span ref={paperRef}>
        <FilterListIcon id="filterIcon" onClick={ (event:any) => {
            // let heightPosition = (event.currentTarget as HTMLDivElement).offsetTop + 15;
            let heightPosition = event.pageY + 30;
            setState(() => { return { open: false, top: heightPosition + "px", left: "0px" } });
          }} />
        <Paper id="paperFilters">
          <MenuList>
            {filters.map((item, index) => {
              switch (item.type) {
                case 'string':
                  return (
                    <div key={index} style={{ textAlign: "left", fontSize: "16px", height: "25px" }}>
                      <StyledCheckbox
                        checked={item.enabled}
                        onChange={() => {
                          if (item.enabled !== undefined) {
                            item.enabled = !item.enabled;
                          } else {
                            item.enabled = true;
                          }
                          setFilters(item);
                          setState(() => { return { open: true, top: state.top, left: state.left} });
                        }}/>
                      <span style={{verticalAlign: "middle"}}>
                        {item.filter_name}
                      </span>
                    </div>);
                  break;
                case 'array':
                  return (
                    <div key={index} style={{ textAlign: "left", fontSize: "16px", height: "25px" }}>
                      <StyledCheckbox
                        checked={item.enabled}
                        onChange={() => {
                          if (item.enabled !== undefined) {
                            item.enabled = !item.enabled;
                          } else {
                            item.enabled = true;
                          }
                          item.values.map(singleCheck => {
                            singleCheck.enabled = item.enabled;
                            setFilters(singleCheck);
                          });
                          setState(() => { return { open: true, top: state.top, left: state.left} });
                        }}/>
                      <span style={{verticalAlign: "middle"}}>
                        {item.filter_name}
                      </span>

                      {item.values.map((value, innerIndex) => {
                        return (
                          <div key={index + "_" + innerIndex} style={{ marginLeft: "20px", height: "25px" }}>
                            <StyledCheckbox
                              checked={value.enabled}
                              onChange={() => {
                                if (value.enabled !== undefined) {
                                  value.enabled = !value.enabled;
                                } else {
                                  value.enabled = true;
                                }
                                setFilters(item);
                                setState(() => { return { open: true, top: state.top, left: state.left} });
                              }}/>
                            <span style={{verticalAlign: "middle"}}>
                              {value.filter_name}
                            </span>
                          </div>);
                        })
                      }
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
        <FilterListIcon id="filterIcon" onClick={ (event:any) => {
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

export default class Search extends Component<SearchProps, SearchState> {
    private results: Array<any>;
    private getResults: Function;
    private resultsHeight: number;
    private inputRef: any;

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
        this.setFilters = this.setFilters.bind(this);
        this.escFunction = this.escFunction.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleResults = this.handleResults.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
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
        let newFilters:Array<any> = [];

        this.state.filters.map(item => {
          if (item.key === filter.key) {
            newFilters.push(filter);
          } else {
            newFilters.push(item);
          }
        });
        this.setState({ filters: newFilters });
      };

      // filter the results when 1 or more than one filter is provided
      applyFilters() {
        var allFiltersDisabled:boolean = true;
        var newResults:Array<any> = [];

        this.state.filters.map(filter => {
          switch(filter.type) {
            case 'string':
              if (filter.enabled !== undefined && filter.enabled === true) {
                allFiltersDisabled = false;
              }
              break;
            case 'array':
              filter.values.map(innerFilter => {
                if (innerFilter.enabled !== undefined && innerFilter.enabled === true) {
                  allFiltersDisabled = false;
                }
              });
              break;
            default:
              console.log("Error filter " + filter.key + " configuration");
          }
        });

        if (allFiltersDisabled) {
          return this.results;
        } else {
          this.results.map(record => {
            var recordAdded:boolean = true;
            this.state.filters.map(filter => {
              switch(filter.type) {
                case 'string':
                  if (recordAdded && filter.enabled === true && filter.key !== undefined && record[filter.key] !== undefined) {
                    if (record[filter.key].toLowerCase().indexOf(this.state.value.toLowerCase()) > -1) {
                      recordAdded = false;
                      newResults.push(record);
                    }
                  }
                  break;
                case 'array':
                  if (record[filter.key] !== undefined) {
                    filter.values.map(innerFilter => {
                      if (recordAdded && innerFilter.enabled === true && innerFilter.key !== undefined && record[filter.key].includes(innerFilter.key)) {
                        recordAdded = false;
                        newResults.push(record);
                      }
                    });
                  }
                  break;
                default:
                  console.log("Error filter " + filter.key + " configuration");
              }
            });
          });
          return newResults;
        }
      }

      // wrapper to call the getter with all the required params for the generic datasource call.
      requestData(e) {
        window.spotlightString = e.target.value;
        this.getResults(e.target.value,
                        this.handleResults,
                        this.props.searchConfiguration.sorter,
                        this.props.datasourceConfiguration);
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

      render() {
        if (!this.state.isOpen) {
          return null;
        }

        let filteredResults:Array<any> = this.applyFilters();
        return (
          <div>
            <Paper id="mainPaper">
              <div id="inputContainer" ref="containerRef">
                <Input id="searchInput" type="text"
                  ref={(input) => { this.inputRef = input; }}
                  autoComplete="virtualflybrain"
                  onChange={ (e:any) => {
                    this.resultsHeight = e.currentTarget.offsetTop + 65;
                    this.requestData(e);
                  }} 
                  endAdornment={
                    <InputAdornment position="end">
                      <Filters
                        filters={this.state.filters}
                        setFilters={this.setFilters} />
                    </InputAdornment>}
                  />

                <span id="closeIcon" className="fa fa-times" onClick={ () => {
                  this.openSearch(false); }}/>

                <Results
                data={filteredResults}
                mapping={this.props.searchConfiguration.resultsMapping}
                closeHandler={this.openSearch}
                clickHandler={this.props.searchConfiguration.clickHandler}
                topAnchor={this.resultsHeight} />
              </div>
            </Paper>
          </div>
        );
      }
};
