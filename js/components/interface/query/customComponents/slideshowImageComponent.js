define(function (require) {

  require("../query.less");
  require("../react-simpletabs.less");

  var React = require('react');
  var GEPPETTO = require('geppetto');
  var slick = require('slick-carousel');

  class SlideshowImageComponent extends React.Component {
    constructor (props) {
      super(props);

      this.state = { carouselFullyLoaded: false };

      this.isCarousel = false;
      this.imageContainerId = '';
      this.fullyLoaded = false;
    }

    getImageClickAction (path) {
      var that = this;

      var action = function (e) {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        var actionStr = that.props.metadata.actions;
        actionStr = actionStr.replace(/\$entity\$/gi, path);
        GEPPETTO.CommandController.execute(actionStr);
        that.props.metadata.queryBuilder.close();
      };

      return action;
    }

    componentDidMount () {
      // apply carousel
      if (this.isCarousel) {
        var slickDivElement = $('#' + this.imageContainerId + '.slickdiv');
        slickDivElement.slick();
        var that = this;

        // reload slick carousel if it's first time clicking on arrow in any direction
        slickDivElement.find(".slick-arrow").on("click", function () {
          if (!that.fullyLoaded) {
            that.setState({ carouselFullyLoaded: true });
            that.fullyLoaded = true;
          }
        }, { passive: true });
      }
    }

    componentDidUpdate () {
      // on component refresh, update slick carousel
      $('#' + this.imageContainerId + '.slickdiv').slick('unslick').slick();
    }

    buildImage (thumbImage, imageContainerId) {
      var action = this.getImageClickAction(thumbImage.reference);
      const imgElement = <div id={imageContainerId} className="query-results-image collapse in">
        <a href='' onClick={action}>
          <img className="query-results-image invert" src={thumbImage.data} />
        </a>
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
            var elements = value.elements.map(function (item, key) {
              if (key < imagesToLoad) {
                var image = item.initialValue;
                var action = that.getImageClickAction(image.reference);
                return <div key={key} className="query-results-slick-image"> {image.name}
                  <a href='' onClick={action}>
                    <img className="popup-image invert" src={image.data} />
                  </a>
                </div>
              }
            });

            elements = elements.slice(0, imagesToLoad);

            imgElement = <div id={imageContainerId} className="slickdiv query-results-slick collapse in"
              data-slick={JSON.stringify({ fade: true, centerMode: true, slidesToShow: 1, slidesToScroll: 1 })}>
              {elements}
            </div>
          } else {
            imgElement = this.buildImage(value.elements[0].initialValue, imageContainerId);
          }
        } else if (value.eClass == GEPPETTO.Resources.IMAGE) {
          // otherwise we just show an image
          imgElement = this.buildImage(value, imageContainerId);
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
