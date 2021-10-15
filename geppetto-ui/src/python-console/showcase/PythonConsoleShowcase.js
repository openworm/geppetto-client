import React, { Component } from 'react';
import PythonConsole from './PythonConsole';

export default class PythonConsoleShowcase extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <div>
        <PythonConsole pythonNotebookPath={'notebooks/notebook.ipynb'} />
      </div>
    );
  }
}
