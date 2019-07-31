import FontAwesome from 'react-fontawesome';
import React from 'react';

const BaseIconComponent = ({ icon, action, color, tooltip }) => 
  <span 
    style={{ color: color }} 
    className='list-icon' 
    title={tooltip}
    onClick={action}>
    <FontAwesome name={icon} />
  </span>

export default BaseIconComponent;