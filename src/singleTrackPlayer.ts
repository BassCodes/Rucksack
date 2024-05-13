import { AudioPlayer as audioPlayer } from "./audioPlayer";

export class SingleTrack extends audioPlayer {
	constructor(track: HTMLAudioElement) {
		super([track]);

		track.addEventListener("timeupdate", () => {
			this.updateDuration();
		});
	}
}
