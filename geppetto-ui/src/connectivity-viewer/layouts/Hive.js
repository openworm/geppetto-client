

// import * as d3 from "d3";
const d3 = require("d3");

export class Hive {
  constructor (calculateNodeDegrees) {
    this.calculateNodeDegrees = calculateNodeDegrees
  }

  draw (context) {
    if (this.calculateNodeDegrees !== null) {
      context.calculateNodeDegrees(this.calculateNodeDegrees)
    }
    const hiveLink = require("d3-plugins-dist/dist/mbostock/hive/cjs")["default"]();

    const innerRadius = 20;
    const outerRadius = 180;

    const angle = d3.scalePoint().domain(d3.range(context.dataset.nodeTypes.length + 1)).range([0, 2 * Math.PI]);
    const quali_angle = d3.scaleBand().domain(context.dataset.nodeTypes).range([0, 2 * Math.PI]);
    const radius = d3.scaleLinear().range([innerRadius, outerRadius]);
    const linkTypeScale = d3.scaleOrdinal(d3.schemeCategory10).domain(context.dataset.linkTypes);
    const nodeTypeScale = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);

    const nodes = context.dataset.nodes,
      links = [];
    context.dataset.links.forEach(function (li) {
      if (typeof li.target !== "undefined") {
        links.push({ source: nodes[li.source], target: nodes[li.target], type: li.type });
      }
    });

    const svg = context.svg.append("g")
      .attr("transform", "translate(" + context.width / 2 + "," + context.height / 2 + ")");

    svg.selectAll(".axis")
      .data(d3.range(context.dataset.nodeTypes.length))
      .enter().append("line")
      .attr("class", "axis")
      .attr("transform", function (d) {
        return "rotate(" + degrees(angle(d)) + ")";
      })
      .attr("x1", radius.range()[0])
      .attr("x2", radius.range()[1])
      .style('stroke', "#000").style('stroke-width', '1.5px');

    svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", hiveLink
        .angle(function (d) {
          return quali_angle(d.type);
        })
        .radius(function (d) {
          return radius(d.degree);
        }))
      .style("stroke", function (d) {
        return linkTypeScale(d.type);
      }).style('fill', "none").style('stroke-width', '1.5px').style('stroke-opacity', 0.3);

    const node = svg.selectAll(".node")
      .data(nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "rotate(" + degrees(quali_angle(d.type)) + ")";
      })
      .attr("cx", function (d) {
        return radius(d.degree);
      })
      .attr("r", 5)
      .style("fill", function (d) {
        return nodeTypeScale(d.type);
      });

    node.append("title")
      .text(function (d) {
        return d.id;
      });

    function degrees (radians) {
      return radians / Math.PI * 180 - 90;
    }
  }

  getLegends (context){
    return [];
  }

  getName (){
    return "Hive"
  }

  hasTooltip (){
    return false
  }

  hasToggle (){
    return false
  }

  hasSelect (){
    return false
  }
}