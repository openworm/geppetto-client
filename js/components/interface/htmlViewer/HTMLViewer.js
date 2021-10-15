define(function (require) {

  require("./HTMLViewer.less");

  var React = require('react');
  var ReactDOM = require('react-dom');

  var AbstractComponent = require('../../AComponent');

  return class HTMLViewer extends AbstractComponent {

    constructor (props) {
      super(props);

      this.state = { content: this.props.content, };
      this.htmlViewer = React.createRef();
      this.handleClick = this.handleClick.bind(this);
    }

    setContent (content) {
      this.setState({ content });
    }

    UNSAFE_componentWillReceiveProps (nextProps) {
      if (nextProps.content != this.props.content) {
        this.setState({ content: nextProps.content });
      }
    }

    componentDidMount (){
      var element = ReactDOM.findDOMNode(this.htmlViewer.current);
      element.setAttribute('tabIndex', -1);
    }

    handleClick (e){
      var $el = $(e.target);
      if ($el.is('a') && $el.data('action')) {
        this.props.handleClick($el, $el.data('action'));
      }
    }

    render () {
      return (
        <div key={this.props.id + "_component"} id={this.props.id + "_component"} className="htmlViewer" ref={this.htmlViewer} style={this.props.style} className={this.props.class}>
          <div dangerouslySetInnerHTML={{ __html: this.state.content }} onClick={this.handleClick}></div>
        </div>
      )
    }
  };
});
