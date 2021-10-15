define(function (require) {

  require("./query.less");
  require("./react-simpletabs.less");

  var React = require('react');
  var GEPPETTO = require('geppetto');
  var Handlebars = require('handlebars');
  var Griddle = require('griddle-0.6-fork');
  var QueryItem = require('./queryItem.js');
  var QueryFooter = require('./queryFooter.js');
  var Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
  var Typography = require('@material-ui/core/Typography').default;
  var MenuButton = require('../../controls/menuButton/MenuButton');
  var typeahead = require("typeahead.js/dist/typeahead.jquery.min.js");

  var resultsViewState = false;

  // query model object to represent component state and trigger view updates
  var queryBuilderModel = {
    // list of change handlers called on change
    onChangeHandlers: [],
    handlerContext: [],
    // query items present in the query builder
    items: [],
    // fetched results
    results: [],
    // result count for the current query items
    count: 0,

    // subscribe to model change notifications
    subscribe (callback, context) {
      this.onChangeHandlers.push(callback);
      this.handlerContext.push(context);
    },

    // notify to all listeners that the model has changed
    notifyChange () {
      this.onChangeHandlers.forEach(function (cb) {
        let boundCallback = cb.bind(this);
        boundCallback();
      }.bind(this.handlerContext[0]));
    },

    itemSelectionChanged (item, selection, callback) {
      for (var i = 0; i < this.items.length; i++) {
        if (item.id == this.items[i].id) {
          this.items[i].selection = selection;
          break;
        }
      }

      // get count triggers notify change once results are fetched
      this.getCount(callback);
    },

    // add query item to model
    addItem (item, callback) {
      this.items.push(item);

      // get count triggers notify change once results are fetched
      this.getCount(callback);
    },

    // delete single query item from model
    deleteItem (item, callback) {
      for (var i = 0; i < this.items.length; i++) {
        if (item.id == this.items[i].id) {
          this.items.splice(i, 1);
        }
      }

      if (this.items.length > 0) {
        // get count triggers notify change once results are fetched
        this.getCount(callback);
      } else {
        // set count triggers notify change
        this.setCount(0, callback);
      }
    },

    // clear all query items from model
    clearItems () {
      this.items = [];
      this.count = 0;
      this.notifyChange();
    },

    // Asynchronous call to the server to get the results count for the given query items
    getCount (callback) {
      var queryDTOs = [];

      for (var i = 0; i < this.items.length; i++) {
        var selection = this.items[i].selection;
        if (selection != -1) {
          var queryDTO = {
            target: this.items[i].target,
            query: this.items[i].options[selection + 1].queryObj
          };

          queryDTOs.push(queryDTO);
        }
      }

      var getCountDoneCallback = function (count) {
        this.setCount(count, callback);
      };

      GEPPETTO.QueriesController.getQueriesCount(queryDTOs, getCountDoneCallback.bind(this));
    },

    setCount (count, callback) {
      this.count = count;
      callback();
      this.notifyChange();
    },

    addResults (results) {
      // loop results and unselect all
      for (var i = 0; i < this.results.length; i++) {
        this.results[i].selected = false;
      }

      // always add the new one at the start of the list to simulate history
      this.results.unshift(results);
      this.notifyChange();
    },

    deleteResults (results) {
      GEPPETTO.CommandController.log("delete results", true);
      for (var i = 0; i < this.results.length; i++) {
        if (results.id == this.results[i].id) {
          this.results.splice(i, 1);
        }
      }

      this.notifyChange();
    },

    resultSelectionChanged (resultsSetId) {
      // loop results and change selection
      for (var i = 0; i < this.results.length; i++) {
        if (this.results[i].id == resultsSetId) {
          this.results[i].selected = true;
          // move selected at the top of the list to simulate history
          var match = this.results[i];
          this.results.splice(i, 1);
          this.results.unshift(match);
        } else {
          this.results[i].selected = false;
        }
      }

      this.notifyChange();
    }
  };

  class QueryBuilder extends React.Component {
    constructor (props) {
      super(props);

      this.state = {
        resultsView: false,
        errorMsg: '',
        showSpinner: false,
        resultsColumns: null,
        resultsColumnMeta: null,
        resultsControlsConfig: null,
        infiniteScroll: undefined,
        resultsPerPate: undefined,
        refreshTrigger: false,
        value: 0,
        display: false,
        allColumnsToShow: null,
      }

      this.displayName = 'QueryBuilder';
      this.dataSourceResults = {};
      this.updateResults = false;
      this.initTypeAheadCreated = false;
      this.configuration = { DataSources: {} };
      this.mixins = [
        require('../../controls/mixins/bootstrap/modal.js')
      ];
      this.escape = 27;
      this.qKey = 81;
      /*
       * this.sorterColumn will be an object taken from the prop sorterColumns.
       * The prop represents an array of objects, each object must have the parameters:
       * - column: (string) represents the string that should drive the sorting
       * - order: (string) represents the order we want to use, must be between ASC or DESC
       * e.g.: this.props.sorterColumns = [
       *    {column: "name", order: "ASC"}, {column: "image", order: "DESC"}
       *  ];
       */
      this.sorterColumn = undefined;


      this.open = this.open.bind(this);
      this.close = this.close.bind(this);
      this.runQuery = this.runQuery.bind(this);
      this.switchView = this.switchView.bind(this);
      this.initTypeahead = this.initTypeahead.bind(this);
      this.setWrapperRef = this.setWrapperRef.bind(this);
      this.keyOpenHandler = this.keyOpenHandler.bind(this);
      this.setErrorMessage = this.setErrorMessage.bind(this);
      this.keyCloseHandler = this.keyCloseHandler.bind(this);
      this.queryItemDeleted = this.queryItemDeleted.bind(this);
      this.clearErrorMessage = this.clearErrorMessage.bind(this);
      this.defaultDataSources = this.defaultDataSources.bind(this);
      this.queryResultDeleted = this.queryResultDeleted.bind(this);
      this.handleClickOutside = this.handleClickOutside.bind(this);
      this.downloadQueryResults = this.downloadQueryResults.bind(this);
      this.resultSetSelectionChange = this.resultSetSelectionChange.bind(this);
      this.queryOptionSelected = this.queryOptionSelected.bind(this);
      this.getSorterColumn = this.getSorterColumn.bind(this);
    }

    keyCloseHandler (event){
      if (event.keyCode === this.escape) {
        this.close();
        GEPPETTO.trigger("query_closed");
      }
    }

    keyOpenHandler (event) {
      if (event.keyCode === this.qKey && GEPPETTO.isKeyPressed("ctrl")) {
        if (this.state.display) {
          this.close();
        } else {
          this.open();
        }
      }
    }

    setWrapperRef (node) {
      this.wrapperRef = node;
    }

    handleClickOutside (event) {
      if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
        this.close();
        GEPPETTO.trigger("query_closed");
      }
    }

    defaultDataSources (q, sync) {
      if (q === '') {
        sync(this.dataSourceResults.index.all());
      } else {
        this.dataSourceResults.search(q, sync);
      }
    }

    componentWillMount () {
      // this.clearErrorMessage();
      GEPPETTO.QueryBuilder = this;
      this.props.resultsColMeta.map(item => {
        if (item["customComponent"] !== undefined) {
          item["queryBuilder"] = this;
        }
      });
      this.setResultsColumnMeta(this.props.resultsColMeta);
      this.setResultsColumns(this.props.resultsColumns);
      this.setResultsControlsConfig(this.props.resultsControlConfig);
      this.addDataSource(this.props.datasourceConfig);
    }

    componentWillUnmount () {
      document.removeEventListener('mousedown', this.handleClickOutside);
      document.removeEventListener("keydown", this.keyOpenHandler, false);
      document.removeEventListener("keydown", this.keyCloseHandler, false);
    }

    switchView (resultsView, clearQueryItems) {
      if (clearQueryItems == true) {
        this.clearAllQueryItems();
      }

      this.setState({ resultsView: resultsView });
    }

    showBrentSpiner (spin) {
      this.setState({ showSpinner: spin });
    }

    open () {
      /*
       * show query builder
       */
      this.setState({ display: true }, () => {
        var typeAhead = $("#query-typeahead");
        typeAhead.focus();
      });
    }

    close () {
      /*
       * hide query builder
       */
      this.setState({ display: false });
    }

    setResultsControlsConfig (controlsConfig) {
      this.setState({ resultsControlsConfig: controlsConfig });
    }

    setResultsColumns (columns) {
      this.setState({
        resultsColumns: columns,
        allColumnsToShow: columns 
      });
    }

    setResultsColumnMeta (colMeta) {
      this.setState({ resultsColumnMeta: colMeta });
    }

    initTypeahead () {

      var that = this;

      $("#query-typeahead").unbind('keydown');
      $("#query-typeahead").keydown(this, function (e) {
        if (e.which == 9 || e.keyCode == 9) {
          e.preventDefault();
        }
      });

      var queryTypeAheadElem = $("#query-typeahead");

      queryTypeAheadElem.unbind('keydown');
      queryTypeAheadElem.keydown(this, function (e) {
        if (e.which == 9 || e.keyCode == 9) {
          e.preventDefault();
        }
      });

      queryTypeAheadElem.unbind('keypress');
      queryTypeAheadElem.keypress(this, function (e) {
        if (e.which == 13 || e.keyCode == 13) {
          that.confirmed($("#query-typeahead").val());
        }
        if (this.searchTimeOut !== null) {
          clearTimeout(this.searchTimeOut);
        }
        this.searchTimeOut = setTimeout(function () {
          for (var key in that.configuration.DataSources) {
            if (Object.prototype.hasOwnProperty.call(that.configuration.DataSources, key)) {
              var dataSource = that.configuration.DataSources[key];
              var searchQuery = $("#query-typeahead").val();
              var url = dataSource.url.replace(/\$SEARCH_TERM\$/g, searchQuery);
              that.updateResults = true;
              that.requestDataSourceResults(key, url, dataSource.crossDomain);
            }
          }
        }, 150);
      });

      // fire key event on paste
      queryTypeAheadElem.off("paste");
      queryTypeAheadElem.on("paste", function () {
        $(this).trigger("keypress", { keyCode: 13 });
      });

      queryTypeAheadElem.unbind('typeahead:selected');
      queryTypeAheadElem.bind('typeahead:selected', function (obj, datum, name) {
        if (Object.prototype.hasOwnProperty.call(datum, "label")) {
          that.confirmed(datum.label);
        }
      });

      queryTypeAheadElem.typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      },
      {
        name: 'dataSourceResults',
        source: this.defaultDataSources,
        limit: 50,
        display: 'label',
        templates: { suggestion: Handlebars.compile('<div>{{geticon icon}} {{label}}</div>') }
      }
      );
      that.initTypeAheadCreated = true;

    }

    componentDidMount () {
      var escape = 27;
      var qKey = 81;

      var that = this;
      queryBuilderModel.subscribe(this.refresh, that);

      document.addEventListener('mousedown', this.handleClickOutside);
      document.addEventListener("keydown", this.keyCloseHandler, false);
      document.addEventListener("keydown", this.keyOpenHandler, false);

      Handlebars.registerHelper('geticon', function (icon) {
        if (icon) {
          return new Handlebars.SafeString("<icon class='fa " + icon + "' style='margin-right:5px;'/>");
        } else {
          return;
        }
      });

      // this.initDataSourceResults(); 

      this.initTypeahead();

      if (GEPPETTO.ForegroundControls != undefined) {
        GEPPETTO.ForegroundControls.refresh();
      }
    }

    componentDidUpdate () {
      if (!this.state.resultsView) {
        // re-init the search box on query builder
        this.initTypeahead();
      }

      if (!this.state.display) {
        document.removeEventListener('mousedown', this.handleClickOutside);
        document.removeEventListener("keydown", this.keyCloseHandler, false);
      } else {
        document.addEventListener('mousedown', this.handleClickOutside);
        document.addEventListener("keydown", this.keyCloseHandler, false);
      }
    }

    initDataSourceResults (datumToken, queryToken, sorter) {
      this.dataSourceResults = new Bloodhound({
        datumTokenizer: (datumToken != undefined) ? datumToken : Bloodhound.tokenizers.obj.whitespace('label'),
        queryTokenizer: (queryToken != undefined) ? queryToken : Bloodhound.tokenizers.whitespace,
        identify: function (obj) {
          return obj.label;
        },
        sorter: sorter
      });
    }

    /**
     * Requests external data sources.
     */
    addDataSource (sources) {
      try {
        for (var key in sources) {
          if (Object.prototype.hasOwnProperty.call(sources, key)) {
            var obj = sources[key];
            var key = this.generateDataSourceKey(key, 0);
            this.configuration.DataSources[key] = obj;

            if (obj.bloodhoundConfig) {
              this.initDataSourceResults(
                obj.bloodhoundConfig.datumTokenizer,
                obj.bloodhoundConfig.queryTokenizer,
                obj.bloodhoundConfig.sorter
              );
            }
          }
        }
      } catch (err) {
        throw ("Error parsing data sources " + err);
      }
    }

    /**
     * Figure out if data source of same name is already in there. If it is create a new key for it.
     */
    generateDataSourceKey (key, index) {
      var dataSource = this.configuration.DataSources[key]
      if (dataSource != null || dataSource != undefined) {
        key = key.concat(index);
        this.generateDataSourceKey(key, index++);
      }

      return key;
    }

    /**
     * Requests results for an external data source
     *
     * @param data_source_name : Name of the Data Source to request results from
     * @param data_source_url : URL used to request data source results
     * @param crossDomain : URL allows cross domain
     */
    requestDataSourceResults (data_source_name, data_source_url, crossDomain) {
      var that = this;
      // not cross domain, get results via java servlet code
      if (!crossDomain) {
        var parameters = {};
        parameters["data_source_name"] = data_source_name;
        parameters["url"] = data_source_url;
        GEPPETTO.MessageSocket.send("get_data_source_results", parameters);
      } else {
        // cross domain, do ajax query for results
        $.ajax({
          type: 'GET',
          dataType: 'text',
          url: data_source_url,
          success: function (responseData, textStatus, jqXHR) {
            that.updateDataSourceResults(data_source_name, JSON.parse(responseData));
          },
          error: function (responseData, textStatus, errorThrown) {
            throw ("Error retrieving data sources " + data_source_name + "  from " + data_source_url);
          }
        });
      }
    }

    /**
     * Update the datasource results with results that come back
     *
     * @param data_source_name
     * @param results
     */
    updateDataSourceResults (data_source_name, results) {
      var that = this;
      var responses = results.response.docs;
      responses.forEach(function (response) {
        that.formatDataSourceResult(data_source_name, response);
      });

      // If it's an update request to show the drop down menu, this for it to show updated results
      if (this.updateResults) {
        var queryTypeAheadElem = $("#query-typeahead");
        var value = queryTypeAheadElem.val();
        queryTypeAheadElem.typeahead('val', "init"); // this is required to make sure the query changes otherwise typeahead won't update
        queryTypeAheadElem.typeahead('val', value);
      }
    }

    /**
     * Format incoming data source results into specified format in configuration script
     */
    formatDataSourceResult (data_source_name, response) {
      // create searchable result for main label
      var labelTerm = this.configuration.DataSources[data_source_name].label.field;
      var idTerm = this.configuration.DataSources[data_source_name].id;
      var mainLabel = response[labelTerm];
      var id = response[idTerm];
      var labelFormatting = this.configuration.DataSources[data_source_name].label.formatting;
      var formattedLabel = labelFormatting.replace('$VALUE$', mainLabel);
      formattedLabel = formattedLabel.replace('$ID$', id);

      this.createDataSourceResult(data_source_name, response, formattedLabel, id);

      var explodeFields = this.configuration.DataSources[data_source_name].explode_fields;
      for (var i = 0; i < explodeFields.length; i++) {
        // create searchable result using id as label
        var idsTerm = explodeFields[i].field;
        var idLabel = response[idsTerm];
        labelFormatting = explodeFields[i].formatting;
        formattedLabel = labelFormatting.replace('$VALUE$', idLabel);
        formattedLabel = formattedLabel.replace('$LABEL$', mainLabel);

        this.createDataSourceResult(data_source_name, response, formattedLabel, id);
      }

      var explodeArrays = this.configuration.DataSources[data_source_name].explode_arrays;
      for (var i = 0; i < explodeArrays.length; i++) {
        labelFormatting = explodeArrays[i].formatting;
        // create searchable results using synonyms as labels
        var searchTerm = explodeArrays[i].field;
        var results = response[searchTerm];
        if (results != null || undefined) {
          for (var i = 0; i < results.length; i++) {
            var result = results[i];
            formattedLabel = labelFormatting.replace('$VALUE$', result);
            formattedLabel = formattedLabel.replace('$LABEL$', mainLabel);
            formattedLabel = formattedLabel.replace('$ID$', id);

            this.createDataSourceResult(data_source_name, response, formattedLabel, id);
          }
        }
      }
    }

    /**
     * Creates a searchable result from external data source response
     */
    createDataSourceResult (data_source_name, response, formattedLabel, id) {
      var typeName = response.type;

      var obj = {};
      obj["label"] = formattedLabel;
      obj["id"] = id;
      // replace $ID$ with one returned from server for actions
      var actions = this.configuration.DataSources[data_source_name].type[typeName].actions;
      var newActions = actions.slice(0);
      for (var i = 0; i < actions.length; i++) {
        newActions[i] = newActions[i].replace(/\$ID\$/g, obj["id"]);
        newActions[i] = newActions[i].replace(/\$LABEL\$/gi, obj["label"]);
      }
      obj["actions"] = newActions;
      obj["icon"] = this.configuration.DataSources[data_source_name].type[typeName].icon;
      this.dataSourceResults.add(obj);
    }

    confirmed (item) {
      if (item && item != "") {
        if (this.dataSourceResults.get(item)) {
          var found = this.dataSourceResults.get(item);
          if (found.length == 1) {
            var actions = found[0].actions;
            actions.forEach(function (action) {
              GEPPETTO.CommandController.execute(action)
            });
            $("#query-typeahead").typeahead('val', "");
          }
        }
      }
    }

    queryOptionSelected (item, value, cb) {
      this.clearErrorMessage();

      var that = this;
      var callback = function () {
        that.showBrentSpiner(false);

        // cascading callback from parameters
        if (typeof cb === "function") {
          cb();
        }
      };

      // hide footer and show spinner
      this.showBrentSpiner(true);

      // Option has been selected
      this.props.model.itemSelectionChanged(item, value, callback.bind(this));
    }

    queryItemDeleted (item) {
      this.clearErrorMessage();

      var callback = function () {
        this.showBrentSpiner(false);
      };

      // hide footer and show spinner
      this.showBrentSpiner(true);

      this.props.model.deleteItem(item, callback.bind(this));
    }

    /**
     * Clears all query items from the query builder
     */
    clearAllQueryItems () {
      this.clearErrorMessage();
      this.props.model.clearItems();
    }

    queryResultDeleted (resultsItem) {
      this.props.model.deleteResults(resultsItem);
    }

    getCompoundQueryId (queryItems) {
      var id = "";

      for (var i = 0; i < queryItems.length; i++) {
        id += queryItems[i].term + queryItems[i].selection;
      }

      return id;
    }

    /*
     * This function will take in input the prop sorterColumns and, for each query, the results header
     * that we want to display. Comparing the 2 data we will get the first column possible from the
     * sorterColumns array that is present in the resultsColumns and use this column to drive the 
     * sorting.
     */
    getSorterColumn (sorterColumns, resultsColumns) {
      var found = false;
      var column = (resultsColumns.length > 0) ? resultsColumns[0] : undefined;
      var order = true;
      var metaData = [...this.state.resultsColumnMeta];
      // Loop the sorterColumns since we have to take the first available from this
      for ( var i = 0; i < sorterColumns.length; i++) {
        // If in the previous loop I found one column I break the cycle since I don't need to look anymore
        if (found) {
          break;
        }
        // Loop through the resultsColumns and compare these with the sorterColumn[i].column
        for (var j = 0; j < resultsColumns.length; j++) {
          if (sorterColumns[i].column.toLowerCase() === resultsColumns[j].toLowerCase()) {
            // If we find the candidate we set found to break the loop and column will be the one found
            found = true;
            column = resultsColumns[j];
            /*
             * This third for it's a constraint since the initialSortAscending prop of griddle is not working
             * anymore. To bypass this problem I will set the order editing the resultsColumnMeta, looking
             * for the object that specify all the params for the column that we are considering and
             * injecting in this object the param sortDirectionCycle based on what we specified in the order
             * param in our sorterColumns array of objects. By default desc will be the first candidate if the
             * developer does not choose anything.
             */
            for ( var y = 0; y < metaData.length; y++) {
              if ( column.toLowerCase() === metaData[y].columnName) {
                switch (sorterColumns[i].order.toLowerCase()) {
                case 'asc':
                  metaData[y].sortDirectionCycle = ['asc', 'desc', null];
                  break;
                case 'desc':
                  metaData[y].sortDirectionCycle = ['desc', 'asc', null];
                  break;
                default:
                  metaData[y].sortDirectionCycle = ['desc', 'asc', null];
                }
              }
            }
          }
        }
      }
      // I need to re-set the resultscolumnMeta since this is stored in the state
      this.setState({ resultsColumnMeta: metaData });
      /*
       * return the object with the column and the order, the order is not used anymore though but 
       * it might be useful if we upgrade griddle so I left what already done there.
       */
      return {
        column: column,
        order: order
      };
    }

    runQuery () {
      this.clearErrorMessage();
      if (this.props.model.items.length > 0) {

        var allSelected = true;
        for (var i = 0; i < this.props.model.items.length; i++) {
          if (this.props.model.items[i].selection == -1) {
            allSelected = false;
            break;
          }
        }

        if (!allSelected) {
          // show error message for unselected query items
          this.setErrorMessage('Please select an option for all query items.');
        } else if (this.props.model.count == 0) {
          // show message for no query results
          this.setErrorMessage('There are no results for this query.');
        } else {
          // check if we already have results for the given compound query
          var compoundId = this.getCompoundQueryId(this.props.model.items);
          var match = false;

          for (var i = 0; i < this.props.model.results.length; i++) {
            if (this.props.model.results[i].id == compoundId) {
              match = true;
            }
          }

          if (!match) {
            // build query items for data transfer
            var queryDTOs = [];

            for (var i = 0; i < this.props.model.items.length; i++) {
              var selection = this.props.model.items[i].selection;
              if (selection != -1) {
                var queryDTO = {
                  target: this.props.model.items[i].target,
                  query: this.props.model.items[i].options[selection + 1].queryObj
                };

                queryDTOs.push(queryDTO);
              }
            }

            var that = this;
            var queryDoneCallback = function (jsonResults) {
              var queryLabel = "";
              var verboseLabel = "";
              var verboseLabelPlain = "";
              for (var i = 0; i < that.props.model.items.length; i++) {
                queryLabel += ((i != 0) ? "/" : "")
                                        + that.props.model.items[i].term;
                verboseLabel += ((i != 0) ? "<span> AND </span>" : "")
                                        + that.props.model.items[i].options[that.props.model.items[i].selection + 1].name;
                verboseLabelPlain += ((i != 0) ? " AND " : "")
                                        + that.props.model.items[i].options[that.props.model.items[i].selection + 1].name;
              }

              // NOTE: assumption we only have one datasource configured
              var datasourceConfig = that.configuration.DataSources[Object.keys(that.configuration.DataSources)[0]];
              var headersDatasourceFormat = datasourceConfig.resultsFilters.getHeaders(JSON.parse(jsonResults));
              var columnsPresent = headersDatasourceFormat.map(header => {
                for (var counter = 0; counter < that.state.resultsColumnMeta.length; counter++) {
                  if (that.state.resultsColumnMeta[counter].displayName == header) {
                    return that.state.resultsColumnMeta[counter].columnName;
                  }
                }
              });
              var recordsDatasourceFormat = datasourceConfig.resultsFilters.getRecords(JSON.parse(jsonResults));
              var formattedRecords = recordsDatasourceFormat.map(function (record) {
                var instance = new Object();
                for (var counter = 0; counter < columnsPresent.length; counter++) {
                  instance[columnsPresent[counter]] = datasourceConfig.resultsFilters.getItem(record, headersDatasourceFormat, headersDatasourceFormat[counter]);
                }
                instance["controls"] = '';
                return instance;
              });

              var columnsToShow = that.state.allColumnsToShow.filter(item => {
                for (var counter = 0; counter < columnsPresent.length; counter++) {
                  if (item == columnsPresent[counter]) {
                    return true;
                  }
                }
                return false;
              });

              that.props.model.addResults({
                id: compoundId,
                items: that.props.model.items.slice(0),
                label: queryLabel,
                verboseLabel: '<span>' + formattedRecords.length.toString() + '</span> ' + verboseLabel,
                verboseLabelPLain: formattedRecords.length.toString() + ' ' + verboseLabelPlain,
                records: formattedRecords,
                selected: true,
                columnsToShow: columnsToShow,
                columnsPresent: columnsPresent,
                headersColumns: headersDatasourceFormat
              });

              if (that.props.sorterColumns !== undefined) {
                /*
                 * From the array passed with the props extract the column in relation 
                 * to the results that should drive the sorting
                 */
                that.sorterColumn = that.getSorterColumn(that.props.sorterColumns, columnsToShow);
              } else {
                if (that.props.resultsColumns.length > 0) {
                  that.sorterColumn = {
                    column: that.props.resultsColumns[0],
                    order: true
                  };
                }
              }

              // stop showing spinner
              that.showBrentSpiner(false);

              // change state to switch to results view
              that.switchView(true);
            };

            // hide footer and show spinner
            this.showBrentSpiner(true);

            // run query on queries controller
            GEPPETTO.QueriesController.runQuery(queryDTOs, queryDoneCallback);
          } else {
            /*
             * if we already have results for the an identical query switch to results and select the right tab
             * set the right results item as the selected tab
             */
            for (var i = 0; i < this.props.model.results.length; i++) {
              if (this.props.model.results[i].id == compoundId) {
                this.props.model.results[i].selected = true;
              } else {
                this.props.model.results[i].selected = false;
              }
            }

            // trigger refresh
            this.props.model.notifyChange();

            // change state to switch to results view
            this.switchView(true);
          }
        }
      } else {
        // show error message for empty query
        this.setErrorMessage('Please add query items to run a query.');
      }
    }

    /**
     * Add a query item
     *
     * @param queryItem - Object with term and variable id properties
     * @param cb - optional callback function
     */
    addQueryItem (queryItemParam, cb) {
      this.clearErrorMessage();

      // grab datasource configuration (assumption we only have one datasource)
      var datasourceConfig = this.configuration.DataSources[Object.keys(this.configuration.DataSources)[0]];
      var queryNameToken = datasourceConfig.queryNameToken;

      // retrieve variable from queryItem.id
      var variable = GEPPETTO.ModelFactory.getTopLevelVariablesById([queryItemParam.id])[0];
      var term = variable.getName();

      // do we have any query items already? If so grab result type and match on that too
      var resultType = undefined;
      for (var h = 0; h < this.props.model.items.length > 0; h++) {
        var sel = this.props.model.items[h].selection;
        if (sel != -1 && this.props.model.items[h].options[sel].value != -1) {
          // grab the first for which we have a selection if any
          resultType = this.props.model.items[h].options[sel].queryObj.getResultType();
        }
      }

      // retrieve matching queries for variable type
      var matchingQueries = GEPPETTO.ModelFactory.getMatchingQueries(variable.getType(), resultType);

      if (matchingQueries.length > 0) {
        // build item in model-friendly format
        var queryItem = {
          term: term,
          target: variable,
          options: []
        };

        // fill out options from matching queries
        for (var i = 0; i < matchingQueries.length; i++) {
          var regx = new RegExp('\\' + queryNameToken, "g");
          queryItem.options.push({
            id: matchingQueries[i].getId(),
            name: matchingQueries[i].getDescription().replace(regx, term),
            datasource: matchingQueries[i].getParent().getId(),
            value: i,
            queryObj: matchingQueries[i]
          }
          );
        }

        // count how many occurrences of term we have in the model
        var termCount = 0;
        for (var i = 0; i < this.props.model.items.length; i++) {
          if (this.props.model.items[i].term == term) {
            termCount++;
          }
        }

        // generate a unique id for the query item
        queryItem.id = term + '_' + termCount.toString();
        // add default selection
        queryItem.selection = -1;
        // add default option
        queryItem.options.splice(0, 0, { name: 'Select query for ' + term, value: -1 });

        var callback = function () {
          this.showBrentSpiner(false);
        };

        // hide footer and show spinner
        this.showBrentSpiner(true);

        // add query item to model
        this.props.model.addItem(queryItem, callback.bind(this));

        // check if we have a queryObj parameter and set it as the selected item
        if (queryItemParam.queryObj != undefined) {
          // figure out which option it matches to and trigger selection
          var val = -1;
          for (var h = 0; h < queryItem.options.length; h++) {
            if (queryItem.options[h].value != -1 && queryItem.options[h].id == queryItemParam.queryObj.getId()) {
              val = queryItem.options[h].value;
            }
          }

          if (val != -1) {
            this.queryOptionSelected(queryItem, val, cb);
          }
        }
      } else {
        // notify no queries available for the selected term
        this.setErrorMessage("No queries available for the selected term.");
      }

      /*
       * init datasource results to avoid duplicates
       * if(typeof this.dataSourceResults.clear == 'function') {
       */
      this.dataSourceResults.clear();
      // }
    }

    setErrorMessage (message) {
      this.setState({ errorMsg: message });
    }

    clearErrorMessage () {
      this.setErrorMessage('');
    }

    resultSetSelectionChange (val) {
      this.props.model.resultSelectionChanged(val);
      this.props.model.results.map((resultItem, index) => {
        if (val === resultItem.label) {
          this.setState({ value: index });
        }
      });
    }

    downloadQueryResults (resultsItem) {
      var convertArrayOfObjectsToCSV = function (args) {
        var result, ctr, keys, columnDelimiter, lineDelimiter, data;

        data = args.data || null;
        if (data == null || !data.length) {
          return null;
        }

        columnDelimiter = args.columnDelimiter || ',';
        lineDelimiter = args.lineDelimiter || '\n';

        keys = Object.keys(data[0]);

        result = '';
        result += '"' + keys.join('"' + columnDelimiter + '"') + '"';
        result += lineDelimiter;

        data.forEach(function (item) {
          ctr = 0;
          keys.forEach(function (key) {
            if (ctr > 0) {
              result += columnDelimiter;
            }

            result += '"' + item[key] + '"';
            ctr++;
          });
          result += lineDelimiter;
        });

        return result;
      };

      var downloadCSV = function (args) {
        var data, filename, link, extension;

        var isJson = data => {
          try {
            return (JSON.parse(data) && data);
          } catch (e) {
            return false;
          }
        }
        var records = args.data.map(function (record) {
          var instance = new Object();
          for (var counter = 0; counter < args.columnsPresent.length; counter++) {
            if (args.columnsPresent[counter] == "controls") {
              continue;
            }
            if (args.columnsPresent[counter] == "images") {
              if (isJson(record[args.columnsPresent[counter]])){
                if (JSON.parse(record[args.columnsPresent[counter]]).initialValues[0].value.elements) {
                  instance[args.columnsPresent[counter]] = JSON.parse(record[args.columnsPresent[counter]]).initialValues[0].value.elements[0].initialValue.data;
                  continue;
                } else if (JSON.parse(record[args.columnsPresent[counter]]).initialValues[0].value.data) {
                  instance[args.columnsPresent[counter]] = JSON.parse(record[args.columnsPresent[counter]]).initialValues[0].value.data;
                  continue;
                }
              }
            }
            instance[args.columnsPresent[counter]] = record[args.columnsPresent[counter]];
          }
          return instance;
        });

        var csv = convertArrayOfObjectsToCSV({ data: records });
        if (csv == null) {
          return;
        }

        extension = '.csv'
        filename = args.filename || 'export.csv';

        if (!filename.includes(extension)) {
          filename += extension
        }

        if (!csv.match(/^data:text\/csv/i)) {
          csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
      };

      downloadCSV({
        filename: resultsItem.verboseLabelPLain.replace(/ /g, '_'),
        data: resultsItem.records,
        columnsPresent: resultsItem.columnsPresent,
        headersColumns: resultsItem.headersColumns,
        datasourceConfig: this.configuration.DataSources[Object.keys(this.configuration.DataSources)[0]],
      });
    }

    refresh () {
      this.setState({ refreshTrigger: !this.state.refreshTrigger });
    }

    render () {
      const { value } = this.state;
      var markup = null;

      if (this.state.display === false) {
        return markup;
      }
      // once off figure out if we are to use infinite scrolling for results and store in state
      if (this.state.infiniteScroll === undefined) {
        this.state.infiniteScroll = !(this.props.enablePagination != undefined && this.props.enablePagination === true);
        this.state.resultsPerPage = this.props.resultsPerPage;
      }

      // figure out if we are in results view or query builder view
      if (this.state.resultsView && this.props.model.results.length > 0) {
        /*
         * if results view, build results markup based on results in the model
         * figure out focus tab index (1 based index)
         */
        resultsViewState = true;
        var focusTabIndex = 0;
        for (var i = 0; i < this.props.model.results.length; i++) {
          if (this.props.model.results[i].selected) {
            focusTabIndex = i;
          }
        }

        /*
         * set data for each tab based on results from the model
         * for each tab put a Griddle configured with appropriate column meta
         */
        var tabs = this.props.model.results.map(function (resultsItem, index) {
          var getVerboseLabelMarkup = function () {
            return { __html: resultsItem.verboseLabel };
          };

          return (focusTabIndex === index
                            && <Typography component="div" key={index}>
                              <div className="result-verbose-label" dangerouslySetInnerHTML={getVerboseLabelMarkup()}></div>
                              <div className="clearer"></div>
                              <Griddle
                                showFilter={true}
                                initialSort={this.sorterColumn.column}
                                showSettings={false}
                                useGriddleStyles={false}
                                results={resultsItem.records}
                                columns={resultsItem.columnsToShow}
                                bodyHeight={(window.innerHeight - 280)}
                                resultsPerPage={this.state.resultsPerPage}
                                columnMetadata={this.state.resultsColumnMeta}
                                enableInfiniteScroll={this.state.infiniteScroll} />
                            </Typography>
          );
        }, this);

        var loadHandler = function (self) {
          GEPPETTO.on("query_closed", function () {
            if (self.state.open) {
              self.toggleMenu();
            }
          });
        };

        var configuration = {
          id: "queryResultsButton",
          openByDefault: false,
          closeOnClick: true,
          label: "",
          iconOn: 'fa fa-history fa-2x',
          iconOff: 'fa fa-history fa-2x',
          menuPosition: null,
          menuSize: { height: "auto", width: 750 },
          menuCSS: "queryButtonMenu",
          autoFormatMenu: true,
          onClickHandler: this.resultSetSelectionChange,
          onLoadHandler: loadHandler,
          menuItems: []
        };

        var menuItems = this.props.model.results.map(function (resultItem) {
          return { label: resultItem.verboseLabelPLain, value: resultItem.id, icon: "fa-cogs" };
        });

        configuration["menuItems"] = menuItems;

        this.initTypeAheadCreated = false;

        markup = (
          <div id="query-results-container" className="center-content" ref={this.setWrapperRef}>
            { this.props.showClose === true
              ? <div onClick={this.close} className="fa fa-times" id="closeQuery" />
              : undefined
            }
            <MenuButton configuration={configuration} />
            {tabs}
            <button id="switch-view-btn" className="fa fa-angle-left querybuilder-button"
              title="Back to query" onClick={this.switchView.bind(null, false, false)}>
              <div className="querybuilder-button-label">Refine query</div>
            </button>
            <button id="switch-view-clear-btn" className="fa fa-cog querybuilder-button"
              title="Start new query" onClick={this.switchView.bind(null, false, true)}>
              <div className="querybuilder-button-label">New query</div>
            </button>
            <button id="delete-result-btn" className="fa fa-trash-o querybuilder-button"
              title="Delete results"
              onClick={this.queryResultDeleted.bind(null, this.props.model.results[focusTabIndex])}>
              <div className="querybuilder-button-label">Delete results</div>
            </button>
            <button id="download-result-btn" className="fa fa-download querybuilder-button"
              title="Download results"
              onClick={this.downloadQueryResults.bind(null, this.props.model.results[focusTabIndex])}>
              <div className="querybuilder-button-label">Download results (CSV)</div>
            </button>
          </div>
        );

      } else {
        /*
         * if we ended up in query builder rendering make sure the state flag is synced up
         * NOTE: this could happen if we were in resultsView and the user deleted all the results
         */
        this.state.resultsView = false;
        resultsViewState = this.state.resultsView;

        // build QueryItem list
        var queryItems = this.props.model.items.map(function (item) {
          return (
            <QueryItem
              key={item.id}
              item={item}
              onSelectOption={this.queryOptionSelected}
              onDeleteItem={this.queryItemDeleted.bind(null, item)}
            />
          );
        }, this);

        var spinnerClass = this.state.showSpinner ? 'fa fa-cog fa-spin' : 'hide';
        var footerClass = this.state.showSpinner ? 'hide' : '';
        var closeIconId = this.state.showSpinner ? 'hide' : 'closeQuery2';

        markup = (
          <div id="query-builder-container" ref={this.setWrapperRef}>
            { this.props.showClose === true
              ? <div onClick={this.close} className="fa fa-times" id={closeIconId} />
              : undefined
            }
            <div id="query-builder-items-container">
              {queryItems}
            </div>
            <div id="add-new-query-container">
              <button id="add-query-btn" className="fa fa-plus" title="add query" />
              <input id='query-typeahead' className="typeahead" type="text" placeholder="Search for the item you'd like to query against..." />
            </div>
            <QueryFooter containerClass={footerClass} count={this.props.model.count} onRun={this.runQuery} />
            <div id="brent-spiner" className={spinnerClass}></div>
            <div id="query-error-message">{this.state.errorMsg}</div>
          </div>
        );
      }

      return (
        <div id="querybuilder" style={{ top: 0, display: 'block' }}>
          {markup}
        </div> );
    }
  }

  QueryBuilder.defaultProps = { model: queryBuilderModel };

  return QueryBuilder;
});
