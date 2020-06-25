define(function (require) {

  require('pixi.js');
  var React = require('react');
  var createClass = require('create-react-class');

  var Canvas = createClass({
    _isMounted: false,
    _initialized: false,

    getInitialState: function () {
      return {
        buffer: {},
        images: {},
        text: this.props.statusText,
        serverUrl: this.props.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol),
        color: this.props.color,
        stack: this.props.stack,
        label: this.props.label,
        pit: this.props.pit,
        yaw: this.props.yaw,
        rol: this.props.rol,
        dst: this.props.dst,
        id: this.props.id,
        minDst: -100,
        maxDst: 100,
        tileX: 1025,
        tileY: 1025,
        imageX: 1024,
        imageY: 1024,
        scl: Number(this.props.scl),
        voxelX: this.props.voxelX,
        voxelY: this.props.voxelY,
        voxelZ: this.props.voxelZ,
        visibleTiles: [0],
        stackViewerPlane: false,
        plane: [0, 0, 0, this.props.width, 0, 0, 0, this.props.height, 0, this.props.width, this.props.height, 0],
        planeUpdating: false,
        lastUpdate: 0,
        updating: false,
        numTiles: 1,
        posX: 0,
        posY: 0,
        oldX: 0,
        oldY: 0,
        loadingLabels: false,
        orth: this.props.orth,
        data: {},
        dragOffset: {},
        dragging: false,
        recenter: false,
        txtUpdated: Date.now(),
        txtStay: 3000,
        objects: [],
        hoverTime: Date.now(),
        lastLabelCall: 0,
        bufferRunning: false,
        iBuffer: {},
        imagesUrl: {}
      };
    },
    /**
     * In this case, componentDidMount is used to grab the canvas container ref, and
     * and hook up the PixiJS renderer
     *
     */
    componentDidMount: function () {
      // signal component mounted (used to avoid calling isMounted() deprecated method)
      this._isMounted = true;

      // console.log('Loading....');

      // Setup PIXI Canvas in componentDidMount
      this.app = new PIXI.Application(this.props.width, this.props.height);
      // maintain full window size
      this.refs.stackCanvas.appendChild(this.app.view);

      // create the root of the scene graph
      this.stage = this.app.stage;
      this.stage.pivot.x = 0;
      this.stage.pivot.y = 0;
      this.stage.position.x = 0;
      this.stage.position.y = 0;
      this.disp = new PIXI.Container();
      this.disp.pivot.x = 0;
      this.disp.pivot.y = 0;
      this.disp.scale.x = this.props.zoomLevel / this.props.scl;
      this.disp.scale.y = this.props.zoomLevel / this.props.scl;
      this.stage.addChild(this.disp);
      this.stack = new PIXI.Container();
      this.stack.pivot.x = 0;
      this.stack.pivot.y = 0;
      this.stack.position.x = 0;
      this.stack.position.y = 0;
      this.state.recenter = true;

      this.createStatusText();

      this.stack.interactive = true;
      this.stack.buttonMode = true;
      this.stack
        // events for drag start
        .on('mousedown', this.onDragStart)
        .on('touchstart', this.onDragStart)
        // events for drag end
        .on('mouseup', this.onDragEnd)
        .on('mouseupoutside', this.onDragEnd)
        .on('touchend', this.onDragEnd)
        .on('touchendoutside', this.onDragEnd)
        // events for drag move
        .on('mousemove', this.onDragMove)
        .on('touchmove', this.onDragMove);

      this.disp.addChild(this.stack);

      // block move event outside stack
      this.app.renderer.plugins.interaction.moveWhenInside = true;

      // call metadata from server
      this.callDstRange();
      this.callTileSize();
      this.callImageSize();

      // start the display
      this.createImages();
      this.animate();

      this.callPlaneEdges();

      setTimeout(this.bufferStack, 30000);

    },

    componentDidUpdate: function () {
      // console.log('Canvas update');
      if (this.app.renderer.width !== Math.floor(this.props.width) || this.app.renderer.height !== Math.floor(this.props.height)) {
        this.app.renderer.resize(this.props.width, this.props.height);
        this.props.onHome();
      }
      this.checkStack();
      this.createImages();
      this.callPlaneEdges();
      this.animate();
    },

    shouldComponentUpdate: function (nextProps, nextState) {
      return shallowCompare(this, nextProps, nextState);

      /**
       * Performs equality by iterating through keys on an object and returning false
       * when any key has values which are not strictly equal between the arguments.
       * Returns true when the values of all keys are strictly equal.
       */
      function shallowEqual (objA, objB) {
        if (objA === objB) {
          return true;
        }

        if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
          return false;
        }

        var keysA = Object.keys(objA);
        var keysB = Object.keys(objB);

        if (keysA.length !== keysB.length) {
          return false;
        }

        // Test for A's keys different from B.
        var bHasOwnProperty = hasOwnProperty.bind(objB);
        for (var i = 0; i < keysA.length; i++) {
          if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
          }
          if (keysA[i] === "color") {
            if (JSON.stringify(objA[keysA[i]]) !== JSON.stringify(objB[keysA[i]])) {
              return false;
            }
          }
        }
        return true;
      }

      function shallowCompare (instance, nextProps, nextState) {
        return (
          !shallowEqual(instance.props, nextProps) || !shallowEqual(instance.state, nextState)
        );
      }
    },


    componentWillUnmount: function () {
      this.refs.stackCanvas.removeChild(this.app.view);
      this.app.destroy(true,true);
      this.app = null;

      if (this.props.canvasRef != null && this.props.canvasRef != undefined) {
        this.props.canvasRef.removeObject(this.state.stackViewerPlane);
      }

      // free texture caches
      var textureUrl;
      for (textureUrl in PIXI.utils.BaseTextureCache) {
        delete PIXI.utils.BaseTextureCache[textureUrl];
      }
      for (textureUrl in PIXI.utils.TextureCache) {
        delete PIXI.utils.TextureCache[textureUrl];
      }

      // signal component is now unmounted
      this._isMounted = false;

      return true;
    },

    callDstRange: function () {
      var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=10.0&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
      /*
       * this.state.buffer[-1].text = 'Buffering stack...';
       *get distance range;
       */
      $.ajax({
        url: image + '&obj=Wlz-distance-range',
        type: 'POST',
        success: function (data) {
          if (data.indexOf('html') < 0) {
            var result = data.trim().split(':')[1].split(' ');
            var min = Number(result[0]);
            var max = Number(result[1]);
            this.setState({ minDst: min, maxDst: max });
            var extent = { minDst: min, maxDst: max };
            this.props.setExtent(extent);
            // console.log('Stack Depth: ' + ((max - min) / 10.0).toFixed(0));
            this.checkStack();
            this.callPlaneEdges();
            this.iBuffer = {};
            this.state.lastUpdate = 0;
            this.bufferStack();
            this.animate();
          }
        }.bind(this),
        error: function (xhr, status, err) {
          console.error("Calling Dst Range", status + " - " + xhr.progress().state(), err.toString());
        }.bind(this)
      });
    },

    callTileSize: function () {
      var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=1.0&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
      // get tile size;
      $.ajax({
        url: image + '&obj=Tile-size',
        type: 'POST',
        success: function (data) {
          if (data.indexOf('html') < 0) {
            var result = data.trim().split(':')[1].split(' ');
            var tileX = Number(result[0]);
            var tileY = Number(result[1]);
            this.setState({ tileX: tileX, tileY: tileY });
            this.checkStack();
            this.callPlaneEdges();
            this.iBuffer = {};
            this.state.lastUpdate = 0;
            this.bufferStack();
            this.animate();
          }
        }.bind(this),
        error: function (xhr, status, err) {
          console.error("Calling Tile Size", status + " - " + xhr.progress().state(), err.toString());
        }.bind(this)
      });
    },

    callImageSize: function () {
      var image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[0] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=10.0&dst=0&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0);
      // get image size;
      $.ajax({
        url: image + '&obj=Max-size',
        type: 'POST',
        success: function (data) {
          if (data.indexOf('html') < 0) {
            var result = data.trim().split(':')[1].split(' ');
            var imageX = Math.ceil( Number(result[0] ));
            var imageY = Math.ceil( Number(result[1] ));
            var extent = { imageX: imageX, imageY: imageY };
            this.setState(extent);
            this.props.setExtent(extent);
            this.checkStack();
            this.callPlaneEdges();
            this.iBuffer = {};
            this.state.lastUpdate = 0;
            this.bufferStack();
            this.animate();
          }
        }.bind(this),
        error: function (xhr, status, err) {
          console.error("Calling Max Size", status + " - " + xhr.progress().state(), err.toString());
        }.bind(this)
      });
    },

    callPlaneEdges: function () {
      if (!this.state.planeUpdating) {
        this.state.planeUpdating = true;
        if (this.stack.width > 1) {
          var coordinates = [];
          var x, y, z;
          // update widget window extents (X,Y):
          if (this.state.orth == 2) {
            x = (this.stack.position.x / this.state.scl) - (this.disp.position.x / (this.disp.scale.x * this.state.scl));
          } else {
            x = -(this.stack.position.x / this.state.scl) - (this.disp.position.x / (this.disp.scale.x * this.state.scl));
          }
          if (this.state.orth == 1) {
            y = (this.stack.position.y / this.state.scl) - (this.disp.position.y / (this.disp.scale.y * this.state.scl));
          } else {
            y = -(this.stack.position.y / this.state.scl) - (this.disp.position.y / (this.disp.scale.y * this.state.scl));
          }
          coordinates[0] = x.toFixed(0);
          coordinates[1] = y.toFixed(0);
          x = x + (this.app.renderer.width / (this.disp.scale.x * this.state.scl));
          y = y + (this.app.renderer.height / (this.disp.scale.y * this.state.scl));
          coordinates[2] = x.toFixed(0);
          coordinates[3] = y.toFixed(0);
          if (this.state.orth == 0) { // frontal
            this.state.plane[0] = coordinates[0];
            this.state.plane[1] = coordinates[1];
            this.state.plane[3] = coordinates[2];
            this.state.plane[4] = coordinates[1];
            this.state.plane[6] = coordinates[0];
            this.state.plane[7] = coordinates[3];
            this.state.plane[9] = coordinates[2];
            this.state.plane[10] = coordinates[3];
          } else if (this.state.orth == 1) { // transverse
            this.state.plane[0] = coordinates[0];
            this.state.plane[2] = coordinates[1];
            this.state.plane[3] = coordinates[2];
            this.state.plane[5] = coordinates[1];
            this.state.plane[6] = coordinates[0];
            this.state.plane[8] = coordinates[3];
            this.state.plane[9] = coordinates[2];
            this.state.plane[11] = coordinates[3];
          } else if (this.state.orth == 2) { // sagittal
            this.state.plane[1] = coordinates[1];
            this.state.plane[2] = coordinates[0];
            this.state.plane[4] = coordinates[1];
            this.state.plane[5] = coordinates[2];
            this.state.plane[7] = coordinates[3];
            this.state.plane[8] = coordinates[0];
            this.state.plane[10] = coordinates[3];
            this.state.plane[11] = coordinates[2];
          }
        }
        // Pass Z coordinates
        z = ((this.state.dst - ((this.state.minDst / 10.0) * this.state.scl)) / this.state.scl);
        if (this.state.orth == 0) { // frontal
          this.state.plane[2] = z;
          this.state.plane[5] = z;
          this.state.plane[8] = z;
          this.state.plane[11] = z;
        } else if (this.state.orth == 1) { // transverse
          this.state.plane[1] = z;
          this.state.plane[4] = z;
          this.state.plane[7] = z;
          this.state.plane[10] = z;
        } else if (this.state.orth == 2) { // sagittal
          this.state.plane[0] = z;
          this.state.plane[3] = z;
          this.state.plane[6] = z;
          this.state.plane[9] = z;
        }
        this.passPlane();
      }
    },

    passPlane: function () {
      if (this.state.stackViewerPlane) {
        if (this.props.canvasRef != undefined && this.props.canvasRef != null) {
          this.state.stackViewerPlane = this.props.canvasRef.modify3DPlane(this.state.stackViewerPlane, this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11]);
        }
      } else {
        if (this.props.canvasRef != undefined && this.props.canvasRef != null) {
          this.state.stackViewerPlane = this.props.canvasRef.add3DPlane(this.state.plane[0], this.state.plane[1], this.state.plane[2], this.state.plane[3], this.state.plane[4], this.state.plane[5], this.state.plane[6], this.state.plane[7], this.state.plane[8], this.state.plane[9], this.state.plane[10], this.state.plane[11], "geppetto/node_modules/@geppettoengine/geppetto-client/js/components/widgets/stackViewer/images/glass.jpg");
        }
        if (this.state.stackViewerPlane.visible) {
          this.state.stackViewerPlane.visible = true;
        }
      }
      if (this.disp.width > 0 && this.props.slice) {
        this.state.stackViewerPlane.visible = true;
      } else {
        this.state.stackViewerPlane.visible = false;
      }
      this.state.planeUpdating = false;
    },

    callObjects: function () {

      var i, j, result, id, label;
      var that = this;
      var isSelected = false;
      while (GEPPETTO.SceneController.getSelection()[0] != undefined) {
        GEPPETTO.SceneController.getSelection()[0].deselect();
      }
      $.each([this.state.stack[0]], function (i, item) {
        (function (i, that, shift) {
          var shift = GEPPETTO.isKeyPressed("shift");
          var image = that.state.serverUrl.toString() + '?wlz=' + item + '&sel=0,255,255,255&mod=zeta&fxp=' + that.props.fxp.join(',') + '&scl=' + Number(that.state.scl).toFixed(1) + '&dst=' + Number(that.state.dst).toFixed(1) + '&pit=' + Number(that.state.pit).toFixed(0) + '&yaw=' + Number(that.state.yaw).toFixed(0) + '&rol=' + Number(that.state.rol).toFixed(0);
          // get image size;
          $.ajax({
            url: image + '&prl=-1,' + that.state.posX.toFixed(0) + ',' + that.state.posY.toFixed(0) + '&obj=Wlz-foreground-objects',
            type: 'POST',
            success: function (data) {
              if (GEPPETTO.SceneController.getSelection()[0] == undefined) { // check nothing already selected
                result = data.trim().split(':')[1].trim().split(' ');
                if (result !== '') {
                  for (j in result) {
                    if (result[j].trim() !== '') {
                      var index = Number(result[j]);
                      if (i !== 0 || index !== 0) { // don't select template
                        if (index == 0 && !shift) {
                          if (!isSelected){
                            console.log(that.state.label[i] + ' clicked');
                            try {
                              eval(that.state.id[i][Number(result[j])]).select();
                              that.setStatusText(that.state.label[i] + ' selected');
                              isSelected = true;
                            } catch (err) {
                              console.log("Error selecting: " + that.state.id[i][Number(result[j])]);
                              console.log(err.message);
                            }
                          }
                          break;
                        } else {
                          if (typeof that.props.templateDomainIds !== 'undefined' && typeof that.props.templateDomainNames !== 'undefined' && typeof that.props.templateDomainIds[index] !== 'undefined' && typeof that.props.templateDomainNames[index] !== 'undefined' && that.props.templateDomainIds[index] !== null && that.props.templateDomainNames[index] !== null) {
                            if (!isSelected) {
                              try {
                                eval(that.state.id[i][Number(result[j])]).select();
                                console.log(that.props.templateDomainNames[index] + ' clicked');
                                that.setStatusText(that.props.templateDomainNames[index] + ' selected');
                                break;
                              } catch (ignore) {
                                console.log(that.props.templateDomainNames[index] + ' requested');
                                that.setStatusText(that.props.templateDomainNames[index] + ' requested');
                                if (shift) {
                                  console.log('Adding ' + that.props.templateDomainNames[index]);
                                  that.setStatusText('Adding ' + that.props.templateDomainNames[index]);
                                  var varriableId = that.props.templateDomainIds[index];
                                  stackViewerRequest(varriableId); // window.stackViewerRequest must be configured in init script
                                  isSelected = true;
                                  break;
                                } else {
                                  that.setStatusText(that.props.templateDomainNames[index] + ' (⇧click to add)');
                                  stackViewerRequest(that.props.templateDomainTypeIds[index]);
                                  break;
                                }
                              }
                            }
                          } else {
                            console.log('Index not listed: ' + result[j]);
                          }
                        }
                      }
                    }
                  }
                }
                // update slice view
                that.checkStack();
              }
            },
            error: function (xhr, status, err) {
              console.error("Calling Objects", status + " - " + xhr.progress().state(), err.toString());
            }.bind(this)
          });
        })(i, that);
      });
    },

    listObjects: function () {
      if (!this.state.loadingLabels || this.state.lastLabelCall < (Date.now() - 500)) {
        this.state.lastLabelCall = Date.now();
        this.state.objects = [];
        var i, j, result;
        var that = this;
        var callX = that.state.posX.toFixed(0), callY = that.state.posY.toFixed(0);

        $.each([this.state.stack[0]], function (i, item) {
          (function (i, that, shift) {
            if (i == 0) {
              that.state.loadingLabels = true;
            }
            var shift = GEPPETTO.isKeyPressed("shift");
            var image = that.state.serverUrl.toString() + '?wlz=' + item + '&sel=0,255,255,255&mod=zeta&fxp=' + that.props.fxp.join(',') + '&scl=' + Number(that.state.scl).toFixed(1) + '&dst=' + Number(that.state.dst).toFixed(1) + '&pit=' + Number(that.state.pit).toFixed(0) + '&yaw=' + Number(that.state.yaw).toFixed(0) + '&rol=' + Number(that.state.rol).toFixed(0);
            // get image size;
            $.ajax({
              url: image + '&prl=-1,' + callX + ',' + callY + '&obj=Wlz-foreground-objects',
              type: 'POST',
              success: function (data) {
                result = data.trim().split(':')[1].trim().split(' ');
                if (result !== '') {
                  for (j in result) {
                    if (result[j].trim() !== '') {
                      var index = Number(result[j]);
                      if (i !== 0 || index !== 0) { // don't select template
                        if (index == 0) {
                          if (!shift) {
                            that.state.objects.push(that.state.label[i]);
                          }
                        } else {
                          if (typeof that.props.templateDomainIds !== 'undefined' && typeof that.props.templateDomainNames !== 'undefined' && typeof that.props.templateDomainIds[index] !== 'undefined' && typeof that.props.templateDomainNames[index] !== 'undefined' && that.props.templateDomainNames[index] !== null) {
                            that.state.objects.push(that.props.templateDomainNames[index]);
                            break;
                          }
                        }
                      }
                    }
                  }
                  var list = $.unique(that.state.objects).sort();
                  var objects = '';
                  if (shift) {
                    objects = 'Click to add: ';
                  }
                  for (j in list) {
                    objects = objects + list[j] + '\n';
                  }
                  if (objects !== '' && i == 0) {
                    that.setHoverText(callX,callY,list[0]);
                  } else {
                    that.setStatusText('');
                  }
                }
                // update slice view
                if (i == 0) {
                  that.state.loadingLabels = false;
                }
              },
              error: function (xhr, status, err) {
                that.state.loadingLabels = false;
                console.error("Listing Objects", status + " - " + xhr.progress().state(), err.toString());
              }.bind(this)
            });
          })(i, that);
        });
      }
    },

    bufferStack: function () {
      if (!this.state.bufferRunning && this.state.lastUpdate < (Date.now() - 60000)) {
        this.state.bufferRunning = true;
        var loadList = new Set();
        this.state.lastUpdate = Date.now();
        var i, j, dst, image;
        var min = (this.state.minDst / 10.0) * this.state.scl;
        var max = (this.state.maxDst / 10.0) * this.state.scl;
        var buffMax = 2000;

        for (j = 0; j < this.state.numTiles; j++) {
          for (i in this.state.stack) {
            image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + Number(this.state.scl).toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
            if (!this.state.iBuffer[image]) {
              loadList.add(image);
              buffMax -= 1;
            }
          }
        }
        if (buffMax > 1) {
          var distance = Number(Number(this.state.dst).toFixed(1));
          this.state.lastUpdate = Date.now();
          var step = 0;
          var maxDist = 0;
          if (this.state.orth == 0) {
            step = this.state.voxelZ * this.state.scl;
          } else if (this.state.orth == 1) {
            step = this.state.voxelY * this.state.scl;
          } else if (this.state.orth == 2) {
            step = this.state.voxelX * this.state.scl;
          }
          step = Number(Number(step).toFixed(1));
          if (this.state.numTiles < 10) {
            for (maxDist = distance + step; maxDist < max; maxDist += step) {
              for (i in this.state.stack) {
                for (j in this.state.visibleTiles) {
                  image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + Number(this.state.scl).toFixed(1) + '&dst=' + Number(maxDist).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                  if (!this.state.iBuffer[image]) {
                    loadList.add(image);
                    buffMax -= 1;
                  }
                }
              }
              if (buffMax < 1000) {
                break;
              }
            }
            for (maxDist = distance - step; maxDist > min; maxDist -= step) {
              for (i in this.state.stack) {
                for (j in this.state.visibleTiles) {
                  image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + Number(this.state.scl).toFixed(1) + '&dst=' + Number(maxDist).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + this.state.visibleTiles[j].toString();
                  if (!this.state.iBuffer[image]) {
                    loadList.add(image);
                    buffMax -= 1;
                  }
                }
              }
              if (buffMax < 1) {
                break;
              }
            }
          } else {
            // console.log('Buffering neighbouring layers (' + this.state.numTiles.toString() + ') tiles...');
            for (j = 0; j < this.state.numTiles; j++) {
              for (i in this.state.stack) {
                image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + Number(this.state.scl).toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + j.toString();
                if (!this.state.iBuffer[image]) {
                  // console.log('buffering ' + this.state.stack[i].toString() + '...');
                  loadList.add(image);
                  buffMax -= 1;
                }
                if (buffMax < 1) {
                  break;
                }
              }
              if (buffMax < 1) {
                break;
              }
            }
          }
        }

        if (loadList.size > 0) {
          this.state.bufferRunning = true;
          console.log('Loading ' + loadList.size + ' slices/tiles...');
          function loadProgressHandler (loader, resource) {
            this.setStatusText('Buffering stack ' + loader.progress.toFixed(1) + "%");
          }

          function setup () {
            var k;
            for (k in imageLoader.resources) {
              this.state.iBuffer[k] = imageLoader.resources[k].texture;
            }
            imageLoader.destroy(true);
            // console.log('Buffered ' + (1000 - buffMax).toString() + ' tiles');
            if (this._isMounted === true && this._initialized === false) {
              // this.props.canvasRef.resetCamera();
              this._initialized = true;
              this.props.onHome();
            }
            if (this.state.text.indexOf('Buffering stack') > -1) {
              this.state.buffer[-1].text = '';
            }
            this.state.bufferRunning = false;
            this.state.lastUpdate = Date.now();
            this.animate();
          }

          var imageLoader = new PIXI.loaders.Loader();
          var loaderOptions = {
            loadType: PIXI.loaders.Resource.LOAD_TYPE.IMAGE,
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BLOB
          };
          loadList.forEach(function (value) {
            imageLoader.add(value, value, loaderOptions);
          });
          imageLoader
            .on('progress', loadProgressHandler.bind(this))
            .on('error', console.error)
            .on('complete', setup.bind(this,imageLoader))
            .load();

        } else {
          this.state.bufferRunning = false;
          this.state.lastUpdate = Date.now();
        }
      }
    },

    checkStack: function () {
      if (!this._isMounted) {
        // check that component is still mounted
        return;
      }

      if (this.state.stack.length < 1) {
        this.state.images = [];
        this.stack.removeChildren();
      }

      if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
        this.state.buffer[-1].text = '';
      }

      if (Object.keys(this.state.images).length > (this.state.stack.length * this.state.visibleTiles.length)) {
        for (var i = 0; i < Object.keys(this.state.images).length; i++) {
          var id = Object.keys(this.state.images)[i].split(",")[0];
          if (id > (this.state.stack.length - 1)) {
            delete this.state.images[Object.keys(this.state.images)[i]];
            try {
              this.stack.removeChildAt(i);
            } catch (ignore) {
              // ignore if it doesn't exist
            }
          }
        }
      }
      // console.log('Updating scene...');
      this.createImages();

      if (this.disp.width > 1) {
        this.disp.position.x = ((this.props.width / 2) - ((((this.state.imageX / 10.0) * this.state.scl) * this.disp.scale.x) / 2));
        this.disp.position.y = ((this.props.height / 2) - ((((this.state.imageY / 10.0) * this.state.scl) * this.disp.scale.y) / 2));
      }

    },

    generateColor: function () {
      var i;
      for (i in this.state.stack) {
        if (this.state.stack[i] && this.state.stack[i].trim() !== '' && !this.state.color[i]) {
          this.state.color = this.state.color.concat(['0xFFFFFF']);
        }
      }
    },

    createImages: function () {
      if (this.state.stack.length > 0) {
        var i, x, y, w, h, d, offX, offY, t, image, Xpos, Ypos, XboundMax, YboundMax, XboundMin, YboundMin;
        /*
         * move through tiles
         * console.log('Creating slice view...');
         */
        this.state.visibleTiles = [];
        w = Math.ceil(((this.state.imageX / 10.0) * this.state.scl) / this.state.tileX);
        h = Math.ceil(((this.state.imageY / 10.0) * this.state.scl) / this.state.tileY);
        // console.log('Tile grid is ' + w.toString() + ' wide by ' + h.toString() + ' high');
        this.state.numTiles = w * h;

        for (t = 0; t < w * h; t++) {
          x = 0;
          y = 0;
          offY = 0;
          if ((t + 1) > w) {
            offY = Math.floor(t / w);
          }
          offX = (t - (offY * w));
          x += offX * this.state.tileX;
          y += offY * this.state.tileY;
          // console.log('Tiling: ' + [t,offX,offY,x,y,w,h]);
          Xpos = (this.stack.parent.position.x / (this.disp.scale.x)) + this.stack.position.x;
          XboundMin = Xpos - (2 * (this.state.tileX * this.state.scl));
          XboundMax = (this.props.width / (this.disp.scale.x)) + Xpos + (2 * (this.state.tileX * this.state.scl));
          Ypos = (this.stack.parent.position.y / (this.disp.scale.y)) + this.stack.position.y;
          YboundMin = Ypos - (2 * (this.state.tileY * this.state.scl));
          YboundMax = (this.app.view.height / (this.disp.scale.y)) + Ypos + (2 * (this.state.tileY * this.state.scl));
          if ((w * h < 3) || ((x + this.state.tileX) > XboundMin && x < XboundMax && (y + this.state.tileY) > YboundMin && y < YboundMax)) {
            this.state.visibleTiles.push(t);
            for (i in this.state.stack) {
              d = i.toString() + ',' + t.toString();
              image = this.state.serverUrl.toString() + '?wlz=' + this.state.stack[i] + '&sel=0,255,255,255&mod=zeta&fxp=' + this.props.fxp.join(',') + '&scl=' + Number(this.state.scl).toFixed(1) + '&dst=' + Number(this.state.dst).toFixed(1) + '&pit=' + Number(this.state.pit).toFixed(0) + '&yaw=' + Number(this.state.yaw).toFixed(0) + '&rol=' + Number(this.state.rol).toFixed(0) + '&qlt=80&jtl=' + t.toString();
              // console.log(image);
              if (!this.state.images[d]) {
                // console.log('Adding ' + this.state.stack[i].toString());
                if (this.state.iBuffer[image]) {
                  this.state.images[d] = new PIXI.Sprite.from(this.state.iBuffer[image]);
                  this.state.imagesUrl[d] = image;
                } else {
                  this.state.images[d] = new PIXI.Sprite.fromImage(image);
                  this.state.iBuffer[image] = this.state.images[d].texture;
                  this.state.imagesUrl[d] = image;
                }
                this.state.images[d].anchor.x = 0;
                this.state.images[d].anchor.y = 0;
                this.state.images[d].position.x = x;
                this.state.images[d].position.y = y;
                this.state.images[d].zOrder = i;
                this.state.images[d].visible = true;
                if (!this.state.color[i]) {
                  this.generateColor();
                }
                this.state.images[d].tint = this.state.color[i];
                if (i > 0) {
                  // this.state.images[d].alpha = 0.9;
                  this.state.images[d].blendMode = PIXI.BLEND_MODES.SCREEN;
                }
                this.stack.addChild(this.state.images[d]);
              } else {
                if (this.state.imagesUrl[d] != image) {
                  if (this.state.iBuffer[image]) {
                    this.state.images[d].texture = this.state.iBuffer[image];
                    this.state.imagesUrl[d] = image;
                  } else {
                    if (this.state.txtUpdated < Date.now() - this.state.txtStay) {
                      this.state.buffer[-1].text = 'Loading slice ' + Number(this.state.dst - ((this.state.minDst / 10.0) * this.state.scl)).toFixed(1) + '...';
                    }
                    this.state.images[d].texture = new PIXI.Texture.fromImage(image);
                    this.state.iBuffer[image] = this.state.images[d].texture;
                    this.state.imagesUrl[d] = image;
                  }
                  this.state.images[d].anchor.x = 0;
                  this.state.images[d].anchor.y = 0;
                  this.state.images[d].position.x = x;
                  this.state.images[d].position.y = y;
                  this.state.images[d].zOrder = i;
                  this.state.images[d].visible = true;
                  if (i > 0) {
                    // this.state.images[d].alpha = 0.9;
                    this.state.images[d].blendMode = PIXI.BLEND_MODES.SCREEN;
                  }
                }
                if (!this.state.color[i]) {
                  this.generateColor();
                }
                if (this.state.images[d].tint != this.state.color[i]) {
                  this.state.images[d].tint = this.state.color[i];
                }
              }
            }
          } else {
            for (i in this.state.stack) {
              d = i.toString() + ',' + t.toString();
              if (this.state.images[d] && this.state.images[d].visible) {
                // console.log('Hiding tile ' + d);
                this.state.images[d].visible = false;
                // console.log([x,y,w,h,XboundMin,XboundMax,YboundMin,YboundMax,Xpos,Ypos]);
              }
            }
            // console.log('Tile ' + [offX,offY] + ' off screen.');
          }
        }
      }
    },

    createStatusText: function () {
      if (!this.state.buffer[-1]) {
        var style = {
          font: '12px Helvetica',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
          dropShadow: true,
          dropShadowColor: '#000000',
          dropShadowAngle: Math.PI / 6,
          dropShadowDistance: 2,
          wordWrap: true,
          wordWrapWidth: this.app.view.width,
          textAlign: 'right'
        };
        this.state.buffer[-1] = new PIXI.Text(this.state.text, style);
        this.stage.addChild(this.state.buffer[-1]);
      } else {
        this.state.buffer[-1].text = this.state.text;
      }
      // fix position
      this.state.buffer[-1].x = -this.stage.position.x + 35;
      this.state.buffer[-1].y = -this.stage.position.y + 8;
      this.state.buffer[-1].anchor.x = 0;
      this.state.buffer[-1].anchor.y = 0;
      this.state.buffer[-1].zOrder = 1000;
    },

    /**
     * When we get new props, run the appropriate imperative functions
     *
     */
    UNSAFE_componentWillReceiveProps: function (nextProps) {
      var updDst = false;
      if (nextProps.dst !== this.state.dst) {
        this.state.dst = nextProps.dst;
        this.setStatusText(nextProps.statusText);
        this.createImages();
        return true;
      }
      if (nextProps.stack !== this.state.stack || nextProps.color !== this.state.color || this.state.serverUrl !== nextProps.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol) || this.state.id !== nextProps.id) {
        this.setState({
          stack: nextProps.stack,
          color: nextProps.color,
          label: nextProps.label,
          id: nextProps.id,
          serverUrl: nextProps.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol)
        });
        this.checkStack();
      }
      if (nextProps.scl !== this.state.scl || nextProps.zoomLevel !== this.props.zoomLevel || nextProps.width !== this.props.width || nextProps.height !== this.props.height || nextProps.stackX !== this.stack.position.x || nextProps.stackY !== this.stack.position.y){
        if (nextProps.scl < this.state.scl) {
          // wipe the stack if image is getting smaller
          this.state.images = [];
          this.stack.removeChildren();
        }
        this.stack.position.x = nextProps.stackX;
        this.stack.position.y = nextProps.stackY;
        this.state.scl = nextProps.scl;
        this.state.iBuffer = {};
        this.setState({ scl: nextProps.scl, iBuffer: {} });
        this.updateZoomLevel(nextProps);
        this.bufferStack();
        updDst = true;
      }
      if (nextProps.fxp[0] !== this.props.fxp[0] || nextProps.fxp[1] !== this.props.fxp[1] || nextProps.fxp[2] !== this.props.fxp[2]) {
        this.state.dst = nextProps.dst;
        this.setState({ dst: nextProps.dst });
        this.bufferStack();
        updDst = true;
      }
      if (nextProps.statusText !== this.props.statusText && nextProps.statusText.trim() !== '') {
        this.updateStatusText(nextProps);
      }

      if (nextProps.orth !== this.state.orth || nextProps.pit !== this.state.pit || nextProps.yaw !== this.state.yaw || nextProps.rol !== this.state.rol) {
        if (nextProps.orth !== this.state.orth) {
          this.state.recenter = true;
          this.state.iBuffer = {};
        }
        this.changeOrth(nextProps);
        this.bufferStack();
        updDst = true;
      }
      if (updDst) {
        this.checkStack();
        this.callPlaneEdges();
      }
    },
    /**
     * Update the stage "zoom" level by setting the scale
     *
     */
    updateZoomLevel: function (props) {
      var scale = props.zoomLevel / props.scl;
      this.disp.scale.x = scale;
      this.disp.scale.y = scale;
      // update slice view
      this.checkStack();
      // recenter display for new image size keeping any stack offset.
      this.disp.position.x = Math.ceil((props.width / 2) - (((this.state.imageX / 10.0) * props.zoomLevel) / 2));
      this.disp.position.y = Math.ceil((props.height / 2) - (((this.state.imageY / 10.0) * props.zoomLevel) / 2));
    },

    /**
     * Update the display text
     *
     */
    updateStatusText: function (props) {
      this.setStatusText(props.statusText);
    },

    changeOrth: function (props) {
      // console.log('Orth: ' + orth);
      this.state.orth = props.orth;
      this.state.pit = props.pit;
      this.state.yaw = props.yaw;
      this.state.rol = props.rol;
      // forcing the state change before size calls as setstate take time.
      this.setState({
        pit: props.pit,
        yaw: props.yaw,
        rol: props.rol,
        orth: props.orth
      });
      this.state.images = [];
      this.stack.removeChildren();
      if (props.orth == 0) {
        console.log('Frontal');
        this.setStatusText('Frontal');
      } else if (props.orth == 1) {
        console.log('Transverse');
        this.setStatusText('Transverse');
      } else if (props.orth == 2) {
        console.log('Sagittal');
        this.setStatusText('Sagittal');
      } else {
        console.log('Orth:' + props.orth);
        this.setStatusText('...');
      }
      this.callDstRange();
      this.callImageSize();
    },

    setStatusText: function (text) {
      this.state.buffer[-1].x = (-this.stage.position.x + 35);
      this.state.buffer[-1].y = (-this.stage.position.y + 8);
      this.state.buffer[-1].text = text;
      this.state.text = text;
      this.state.txtUpdated = Date.now();
    },

    setHoverText: function (x,y,text) {
      this.state.buffer[-1].x = -this.stage.position.x + this.disp.position.x + (this.stack.position.x * this.disp.scale.x) + (Number(x) * this.disp.scale.x) - 10;
      this.state.buffer[-1].y = -this.stage.position.y + this.disp.position.y + (this.stack.position.y * this.disp.scale.y) + (Number(y) * this.disp.scale.y) + 15;
      this.state.buffer[-1].text = text;
      this.state.text = text;
    },

    /**
     * Animation loop for updating Pixi Canvas
     *
     */
    animate: function () {
      if (this._isMounted) {
        // render the stage container (if the component is still mounted)
        this.app.render();
        // this.frame = requestAnimationFrame(this.animate);
      }
    },

    onDragStart: function (event) {
      /*
       * store a reference to the data
       * the reason for this is because of multitouch
       * we want to track the movement of this particular touch
       */
      this.state.data = event.data;
      this.stack.alpha = 0.7;
      this.state.dragging = true;
      var offPosition = this.state.data.global;
      this.state.dragOffset = {
        x: offPosition.x,
        y: offPosition.y
      };
      // console.log('DragStartOffset:'+JSON.stringify(this.state.dragOffset));
      var startPosition = this.state.data.getLocalPosition(this.stack);
      // console.log([startPosition.x,this.state.imageX*0.5,1/this.disp.scale.x]);
      this.state.posX = Number(startPosition.x.toFixed(0));
      this.state.posY = Number(startPosition.y.toFixed(0));
      // console.log('DragStart:'+JSON.stringify(startPosition));
    },

    onDragEnd: function () {
      if (this.state.data !== null && typeof this.state.data.getLocalPosition === "function") {
        this.stack.alpha = 1;
        var startPosition = this.state.data.getLocalPosition(this.stack);
        var newPosX = Number(startPosition.x.toFixed(0));
        var newPosY = Number(startPosition.y.toFixed(0));
        // console.log('DragEnd:'+JSON.stringify(startPosition));
        if (newPosX == this.state.posX && newPosY == this.state.posY) {
          this.callObjects();
          this.state.oldX = newPosX;
          this.state.oldY = newPosY;
          this.state.hoverTime = Date.now();
        }
        // set the interaction data to null
        this.state.data = null;
        this.state.dragging = false;
        this.props.setExtent({ stackX: this.stack.position.x, stackY: this.stack.position.y });
        this.createImages();
        this.state.buffer[-1].text = '';
      }
    },

    onHoverEvent: function (event) {
      if (!this.state.loadingLabels && !this.state.dragging) {
        if (this.app === null ) {
          return;
        }
        var currentPosition = this.app.renderer.plugins.interaction.mouse.getLocalPosition(this.stack);
        // update new position:
        this.state.posX = Number(currentPosition.x.toFixed(0));
        this.state.posY = Number(currentPosition.y.toFixed(0));
        if (!(this.state.posX == this.state.oldX && this.state.posY == this.state.oldY)) {
          this.listObjects();
          this.state.hoverTime = Date.now();
        }
        if (this.state.hoverTime < (Date.now() - 1000) && this.state.posX == this.state.oldX && this.state.posY == this.state.oldY) {
          this.state.hoverTime = Date.now() + 30000;
          this.listObjects();
        }
        this.state.oldX = Number(currentPosition.x.toFixed(0));
        this.state.oldY = Number(currentPosition.y.toFixed(0));
      }
    },

    onDragMove: function (event) {
      if (this.state.dragging) {
        var newPosition = this.state.data.global;
        var xmove = (newPosition.x - this.state.dragOffset.x) / this.disp.scale.x;
        var ymove = (newPosition.y - this.state.dragOffset.y) / this.disp.scale.y;
        this.state.dragOffset.x = newPosition.x;
        this.state.dragOffset.y = newPosition.y;
        this.stack.position.x += xmove;
        this.stack.position.y += ymove;
        // console.log('Moving :'+xmove+','+ymove);
        this.state.buffer[-1].text = 'Moving stack... (X:' + Number(this.stack.position.x).toFixed(2) + ',Y:' + Number(this.stack.position.y).toFixed(2) + ')';
        // update slice view
        this.createImages();
      } else {
        this.onHoverEvent(event);
      }
    },

    /**
     * Render our container that will store our PixiJS game canvas. Store the ref
     *
     */
    render: function () {
      return (
        < div
          className="stack-canvas-container"
          ref="stackCanvas" > </div>
      )
      ;
    }
  });

  var prefix = "", _addEventListener, onwheel, support;

  var StackViewerComponent = createClass({
    _isMounted: false,

    getInitialState: function () {
      return {
        zoomLevel: 1.0,
        dst: 0,
        text: '',
        stackX: 0,
        stackY: 0,
        imageX: 10240,
        imageY: 10240,
        fxp: [511, 255, 108],
        pit: 0,
        yaw: 0,
        rol: 0,
        scl: 1.0,
        voxelX: (this.props.voxel.x || 0.622088),
        voxelY: (this.props.voxel.y || 0.622088),
        voxelZ: (this.props.voxel.z || 0.622088),
        minDst: -100,
        maxDst: 100,
        orth: 0,
        color: [],
        stack: [],
        label: [],
        id: [],
        tempId: [],
        tempName: [],
        tempType: [],
        plane: null,
        initalised: false,
        slice: false,
        lastUpdate: 0,
        scrollTrack: 0,
        loadChanges: true
      };
    },

    onWheelEvent: function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var newdst = Number(Number(this.state.dst).toFixed(1));
      if (e.ctrlKey && e.wheelDelta > 0) {
        this.onZoomIn();
      } else if (e.ctrlKey && e.wheelDelta < 0) {
        this.onZoomOut();
      } else {
        // Mac keypad returns values (+/-)1-20 Mouse wheel (+/-)120
        this.state.scrollTrack += e.deltaY * 0.04;

        if (this.state.scrollTrack > 0.9 || this.state.scrollTrack < -0.9){
          var step = 0;
          if (this.state.scrollTrack > 1) {
            step = Math.ceil(this.state.scrollTrack) - 1;
          } else {
            step = Math.floor(this.state.scrollTrack) + 1;
          }
          this.state.scrollTrack = 0;
          var stepDepth = 1;
          // Max step of imposed
          if (this.state.orth == 0) {
            stepDepth = this.state.voxelZ * this.state.scl;
          } else if (this.state.orth == 1) {
            stepDepth = this.state.voxelY * this.state.scl;
          } else if (this.state.orth == 2) {
            stepDepth = this.state.voxelX * this.state.scl;
          }
          if (e.shiftKey) {
            stepDepth = stepDepth * 10;
          }
          stepDepth = Number(Number(stepDepth).toFixed(1))

          newdst += Number((stepDepth * step).toFixed(1));
          if (newdst < ((this.state.maxDst / 10.0) * this.state.scl) && newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
            this.setState({ dst: newdst, text: 'Depth:' + ((newdst / this.state.scl) - (this.state.minDst / 10.0)).toFixed(1) });
          } else if (newdst < ((this.state.maxDst / 10.0) * this.state.scl)) {
            newdst = ((this.state.minDst / 10.0) * this.state.scl);
            this.setState({ dst: newdst, text: 'First slice!' });
          } else if (newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
            newdst = ((this.state.maxDst / 10.0) * this.state.scl);
            this.setState({ dst: newdst, text: 'Last slice!' });
          }

        }

      }
    },

    shouldComponentUpdate: function (nextProps, nextState) {
      if (shallowCompare(this, nextProps, nextState)) {
        return true;
      }
      if (this.props !== undefined && this.props.data !== undefined && this.props.data.instances !== undefined && nextProps.data !== undefined && nextProps.data.instances !== undefined) {
        var a = nextProps.data.instances;
        var b = this.props.data.instances;
        if (a.length == b.length) {
          for (var i = 0; i < a.length; i++) {
            try {
              if (a[i].parent.getColor() != b[i].parent.getColor()) {
                return true;
              }
              if (a[i].parent.isVisible() != b[i].parent.isVisible()) {
                return true;
              }
            } catch (ignore) { }
          }
          return false;
        }
        return true;
      }
      return false;

      /**
       * Performs equality by iterating through keys on an object and returning false
       * when any key has values which are not strictly equal between the arguments.
       * Returns true when the values of all keys are strictly equal.
       */
      function shallowEqual (objA, objB) {
        if (objA === objB) {
          return true;
        }

        if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
          return false;
        }

        var keysA = Object.keys(objA);
        var keysB = Object.keys(objB);

        if (keysA.length !== keysB.length) {
          return false;
        }

        // Test for A's keys different from B.
        var bHasOwnProperty = hasOwnProperty.bind(objB);
        for (var i = 0; i < keysA.length; i++) {
          if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
          }
        }

        return true;
      }

      function shallowCompare (instance, nextProps, nextState) {
        return (
          !shallowEqual(instance.props, nextProps) || !shallowEqual(instance.state, nextState)
        );
      }
    },

    componentDidMount: function () {
      this._isMounted = true;

      // detect event model
      if (window.addEventListener) {
        this._addEventListener = "addEventListener";
      } else {
        this._addEventListener = "attachEvent";
        prefix = "on";
      }

      // detect available wheel event
      support = "onwheel" in document.createElement("div") ? "wheel" // Modern browsers support "wheel"
        : document.onmousewheel !== undefined ? "mousewheel" // Webkit and IE support at least "mousewheel"
          : "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
      this.addWheelListener($('#' + this.props.data.id + 'displayArea')[0], function (e) {
        this.onWheelEvent(e);
      }.bind(this));

      if (this.props.data && this.props.data != null && this.props.data.instances && this.props.data.instances != null) {
        this.setState(this.handleInstances(this.props.data.instances));
      }

      setTimeout(this.onHome, 5000);

    },

    componentDidUpdate: function (prevProps, prevState) {
      if (prevProps.data != undefined && prevProps.data != null && prevProps.data.instances != undefined) {
        this.setState(this.handleInstances(this.props.data.instances));
      } 
    },

    handleInstances: function (instances) {
      var newState = this.state;
      if (instances && instances != null && instances.length > 0) {
        var instance;
        var data, vals;
        var files = [];
        var colors = [];
        var labels = [];
        var ids = [];
        var server = this.props.config.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol);
        if (this.props.data.height && this.props.data.height != null) {
          newState.height = this.props.data.height;
        }
        if (this.props.data.width && this.props.data.width != null) {
          newState.width = this.props.data.width;
        }
        if (this.props.config && this.props.config != null && this.props.config.subDomains && this.props.config.subDomains != null && this.props.config.subDomains.length && this.props.config.subDomains.length > 0 && this.props.config.subDomains[0] && this.props.config.subDomains[0].length && this.props.config.subDomains[0].length > 2) {
          newState.voxelX = Number(this.props.config.subDomains[0][0] || 0.622088);
          newState.voxelY = Number(this.props.config.subDomains[0][1] || 0.622088);
          newState.voxelZ = Number(this.props.config.subDomains[0][2] || 0.622088);
        }
        if (this.props.config && this.props.config != null) {
          if (this.props.config.subDomains && this.props.config.subDomains != null && this.props.config.subDomains.length) {
            if (this.props.config.subDomains.length > 0 && this.props.config.subDomains[0] && this.props.config.subDomains[0].length && this.props.config.subDomains[0].length > 2) {
              newState.voxelX = Number(this.props.config.subDomains[0][0] || 0.622088);
              newState.voxelY = Number(this.props.config.subDomains[0][1] || 0.622088);
              newState.voxelZ = Number(this.props.config.subDomains[0][2] || 0.622088);
            }
            if (this.props.config.subDomains.length > 4 && this.props.config.subDomains[1] != null) {
              newState.tempName = this.props.config.subDomains[2];
              newState.tempId = this.props.config.subDomains[1];
              newState.tempType = this.props.config.subDomains[3];
              if (this.props.config.subDomains[4] && this.props.config.subDomains[4].length && this.props.config.subDomains[4].length > 0) {
                newState.fxp = JSON.parse(this.props.config.subDomains[4][0]);
              }
            }
          }
        }
        for (instance in instances) {
          try {
            if ((instances[instance].id != undefined) && (instances[instance].parent != null) && (typeof instances[instance].parent.isSelected === "function") && (typeof instances[instance].parent.isVisible === "function" && instances[instance].parent.isVisible())){
              vals = instances[instance].getVariable().getInitialValue().value;
              data = JSON.parse(vals.data);
              server = data.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol);
              files.push(data.fileLocation);
              // Take multiple ID's for template
              if (typeof this.props.config.templateId !== 'undefined' && typeof this.props.config.templateDomainIds !== 'undefined' && instances[instance].parent.getId() == this.props.config.templateId) {
                ids.push(this.props.config.templateDomainIds);
              } else {
                ids.push([instances[instance].parent.getId()]);
              }
              labels.push(instances[instance].parent.getName());
              if (instances[instance].parent.isSelected() || (typeof instances[instance].parent[instances[instance].parent.getId() + '_obj'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId() + '_obj'].isSelected()) || (typeof instances[instance].parent[instances[instance].parent.getId() + '_swc'] != 'undefined' && instances[instance].parent[instances[instance].parent.getId() + '_swc'].isSelected())) {
                colors.push('0Xffcc00'); // selected
              } else if (instances[instance].parent.getColor() !== undefined){
                colors.push(instances[instance].parent.getColor().replace('#', '0X'));
              }
            }
          } catch (err) {
            console.log('Error handling ' + instance);
            console.log(err.message);
            console.log(err.stack);
          }
        }

        if (server != this.props.config.serverUrl.replace('http:', location.protocol).replace('https:', location.protocol) && server != null) {
          newState.serverURL = server;
        }
        if (files && files != null && files.length > 0 && files.toString() != this.state.stack.toString()) {
          newState.stack = files;
        }
        if (labels && labels != null && labels.length > 0 && labels.toString() != this.state.label.toString()) {
          newState.label = labels;
        }
        if (ids && ids != null && ids.length > 0 && ids.toString() != this.state.id.toString()) {
          newState.id = ids;
        }
        if (colors && colors != null && colors.length > 0 && colors.toString() != this.state.color.toString()) {
          newState.color = colors;
        }
      } 
      return newState;
    },

    componentWillUnmount: function () {
      this._isMounted = false;
      return true;
    },
    /**
     * Event handler for clicking zoom in. Increments the zoom level
     *
     */
    onZoomIn: function () {
      var zoomLevel = this.state.zoomLevel;
      var scale = this.state.scl;
      var text = "";
      var newDst = Number(this.state.dst);
      var stackX = this.state.stackX;
      var stackY = this.state.stackY;
      if (GEPPETTO.isKeyPressed("shift")) {
        zoomLevel = Number((this.state.zoomLevel += 1).toFixed(1));
      } else {
        zoomLevel = Number((this.state.zoomLevel += 0.1).toFixed(1));
      }
      if (zoomLevel < 10.0) {
        scale = Number(Math.ceil(zoomLevel).toFixed(1));
        text = 'Zooming in to (X' + Number(zoomLevel).toFixed(1) + ')';
      } else {
        zoomLevel = 10;
        scale = 10;
        text = 'Max zoom! (X10)';
      }
      if (Number(this.state.scl) < scale) {
        var baseDst = this.state.dst / this.state.scl;
        newDst = Number((baseDst * scale).toFixed(1));
        stackX = Math.ceil((this.state.stackX / (this.state.imageX / 10.0 * this.state.scl)) * (this.state.imageX / 10.0 * scale));
        stackY = Math.ceil((this.state.stackY / (this.state.imageY / 10.0 * this.state.scl)) * (this.state.imageY / 10.0 * scale));
      }
      this.setState({
        zoomLevel: zoomLevel,
        scl: scale,
        text: text,
        dst: newDst,
        stackX: stackX,
        stackY: stackY
      });
    },

    toggleOrth: function () {
      var orth = this.state.orth += 1;
      var pit, yaw, rol;
      if (orth > 2) {
        orth = 0;
        this.state.orth = orth;
      }
      if (orth == 0) {
        pit = 0;
        yaw = 0;
        rol = 0;
      } else if (orth == 1) {
        pit = 90;
        yaw = 90;
        rol = 270;
      } else if (orth == 2) {
        pit = 90;
        yaw = 0;
        rol = 0;
      }
      this.setState({ orth: orth, pit: pit, yaw: yaw, rol: rol, dst: 0, stackX: 0, stackY: 0 });
      setTimeout(this.onHome, 5000);
    },

    toggleSlice: function () {
      if (this.state.slice) {
        this.setState({ slice: false });
      } else {
        this.setState({ slice: true });
      }
    },

    /**
     * Event handler for clicking zoom out. Decrements the zoom level
     *
     */
    onZoomOut: function () {
      var zoomLevel = this.state.zoomLevel;
      var scale = this.state.scl;
      var text = "";
      var newDst = Number(this.state.dst);
      var stackX = this.state.stackX;
      var stackY = this.state.stackY;
      if (GEPPETTO.isKeyPressed("shift")) {
        zoomLevel = Number((this.state.zoomLevel -= 1).toFixed(1));
      } else {
        zoomLevel = Number((this.state.zoomLevel -= 0.1).toFixed(1));
      }
      if (zoomLevel > 0.1) {
        scale = Number(Math.ceil(zoomLevel).toFixed(1));
        text = 'Zooming out to (X' + Number(zoomLevel).toFixed(1) + ')'; 
      } else {
        zoomLevel = 0.1;
        scale = 1.0;
        text = 'Min zoom! (X0.1)';
      }
      if (Number(this.state.scl) > scale) {
        var baseDst = this.state.dst / this.state.scl;
        newDst = Number((baseDst * scale).toFixed(1));
        stackX = Math.ceil((this.state.stackX / (this.state.imageX / 10.0 * this.state.scl)) * (this.state.imageX / 10.0 * scale));
        stackY = Math.ceil((this.state.stackY / (this.state.imageY / 10.0 * this.state.scl)) * (this.state.imageY / 10.0 * scale));
      }
      this.setState({
        zoomLevel: zoomLevel,
        scl: scale,
        text: text,
        dst: newDst,
        stackX: stackX,
        stackY: stackY
      });
    },

    /**
     * Event handler for clicking step in. Increments the dst level - TODO Remove
     *
     */
    onStepIn: function () {
      var shift = GEPPETTO.isKeyPressed("shift");
      var newdst = this.state.dst
      if (shift) {
        newdst += (this.state.voxelZ * this.state.scl) * 10;
      } else {
        newdst += (this.state.voxelZ * this.state.scl);
      }
      if (newdst < ((this.state.maxDst / 10.0) * this.state.scl) && newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
        this.setState({ dst: newdst, text: 'Slice:' + (newdst - ((this.state.minDst / 10.0) * this.state.scl)).toFixed(1) });
      } else if (newdst < ((this.state.maxDst / 10.0) * this.state.scl)) {
        newdst = ((this.state.minDst / 10.0) * this.state.scl);
        this.setState({ dst: newdst, text: 'First slice!' });
      } else if (newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
        newdst = ((this.state.maxDst / 10.0) * this.state.scl);
        this.setState({ dst: newdst, text: 'Last slice!' });
      }
    },
    /**
     * Event handler for clicking step out. Decrements the dst level - TODO Remove
     *
     */
    onStepOut: function () {
      var shift = GEPPETTO.isKeyPressed("shift");
      var newdst = this.state.dst
      if (shift) {
        newdst -= (this.state.voxelZ * this.state.scl) * 10;
      } else {
        newdst -= (this.state.voxelZ * this.state.scl);
      }
      if (newdst < ((this.state.maxDst / 10.0) * this.state.scl) && newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
        this.setState({ dst: newdst, text: 'Slice:' + (newdst - ((this.state.minDst / 10.0) * this.state.scl)).toFixed(1) });
      } else if (newdst < ((this.state.maxDst / 10.0) * this.state.scl)) {
        newdst = ((this.state.minDst / 10.0) * this.state.scl);
        this.setState({ dst: newdst, text: 'First slice!' });
      } else if (newdst > ((this.state.minDst / 10.0) * this.state.scl)) {
        newdst = ((this.state.maxDst / 10.0) * this.state.scl);
        this.setState({ dst: newdst, text: 'Last slice!' });
      }
    },

    /**
     * Event handler for clicking Home.
     *
     */
    onHome: function () {
      var autoScale = Number(Math.min((this.props.data.height / (this.state.imageY / 10.0 )), (this.props.data.width / (this.state.imageX / 10.0 ))).toFixed(1));
      var scale = Math.ceil(autoScale);
      this.setState({ dst: 0, stackX: 0, stackY: 0, text: 'Stack Centred', zoomLevel: autoScale, scl: scale });
    },

    onExtentChange: function (data) {
      this.setState(data);
      if (!this.state.initalised && JSON.stringify(data).indexOf('imageX') > -1) {
        this.state.initalised = true;
        this.onHome();
      }
    },

    addWheelListener: function (elem, callback, useCapture) {
      this._addWheelListener(elem, support, callback, useCapture);

      // handle MozMousePixelScroll in older Firefox
      if (support == "DOMMouseScroll") {
        this._addWheelListener(elem, "MozMousePixelScroll", callback, useCapture);
      }
    },

    _addWheelListener: function (elem, eventName, callback, useCapture) {
      elem[this._addEventListener](prefix + eventName, support == "wheel" ? callback : function (originalEvent) {
        !originalEvent && (originalEvent = window.event);

        // create a normalized event object
        var event = {
          // keep a ref to the original event object
          originalEvent: originalEvent,
          target: originalEvent.target || originalEvent.srcElement,
          type: "wheel",
          deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
          deltaX: 0,
          delatZ: 0,
          preventDefault: function () {
            originalEvent.preventDefault
              ? originalEvent.preventDefault()
              : originalEvent.returnValue = false;
          }
        };

        // calculate deltaY (and deltaX) according to the event
        if (support == "mousewheel") {
          event.deltaY = -1 / 40 * originalEvent.wheelDelta;
          // Webkit also support wheelDeltaX
          originalEvent.wheelDeltaX && (event.deltaX = -1 / 40 * originalEvent.wheelDeltaX);
        } else {
          event.deltaY = originalEvent.detail;
        }

        // it's time to fire the callback
        return callback(event);

      }, useCapture || false);
    },

    render: function () {
      var homeClass = 'btn fa fa-home';
      var zoomInClass = 'btn fa fa-search-plus';
      var zoomOutClass = 'btn fa fa-search-minus';
      var stepInClass = 'btn fa fa-chevron-down';
      var stepOutClass = 'btn fa fa-chevron-up';
      var pointerClass = 'btn fa fa-hand-pointer-o';
      var orthClass = 'btn gpt-xyz';
      var toggleSliceClass = 'btn ';
      if (this.state.slice) {
        toggleSliceClass += 'gpt-hideplane';
      } else {
        toggleSliceClass += 'gpt-showplane';
      }
      var startOffset = 5;
      var displayArea = this.props.data.id + 'displayArea';

      var markup = '';
      if (this.state.stack.length > 0) {
        markup = (
          <div id={displayArea} style={{ position: 'absolute', top: 3, left: 3 }}>
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 20,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={homeClass} onClick={this.onHome} title={'Center Stack'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 82,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={zoomInClass} onClick={this.onZoomIn} title={'Zoom In'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 104,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={zoomOutClass} onClick={this.onZoomOut} title={'Zoom Out'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 40,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={stepInClass} onClick={this.onStepIn} title={'Step Into Stack'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={stepOutClass} onClick={this.onStepOut} title={'Step Out Of Stack'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 60,
              padding: 0,
              paddingTop: 3,
              border: 0,
              background: 'transparent'
            }} className={orthClass} onClick={this.toggleOrth} title={'Change Slice Plane Through Stack'} />
            <button style={{
              position: 'absolute',
              left: 15,
              top: startOffset + 130,
              padding: 0,
              border: 0,
              background: 'transparent'
            }} className={toggleSliceClass} onClick={this.toggleSlice} title={'Toggle the 3D slice display'} />
            <Canvas zoomLevel={this.state.zoomLevel} dst={this.state.dst}
              serverUrl={this.props.config.serverUrl} canvasRef={this.props.canvasRef}
              fxp={this.state.fxp} pit={this.state.pit} yaw={this.state.yaw} rol={this.state.rol}
              stack={this.state.stack} color={this.state.color} setExtent={this.onExtentChange}
              statusText={this.state.text} stackX={this.state.stackX} stackY={this.state.stackY}
              scl={this.state.scl} orth={this.state.orth}
              label={this.state.label} id={this.state.id} height={this.props.data.height}
              width={this.props.data.width} voxelX={this.state.voxelX}
              voxelY={this.state.voxelY} voxelZ={this.state.voxelZ} displayArea={displayArea}
              templateId={this.props.config.templateId}
              templateDomainIds={this.state.tempId}
              templateDomainTypeIds={this.state.tempType}
              templateDomainNames={this.state.tempName} layout={this.props.layout}
              slice={this.state.slice} onHome={this.onHome} onZoomIn={this.onZoomIn}
              onResize={this.onResize} />
          </div>
        );
      } else {
        markup = (
          <div
            id={displayArea}
            style={{
              position: 'absolute',
              top: 1,
              left: 1,
              background: 'transparent',
              width: this.props.data.width,
              height: this.props.data.height
            }}>
          </div>
        );
      }

      return markup;
    }
  });

  return StackViewerComponent;
});
