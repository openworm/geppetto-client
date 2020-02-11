var React = require('react');

require('./Logo.less');


export default  GeppettoLogo = (id, logo, propStyle) =>  
        <div id={id} className={logo} style={propStyle}></div>

