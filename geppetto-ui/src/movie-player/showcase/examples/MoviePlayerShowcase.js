import React, { Component } from "react";
import MoviePlayer from "./../../MoviePlayer";

export default class MoviePlayerShowcase extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    const controls = {
      playAtStart: false,
      loop: false,
      volume: 1,
      playbackRate: 1,
    };
    const videoURL = "https://youtu.be/OmwXCGPBhNo";
    const width = "800px";
    const height = "640px";

    return (
      <MoviePlayer
        controls={controls}
        videoURL={videoURL}
        width={width}
        height={height}
      />
    );
  }
}