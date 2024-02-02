import * as Icons from "./icons";

import { AudioContainer } from "./audioContainer";

export class SingleTrack extends AudioContainer {
	constructor(track: HTMLAudioElement) {
		super([track]);

		track.addEventListener("play", () => {
			this.button.replaceChildren(Icons.pauseButton());
		});
		track.addEventListener("pause", () => {
			this.button.replaceChildren(Icons.playButton());
		});

		track.addEventListener("ended", () => {
			this.button.replaceChildren(Icons.playButton());
		});

		track.addEventListener("timeupdate", () => {
			this.updateDuration();
		});
	}
}
