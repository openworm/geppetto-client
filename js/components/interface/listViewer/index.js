import React from "react";
import ReactDOM from "react-dom";
import ListViewerShowcase from "./showcase/ListViewerShowcase";


class MyParentComponent extends React.Component {

    constructor() {
        super();
        this.state = {
            count: 0
        };
    }
    render() {
        return <div>
            <p>Count is: {this.state.count}</p>
            <MyChildComponent myClickCallback={ () => this.setState({count: this.state.count + 1}) } />
            
        </div>
    }
}

class MyChildComponent extends React.Component {

    constructor(props) {
        super(props);
    }
    render() {
        return <button onClick = { this.props.myClickCallback }>Increment</button>
    }
}

ReactDOM.render(<ListViewerShowcase />, document.getElementById("root"));