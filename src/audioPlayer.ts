// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-12

import { N, audioMetadataLoad, formatDuration, newElements } from "./util";
import * as Icons from "./icons";

export enum TrackStatus {
	Playing,
	Paused,
	Errored,
}
export interface AudioPlayerI {
	pause: () => void;
	play: () => void;
	stop: () => void;
	next: () => void;
	prev: () => void;
}

export interface AudioTrack {
	readonly a: HTMLAudioElement;
	readonly title: string;
}

export class AudioPlayer implements AudioPlayerI {
	// Active Track
	protected at: AudioTrack;
	protected activeNo: number;
	protected status: TrackStatus;
	protected activeTitle: HTMLElement;
	protected tracks: Array<AudioTrack>;

	// UI Elements
	// Container for all controller UI elements
	UI: HTMLElement;
	// Big play/pause button
	private button: HTMLElement;
	// Time Elapsed out of total time
	private timer: HTMLElement;
	// Contains progress bar and whatever implementations want to add (Next/Prev buttons)
	protected bottomBox: HTMLElement;
	// A progress bar container
	private progressBox: HTMLElement;
	// Actual current progress
	private progressBar: HTMLElement;

	constructor(tracks: Array<AudioTrack>) {
		this.activeNo = 0;
		this.tracks = tracks;
		// active track
		this.at = tracks[0];
		this.status = TrackStatus.Paused;
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

		// Seeking is done as a result of the mousemove event after a mousedown event.
		// When, either the mouse is no longer pressed, or the mouse leaves the progress box,
		// The seeking must stop. An anonymous arrow function would be ideal as the callback for the
		// mousemove event, but it is nearly impossible to remove anonymous functions from event listeners.
		// Thus, the `seek` function has been extracted so that event that calls it can be removed.
		let seek = (e: MouseEvent): void => {
			let percentage = e.offsetX / this.progressBox.scrollWidth;
			this.quickSeek(percentage);
		};
		this.progressBox.addEventListener("mousedown", (e) => {
			let percentage = e.offsetX / this.progressBox.scrollWidth;
			this.at.a.currentTime = (this.at.a.duration || 0) * percentage;
			this.progressBox.onmousemove = seek;
		});
		this.progressBox.onmouseleave = (): void => {
			this.progressBox.onmousemove = null;
		};
		this.progressBox.onmouseup = (): void => {
			this.progressBox.onmousemove = null;
		};
		this.switchTrack(0);
	}

	protected switchTrack(trackno: number): void {
		this.at.a.pause();
		this.at.a.currentTime = 0;
		this.at.a.ontimeupdate = null;
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

	isPaused(): boolean {
		return this.at.a.paused;
	}

	private quickSeek(percentage: number): void {
		this.at.a.fastSeek((this.at.a.duration || 0) * percentage);
	}

	protected updateDuration(): void {
		let totalDuration = formatDuration(this.at.a.duration);
		let currentTime = formatDuration(this.at.a.currentTime);
		this.timer.textContent = `${currentTime} / ${totalDuration}`;
		this.progressBar.style.width = `${
			100 * (this.at.a.currentTime / this.at.a.duration || 0)
		}%`;
	}

	protected setButtonIcon(icon: SVGElement): void {
		this.button.replaceChildren(icon);
	}

	protected togglePlaying(): void {
		if (this.isPaused()) {
			this.play();
		} else {
			this.pause();
		}
	}
	play(): void {
		this.UI.dispatchEvent(new Event("RSCaudioStart"));
		let promise = this.at.a.play();
		if (!promise) return;
		promise
			.then(() => {
				this.setStatus(TrackStatus.Playing);
			})
			.catch((e) => {
				this.setStatus(TrackStatus.Errored);
				if (!this.isLastTrack()) {
					this.next();
				}
				console.log(e, this.at.a.error);
			});
	}
	pause(): void {
		this.at.a.pause();
		this.setStatus(TrackStatus.Paused);
	}
	stop(): void {
		this.pause();
	}

	setStatus(s: TrackStatus): void {
		let b;
		if (s == TrackStatus.Paused) b = Icons.playButton();
		if (s == TrackStatus.Playing) b = Icons.pauseButton();
		if (s == TrackStatus.Errored) b = Icons.errorButton();
		this.setButtonIcon(b as SVGElement);
		this.status = s;
	}
}
