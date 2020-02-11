

/**
 * Client class use to augment a model with visual group capabilities
 *
 * @module model/AVisualGroupCapability
 * @author Giovanni Idili
 */

export default {
  capabilityId: 'VisualGroupCapability',
  visualGroups: [],

  /**
   * Get VisualGroups
   */
  getVisualGroups: function () {
    return this.visualGroups;
  },


  applyVisualGroup: function (visualGroup, mode) {
    visualGroup.show(mode, [this]);
  },

  /**
   * Get VisualGroups
   */
  setVisualGroups: function (visualGroups) {
    this.visualGroups = visualGroups;
  },
}

