import React, { Component } from 'react';
import ConnectivityDeck from "./ConnectivityDeck";
import MenuButton from "./MenuButton";
import { faList, faSort } from "@fortawesome/free-solid-svg-icons";
import CustomToolbar from "../../common/CustomToolbar";

const LEGENDS_TOOLTIP = "Toggle legend"

export default class ConnectivityToolbar extends Component {
  constructor (props) {
    super(props);
  }

  getCustomButtons () {
    const customButtons = [];
    if (this.props.layout.hasToggle()) {
      customButtons.push({
        'icon': faList,
        'id': 'legendButton',
        'tooltip': LEGENDS_TOOLTIP,
        'action': () => this.props.legendHandler()
      });
      return customButtons;
    }
  }

  getCustomElements () {
    const sortOptions = {
      'id': 'By entity name',
      'pre_count': 'By # pre',
      'post_count': 'By # post'
    };
    const deck = (<ConnectivityDeck
      key={this.props.id + '_deck'}
      id={this.props.id + '_deck'}
      ref={ deck => {
        this.deck = deck
      } }
      handler={this.props.deckHandler}
    />)
    const customElements = [deck];

    if (this.props.layout.hasSelect()) {
      customElements.push((
        <MenuButton
          key={this.props.id + '_select'}
          id={this.props.id + '_select'}
          options={sortOptions}
          handler = {this.props.sortOptionsHandler}
          defaultOption = "id"
          tooltip={"Order by"}
          icon={faSort}
        />));
    }
    return customElements;
  }

  render () {
    const { toolbarVisibility } = this.props;
    const visibility = toolbarVisibility ? "visible" : "hidden";

    const customElements = this.getCustomElements();
    const customButtons = this.getCustomButtons();

    return (
      <span style={{ visibility: visibility }}>
        <CustomToolbar buttons={customButtons} elements={customElements}/>
      </span>
    )
  }
}