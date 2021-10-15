

// import * as d3 from "d3";
const d3 = require("d3");
import * as util from "../../utilities";


export class Chord {
  constructor (calculateNodeDegrees) {
    this.calculateNodeDegrees = calculateNodeDegrees
  }


  draw (context) {
    if (this.calculateNodeDegrees !== null) {
      context.calculateNodeDegrees(this.calculateNodeDegrees)
    }
    const matrix = this.generateChordMatrix(context);

    const pi = Math.PI;
    const halfpi = pi / 2;
    const dr = 15;
    const innerRadius = Math.min(context.width, context.height) * .41,
      outerRadius = innerRadius * 1.05;

    // if no custom colors set then use d3 provided color scheme
    const fill = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);

    const svg = context.svg.append("g")
      .attr("transform", "translate(" + context.width / 2 + "," + context.height / 2 + ")");

    const chord = this.layout_chord()
      .padding(.05)
      .matrix(matrix);

    chord.groups().forEach(function (g, i) {
      g.id = context.dataset.nodeTypes[i]
    });

    const slice = svg.append("g").selectAll("path")
      .data(chord.groups)
      .enter().append("path")
      .style("fill", function (d) {
        return fill(d.id);
      })
      .style("stroke", function (d) {
        return fill(d.id);
      })
      .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
      .on("mouseover", fade_over(.1))
      .on("mouseout", fade_out(1));

    slice.append("title").text(function (d) {
      return d.id;
    });


