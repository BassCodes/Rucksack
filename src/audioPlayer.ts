// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-22

import { N, audioMetadataLoad, formatDuration, newElements } from "./util";
import * as Icons from "./icons";

// Typescript enums automatically include code for formatting them to strings which is unneeded and takes up extra space
export const STATUS_PLAYING = 0;
export const STATUS_PAUSED = 1;
export const STATUS_ERROR = 2;

export interface AudioPlayerI {
	pause: () => void;
	play: () => void;
	next: () => void;
	prev: () => void;
}

export interface AudioTrack {
	readonly a: HTMLAudioElement;
	readonly title: string;
}

export class AudioPlayer implements AudioPlayerI {
	/** Active Track Object */
	at: AudioTrack;
	/** Index of active track */
	activeNo: number;
	/** Status of active track */
	status: number;
	/** List of tracks */
	readonly tracks: Array<AudioTrack>;

	// UI Elements
	/** Title box containing name of active track */
	activeTitle: HTMLElement;
	/** Container for all controller UI elements */
	UI: HTMLElement;
	// Big play/pause button
	button: HTMLElement;
	// Time Elapsed out of total time
	timer: HTMLElement;
	/** Contains progress bar and in the multitrack player Next/Prev buttons */
	bottomBox: HTMLElement;
	// A progress bar container
	progressBox: HTMLElement;
	// Actual current progress
	progressBar: HTMLElement;

	constructor(tracks: Array<AudioTrack>) {
		this.activeNo = 0;
		this.tracks = tracks;
		this.at = tracks[0];
		this.status = STATUS_PAUSED;
		this.tracks.forEach((t) => t.a.setAttribute("preload", "metadata"));

		[
			this.UI,
			this.timer,
			this.progressBox,
			this.progressBar,
			this.activeTitle,
			this.bottomBox,
		] = newElements(
			"div",
			"RSCui",
			"RSCtimer",
			"RSCprogressBox",
			"RSCprogress",
			"",
			"RSCbottom"
		);
		let [rightBox, top] = newElements("div", "RSCright", "RSCtop");

		this.button = N("button");
		this.button.ariaLabel = "Play/Pause";
		this.button.classList.add("RSCbutton", "RSCbigButton", "RSCplaypause");

		this.progressBox.append(this.progressBar);
		this.bottomBox.append(this.progressBox);

		this.activeTitle.textContent = this.at.title;
		this.button.replaceChildren(Icons.playButton());

		top.append(this.activeTitle);
		rightBox.append(top, this.bottomBox);
		this.UI.append(this.button, rightBox);

		top.append(this.timer);

		// Only display length of track once it is loaded
		audioMetadataLoad(this.at.a, this.updateDuration.bind(this));

		this.button.onclick = this.togglePlaying.bind(this);

		this.progressBox.addEventListener("mousedown", (e) => {
			let track_duration = this.at.a.duration || 0.1;

			let percentage = e.offsetX / this.progressBox.scrollWidth;
			this.at.a.currentTime = track_duration * percentage;

			this.progressBox.onmousemove = (e2): void => {
				let current_percentage = (this.at.a.currentTime || 0) / track_duration;
				let new_percentage = e2.offsetX / this.progressBox.scrollWidth;
				// Fast seek is not implemented in Chrome
				if (this.at.a.fastSeek) {
					this.at.a.fastSeek(track_duration * new_percentage);
				} else if (Math.abs(current_percentage - new_percentage) > 0.01) {
					// alternative implementation:
					// Check if percent difference between current time and
					// seeked time is at least 1%. Then set time manually.
					// It's still a bit jittery but better than nothing
					this.at.a.currentTime = track_duration * new_percentage;
				}
			};
		});
		this.progressBox.onmouseleave = (): void => {
			this.progressBox.onmousemove = null;
		};
		this.progressBox.onmouseup = (): void => {
			this.progressBox.onmousemove = null;
		};
		this.switchTrack(0);
	}

	switchTrack(trackno: number): void {
		// Clean up previous active track
		this.at.a.pause();
		this.at.a.currentTime = 0;
		this.at.a.ontimeupdate = null;

		// Set new active track
		this.at = this.tracks[trackno];
		this.at.a.ontimeupdate = (): void => {
			this.updateDuration();
		};
		this.activeTitle.textContent = this.at.title;
		this.activeNo = trackno;
	}

	next(): void {
		if (!this.isLastTrack()) {
			this.switchTrack(this.activeNo + 1);
			this.play();
		}
	}

	prev(): void {
		if (!this.isFirstTrack()) {
			this.switchTrack(this.activeNo - 1);
			this.play();
		}
	}

	isLastTrack(): boolean {
		return this.activeNo >= this.tracks.length - 1;
	}

	isFirstTrack(): boolean {
		return this.activeNo == 0;
	}

	updateDuration(): void {
		let current_track = this.at.a;

		let totalDuration = formatDuration(current_track.duration);
		let currentTime = formatDuration(current_track.currentTime);
		this.timer.textContent = `${currentTime} / ${totalDuration}`;
		this.progressBar.style.width = `${
			100 * (current_track.currentTime / current_track.duration || 0.1)
		}%`;
	}

	togglePlaying(): void {
		this.at.a.paused ? this.play() : this.pause();
	}

	play(): void {
		this.UI.dispatchEvent(new Event("RSCaudioStart"));
		let promise = this.at.a.play();
		// Older browsers might not support the promise
		if (!promise) return;
		promise
			.then(() => {
				this.setStatus(STATUS_PLAYING);
			})
			.catch((e) => {
				this.setStatus(STATUS_ERROR);
				if (!this.isLastTrack()) {
					this.next();
				}
				console.log(e, this.at.a.error);
			});
	}

	pause(): void {
		this.at.a.pause();
		this.setStatus(STATUS_PAUSED);
	}

	setStatus(s: number): void {
		let b;
		if (s === STATUS_PLAYING) {
			b = Icons.pauseButton();
		}
		if (s === STATUS_PAUSED) {
			b = Icons.playButton();
		}
		if (s === STATUS_ERROR) {
			b = Icons.errorButton();
		}

		this.button.replaceChildren(b as SVGElement);
		this.status = s;
	}
}
