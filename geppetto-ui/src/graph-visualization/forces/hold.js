// reset position of particles to default position
export default function () {
  var nodes;
  
  function force () {
    var i,
      n = nodes.length,
      node;
    
    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (node.defaultX) {
        node.x = node.defaultX
        if (node.defaultY) {
          node.y = node.defaultY 
        }
        if (node.defaultZ) {
          node.z = node.defaultZ 
        }
      }
      
    }
  }

  force.initialize = function (_) {
    nodes = _;
  };

  return force;
}