    const svg_asymChord = function () {
      let source = function (d) {
          return d.source
        }, target = function (d) {
          return d.target
        }, radius = function (d) {
          return d.radius
        }, startAngle = function (d) {
          return d.startAngle
        }, endAngle = function (d) {
          return d.endAngle
        };

      function chord (d, i) {
        const s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
        // var [s_p0s, s_p1s] = shift_radius(s)
        const shifted = shift_radius(t);
        const t_p0s = shifted[0];
        const t_p1s = shifted[1];

        return "M" + s.p0
                    + arc(s.r, s.p1, s.a1 - s.a0)
                    + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t_p0s)
                        + arc(t.r - dr, t_p1s, t.a1 - t.a0)
                        + curve((t.r - dr), t_p1s, s.r, s.p0))
                    + "Z";
      }

      function shift_radius (d) {
        return [[d.p0[0] - dr * Math.cos(d.a0), d.p0[1] - dr * Math.sin(d.a0)],
                [d.p1[0] - dr * Math.cos(d.a1), d.p1[1] - dr * Math.sin(d.a1)]]

      }

      function subgroup (self, f, d, i) {
        const subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i),
          a0 = startAngle.call(self, subgroup, i) - halfpi, a1 = endAngle.call(self, subgroup, i) - halfpi;
        return {
          r: r,
          a0: a0,
          a1: a1,
          p0: [r * Math.cos(a0), r * Math.sin(a0)],
          p1: [r * Math.cos(a1), r * Math.sin(a1)]
        };
      }

      function equals (a, b) {
        return a.a0 === b.a0 && a.a1 === b.a1;
      }

      function arc (r, p, a) {
        return "A" + r + "," + r + " 0 " + +(a > pi) + ",1 " + p;
      }

      function curve (r0, p0, r1, p1) {
        return "Q 0,0 " + p1;
      }

      function constant (x) {
        return function () {
          return x;
        };
      }

      chord.radius = function (v) {
        if (!arguments.length) {
          return radius;
        }
        radius = typeof x === "function" ? v : constant(v);
        return chord;
      };
      chord.source = function (v) {
        if (!arguments.length) {
          return source;
        }
        source = typeof x === "function" ? v : constant(v);
        return chord;
      };
      chord.target = function (v) {
        if (!arguments.length) {
          return target;
        }
        target = typeof x === "function" ? v : constant(v);
        return chord;
      };
      chord.startAngle = function (v) {
        if (!arguments.length) {
          return startAngle;
        }
        startAngle = typeof x === "function" ? v : constant(v);
        return chord;
      };
      chord.endAngle = function (v) {
        if (!arguments.length) {
          return endAngle;
        }
        endAngle = typeof x === "function" ? v : constant(v);
        return chord;
      };
      return chord;
    };
    svg.append("g")
      .attr("class", "chord")
      .selectAll("path")
      .data(chord.chords)
      .enter().append("path")
      .attr("d", function (d, i) {
        return svg_asymChord().radius(innerRadius)(d, i)
      })
      .style("fill", function (d) {
        return fill(context.dataset.nodeTypes[d.target.index]);
      })
      .style("opacity", 1);

    function fade_over (opacity) {
      return function (g, i) {
        let filter = function (d) {
          return d.source.index !== i && d.target.index !== i
        };
        if (d3.event.shiftKey) {
          filter = function (d) {
            return d.target.index !== i
          };
        } else if (d3.event.ctrlKey) {
          filter = function (d) {
            return d.source.index !== i
          }
        }
        svg.selectAll(".chord path")
          .filter(filter)
          .transition()
          .style("opacity", opacity);
      };
    }

    function fade_out (opacity) {
      return function (g, i) {
        svg.selectAll(".chord path")
          .transition()
          .style("opacity", opacity);
      };
    }
  }

  generateChordMatrix (context) {
    const matrix = [];

    const type2type = {};

    // {type_i: {postType_j: counts, ...}, ...}
    const typesZeros = util.map(context.dataset.nodeTypes, function (type) {
      return [type, 0]
    });
    context.dataset.nodeTypes.forEach(function (type) {
      const initCounts = util._object(typesZeros);
      const linksFromType = util.filter(context.dataset.links, function (link) {
        return context.dataset.nodes[link.source].type === type
      });

      type2type[type] = util._extend(initCounts, util.countBy(linksFromType, function (link) {
        return context.dataset.nodes[link.target].type
      }));

    });
    util.countBy(context.dataset.nodes, function (node) {
      return node.type
    });
    /*
     *        //unconnected nodes of all types
     *        var discNodes = util.filter(context.dataset.nodes, function (node) {
     *            return node.degree == 0
     *        });
     *        var numDiscByType = util.countBy(discNodes, function (node) {
     *            return node.type
     *        });
     */

    context.dataset.nodeTypes.forEach(function (type, idx, nodeTypes) {
      const numConn = [];
      nodeTypes.forEach(function (innerType) {
        /*
         * normalization should be optional
         * numConn.push[type2type.innerType] / numNodesOfType[type];
         */
        numConn.push(type2type[type][innerType]);
      });
      //            numConn.push(numDiscByType[type] ? numDiscByType[type] : 0);
      matrix.push(numConn);
    });
    /*
     *        // row of zeros for unconnected nodes
     *        var zeroes = [];
     *        for (var i = 0; i <= context.dataset.nodeTypes.length; i++) {
     *            zeroes.push(0)
     *        }
     *        matrix.push(zeroes);
     */
    return matrix;
  }


  layout_chord () {
    let chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    const pi = Math.PI;
    const tau = 2 * pi;
    function arrayRotate (arr, count) {
      count = count % arr.length;
      if (count < 0) {
        arr.unshift.apply(arr, arr.splice(count));
      } else {
        arr.push.apply(arr, arr.splice(0, count));
      }
      return arr;
    }
    function relayout () {
      let a1;
      let a0;
      let v;
      let dj;
      let di;
      let subgroups = {}, groupSums = [], groupSumsT = new Array(n).fill(0), groupIndex = d3.range(n),
        subgroupIndex = [], k, x, y, x0, i, j;
      chords = [];
      groups = [];
      k = 0;
      i = -1;
      while (++i < n) {
        x = 0;
        j = -1;
        while (++j < n) {
          x += matrix[i][j];
          groupSumsT[j] += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(arrayRotate(d3.range(n).reverse(), -i));
        k += x;
      }
      k += d3.sum(groupSumsT);
      if (sortGroups) {
        groupIndex.sort(function (a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function (d, i) {
          d.sort(function (a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (tau - padding * n) / k;
      x = 0;
      y = 0;
      i = -1;
      while (++i < n) {
        j = -1;
        y += k * (groupSums[i] + matrix[i][i]);
        x0 = x;
        while (++j < n) {
          di = groupIndex[i];
          dj = subgroupIndex[di][j];
          if (di !== dj) {
            // pre arcs
            v = matrix[di][dj];
            a0 = x;
            x += v * k;
            a1 = x;

            subgroups[di + "-" + dj + "_pre"] = {
              index: di,
              subindex: dj,
              startAngle: a0,
              endAngle: a1,
              value: v
            };

            // post arcs
            const w = matrix[dj][di];
            const a0post = y;
            y += w * k;
            const a1post = y;

            subgroups[dj + "-" + di + "_post"] = {
              index: di,
              subindex: dj,
              startAngle: a0post,
              endAngle: a1post,
              value: w
            };
          } else { // i->i conn
            v = matrix[i][i];
            a0 = x0 + (groupSums[i] - v) * k;
            a1 = a0 + 2 * k * v;
            // x += k * v;
            subgroups[i + "-" + i + "_pre"] = subgroups[i + "-" + i + "_post"] = {
              index: i,
              subindex: i,
              startAngle: a0,
              endAngle: a1,
              value: v
            };
          }
        }
        x += k * (groupSumsT[di] + matrix[di][di]) + padding;
        y += padding;
      }

      // slices
      i = -1;
      x = 0;
      x0 = 0;
      while (++i < n) {
        x0 = x;
        di = groupIndex[i];
        dj = subgroupIndex[di][j];
        x += k * (groupSums[di] + groupSumsT[di]);
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k,
        };
        x += padding;
      }

      i = -1;
      while (++i < n) {
        j = -1;
        while (++j < n) {
          const source = subgroups[i + "-" + j + "_pre"], target = subgroups[i + "-" + j + "_post"];
          if (source.value || target.value) {
            chords.push({
              source: source,
              target: target
            });
          }
        }
      }

      if (sortChords) {
        resort();
      }
    }

    function resort () {
      chords.sort(function (a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function (x) {
      if (!arguments.length) {
        return matrix;
      }
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function (x) {
      if (!arguments.length) {
        return padding;
      }
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function (x) {
      if (!arguments.length) {
        return sortGroups;
      }
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function (x) {
      if (!arguments.length) {
        return sortSubgroups;
      }
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function (x) {
      if (!arguments.length) {
        return sortChords;
      }
      sortChords = x;
      if (chords) {
        resort();
      }
      return chord;
    };
    chord.chords = function () {
      if (!chords) {
        relayout();
      }
      return chords;
    };
    chord.groups = function () {
      if (!groups) {
        relayout();
      }
      return groups;
    };
    return chord;
  }

  getLegends (context){
    const nodeTypeScale = context.nodeColormap.range ? context.nodeColormap : d3.scaleOrdinal(d3.schemeCategory20);
    return [
      { id:'legend', colorScale:nodeTypeScale, title:"Populations" }
    ];
  }

  getName (){
    return "Chord"
  }

  hasTooltip (){
    return false
  }

  hasToggle (){
    return true
  }

  hasSelect (){
    return false
  }
}
