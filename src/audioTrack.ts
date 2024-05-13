const getTrackName = (track: HTMLAudioElement): string =>
	track.getAttribute("title") ?? track.src.split("/").reverse()[0] ?? "";

export enum TrackStatus {
	Playing,
	Paused,
	Errored,
}
export default class AudioTrack {
	private track: HTMLAudioElement;
	readonly name: string;
	duration: number;
	private status: TrackStatus;
	constructor(t: HTMLAudioElement) {
		this.track = t;
		this.duration = 0;
		if (this.track.duration !== undefined) {
			this.duration = this.track.duration;
		} else {
			this.track.addEventListener(
				"loadedmetadata",
				() => {
					this.duration = this.track.duration;
				},
				{ once: true }
			);
		}

		this.name = getTrackName(this.track);

		this.status = TrackStatus.Paused;
	}
	setStatus(s: TrackStatus) {
		if (this.status === s) return;
		this.status = s;
		if (this.status === TrackStatus.Playing) {
			this.track.dispatchEvent(new Event("trackPlaying"));
		} else if (this.status === TrackStatus.Paused) {
			this.track.dispatchEvent(new Event("trackPaused"));
		} else if (this.status === TrackStatus.Errored) {
			this.track.dispatchEvent(new Event("trackErrored"));
		}
	}
}
