define(function (require) {

  require("../query.less");
  require("../react-simpletabs.less");

  var React = require('react');
  var GEPPETTO = require('geppetto');
  var slick = require('slick-carousel');

  class SlideshowImageComponent extends React.Component {
    constructor (props) {
      super(props);

      this.checkboxAction = this.checkboxAction.bind(this);
      this.fireImageAction = this.fireImageAction.bind(this);
      this.getImageInstanceVisibility = this.getImageInstanceVisibility.bind(this);

      let initialCheckBoxState = this.getImageInstanceVisibility(this.props.rowData.id)

      this.state = {
        carouselFullyLoaded: false,
        checked: initialCheckBoxState,
        imageID : '',
        imageInstanceLoading : false,
        initialSlide : 0
      };

      this.isCarousel = false;
      this.imageContainerId = '';
      this.fullyLoaded = false;
      this.initialSlide = 0;

      this.slickIndexes = {};
    }

    getImageInstanceVisibility (path) {
      let initialCheckBoxState = false;
      try {
        let imageVariable = eval(path);
        if (imageVariable !== undefined) {
          if (imageVariable.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
            initialCheckBoxState = imageVariable.isVisible();
          } else {
            initialCheckBoxState = true;
          }
        }
      } catch (e) {
        console.warn("Instance Variable not Found : " + path);
      }

      return initialCheckBoxState;
    }

    getImageClickAction (path) {
      var that = this;

      var action = function (e) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();

        if (!that.state.imageInstanceLoading) {
          var index = that.slickIndexes[path];
          that.setState({ checked: true, imageInstanceLoading: true, imageID: path , initialSlide : index }, () => {
            var actionStr = that.props.metadata.actions.addInstance;
            actionStr = actionStr.replace(/\$entity\$/gi, that.state.imageID);
            GEPPETTO.CommandController.execute(actionStr);

          }); 
        }
      };

      return action;
    }

    /**
     * Instance deleted, update state to re-render checbox
     */
    deletedInstance (instance) {
      if (this.state.imageID !== "") {
        if (instance.startsWith(this.state.imageID)) {
          this.setState ( { imageInstanceLoading : false } );
        }
      }
    }

    /**
     * Instance added, update state to re-render checbox
     */
    addedInstance (instances) {
      let that = this;
      if (typeof instances === "string") {
        if (instances.startsWith(this.state.imageID) || this.state.imageID === "") {
          setTimeout(
            function () {
              that.setState ( { imageInstanceLoading : false } );
            }, 1000);
        }
      } else {
        if (this.state.imageID !== "") {
          if (instances[0].getInstancePath().startsWith(this.state.imageID)) {
            // Give a second before updating the checkbox state, otherwise set State happens too fast
            setTimeout(
              function () { 
                that.setState ( { imageInstanceLoading : false } ); 
              }, 1000);
          }
        }
      }
    }

    componentDidMount () {
      var that = this;

      // apply carousel
      if (this.isCarousel) {
        var slickDivElement = $('#' + this.imageContainerId + '.slickdiv');
        slickDivElement.not('.slick-initialized').slick();

        // reload slick carousel if it's first time clicking on arrow in any direction
        slickDivElement.find(".slick-arrow").on("click", function () {
          if (!that.fullyLoaded) {
            that.setState({ carouselFullyLoaded: true });
            that.fullyLoaded = true;
          }
        }, { passive: true });
      }

      GEPPETTO.on(GEPPETTO.Events.Instance_deleted, this.deletedInstance, this);
      GEPPETTO.on(GEPPETTO.Events.Instance_added, this.addedInstance, this);
    }

    componentWillUnmount () {
      // Remove listeners once unmounted
      GEPPETTO.off(GEPPETTO.Events.Instance_deleted, this.deletedInstance, this);
      GEPPETTO.off(GEPPETTO.Events.Instances_created, this.addedInstance, this);
    }

    /**
     * Fire action associated with image, can't reuse same method as image click 'getImageClickAction'
     * to avoid events error from 'onclick' and 'onchange'
     */
    fireImageAction (add, path) {
      var actionStr = this.props.metadata.actions.addInstance;
      if (!add){
        actionStr = this.props.metadata.actions.deleteInstance;
      }
      actionStr = actionStr.replace(/\$entity\$/gi, path);
      GEPPETTO.CommandController.execute(actionStr);
    }

    checkboxAction (event, path) {
      
      // Retrieve checkbox 'checked' and store in state
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      
      let that = this;
      var index = that.slickIndexes[path];
      this.setState({ checked: value, imageID: path, imageInstanceLoading: true , initialSlide : index }, () => {
        let add = true;
        try {
          let imageVariable = eval(that.state.imageID);
          if (imageVariable !== undefined) {
            if (imageVariable.isVisible()) {
              add = false;
            }
          }
        } catch (e) {
          console.info("Instance Variable not Available for Toggling Visibility ");
        }

        that.fireImageAction(add, that.state.imageID);
      });
    }

    buildImage (thumbImage, imageContainerId) {
      var action = this.getImageClickAction(thumbImage.reference);
      var checked = this.state.checked;
      if (this.state.imageID === "") {
        checked = this.getImageInstanceVisibility(thumbImage.reference);
      }
      const imgElement = <div id={imageContainerId} className="query-results-image collapse in"> {thumbImage.name}
        <a href='' onClick={action}>
          <img className="query-results-image invert" src={thumbImage.data} />
        </a>
        {this.state.imageInstanceLoading
          ? (<div id={imageContainerId + "-loader"} className="loader"></div>)
          : (<input id={imageContainerId + "-checkbox"} className="query-results-checkbox" type="checkbox"
            onChange={event => this.checkboxAction(event, thumbImage.reference)} checked={checked} />)
        }
      </div>
      return imgElement;
    }

    buildCarousel () {
      var jsonImageVariable = JSON.parse(this.props.data);
      var imgElement = "";

      if (jsonImageVariable.initialValues[0] != undefined) {
        var imageContainerId = this.props.rowData.id + '-image-container';
        this.imageContainerId = imageContainerId;

        var value = jsonImageVariable.initialValues[0].value;
        if (value.eClass == GEPPETTO.Resources.ARRAY_VALUE) {
          if (value.elements.length > 1) {
            this.isCarousel = true;
            var imagesToLoad = 2;
            if (this.state.carouselFullyLoaded) {
              imagesToLoad = value.elements.length;
            }

            // set flag to fully loaded if total length of images to render is less or equal to 2
            if (value.elements.length <= 2) {
              this.fullyLoaded = true;
            }

            var that = this;
            // if it's an array, create a carousel (relies on slick)
            var elements = value.elements.map(function (item, key, index) {
              if (key < imagesToLoad) {
                var image = item.initialValue;
                var action = that.getImageClickAction(image.reference);
                
                // Since a carousel has multiple images, we make sure the image getting rendered here is the one saved in the state
                var loading = that.state.imageInstanceLoading;
                if ( that.state.imageID !== image.reference ) {
                  loading = false;
                }

                // Retrieve image variable visibility to determine state of checkbox
                var checked = that.getImageInstanceVisibility(image.reference);

                // Store images in slick container in a map, need to know their indexes for position
                that.slickIndexes[image.reference] = key;

                return <div key={key} className="query-results-slick-image"> {image.name}
                  <a href='' onClick={action}>
                    <img className="popup-image invert" src={image.data} />
                  </a>
                  {loading
                    ? (<div id={image.reference + "-loader"} className="loader"></div>)
                    : (<input id={image.reference + "-checkbox"} className="query-results-checkbox" type="checkbox"
                      onChange={event => that.checkboxAction(event, image.reference)} checked={checked} />)
                  }
                </div>
              }
            });

            elements = elements.slice(0, imagesToLoad);

            imgElement = <div id={imageContainerId} className="slickdiv query-results-slick collapse in"
              data-slick={JSON.stringify({ fade: true, centerMode: true, slidesToShow: 1, slidesToScroll: 1 , initialSlide : parseInt(that.state.initialSlide) })}>
              {elements}
            </div>
          } else {
            imgElement = this.buildImage(value.elements[0].initialValue, imageContainerId, this.props.rowData.id);
          }
        } else if (value.eClass == GEPPETTO.Resources.IMAGE) {
          // otherwise we just show an image
          imgElement = this.buildImage(value, imageContainerId, this.props.rowData.id);
        }
      }

      return imgElement;
    }

    render () {
      var imgElement = "";
      if (this.props.data != "" && this.props.data != undefined) {
        imgElement = this.buildCarousel();
      }

      return (
        <div>
          {imgElement}
        </div>
      )
    }
  }

  return SlideshowImageComponent;
});
