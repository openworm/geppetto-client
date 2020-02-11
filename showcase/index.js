import ReactDOM from "react-dom";
import React from 'react';
import Application from "./components/Application";
import mainCss from './main.less';

const wrapper = document.getElementById("main");
console.log(wrapper);
ReactDOM.render(<Application />, wrapper);
