

/**
 * Class used to create widgets and handle widget events from parent class.
 */
define(function (require) {

  return function (GEPPETTO) {

    /**
     *
     * Widgets
     *
     * Different types of widgets that exist
     *
     * @enum
     */
    GEPPETTO.Widgets = {
      PLOT: 0,
      CONNECTIVITY: 6,
      STACKVIEWER: 8 
      // WIDGETNAME: N
    };

    /**
     * @exports Widgets/GEPPETTO.WidgetFactory
     */
    GEPPETTO.WidgetFactory = {

      plotsController: null,
      connectivityController: null,
      treeVis3DController: null,
      stackViewer3DController: null,
      // WIDGETNAMEController: null

      /**
       * Adds widgets to Geppetto
       *
       * @param widgetType - what type of widget gets added
       * @param isStateless - boolean that controls if the widget is stateless and persisted in views or not (false by default)
       * @returns {*}
       */
      addWidget:  function (widgetType, isStateless, callback) {
        return new Promise(resolve => {

          this.getController(widgetType).then(controller => {

            controller.addWidget(isStateless).then(widget => {
              if (callback){
                callback(widget);
              }
              resolve(widget);
            });

          });

        });
      },

      getController: function (type) {
        return new Promise(resolve => {
          require.ensure([],function (require){
                  
            if (type == GEPPETTO.Widgets.PLOT) {
              if (this.plotsController == null || undefined) {
                var PlotsController = require('./plot/controllers/PlotsController');
                this.plotsController = new PlotsController();
              }
              resolve(this.plotsController);
            } else if (type == GEPPETTO.Widgets.CONNECTIVITY) {
              if (this.connectivityController == null || undefined) {
                var ConnectivityController = require('./connectivity/controllers/ConnectivityController');
                this.connectivityController = new ConnectivityController();
              }
              resolve(this.connectivityController);
            } else if (type == GEPPETTO.Widgets.STACKVIEWER) {
              if (this.stackViewerController == null || undefined) {
                var StackViewerController = require('./stackViewer/controllers/StackViewerController');
                this.stackViewerController = new StackViewerController();
              }
              resolve(this.stackViewerController);
            }
            /*
             * Use as template for new widgets
             * else if (type == GEPPETTO.Widgets.WIDGETNAME) {
             *    if (this.WIDGETNAMEController == null || undefined) {
             *    WIDGETNAMEController = require('widgets/buttonBar/controllers/WIDGETNAMEController');
             *        this.WIDGETNAMEController = new WIDGETNAMEController();
             *    }
             *    return this.WIDGETNAMEController;
             * }
             */
          });
        });

      }
    };
  };
});
