import { formatDuration, newElement } from "./util";
import * as Icons from "./icons";
import { TrackStatus } from "./audioTrack";

export const getTrackName = (track: HTMLAudioElement): string =>
	track.getAttribute("title") ?? track.src.split("/").reverse()[0] ?? "";

export abstract class AudioPlayer {
	protected activeTrack: HTMLAudioElement;
	protected activeNo: number;
	protected activeTrackStatus: TrackStatus;
	protected activeTitle: HTMLElement;
	protected tracks: Array<HTMLAudioElement>;

	// UI Elements
	// Container for all UI elements
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

	constructor(tracks: Array<HTMLAudioElement>) {
		this.activeNo = 0;
		this.tracks = tracks;
		this.activeTrack = tracks[0];
		this.activeTrackStatus = TrackStatus.Paused;
		this.tracks.forEach((t) => t.setAttribute("preload", "metadata"));

		[
			this.UI,
			this.timer,
			this.progressBox,
			this.progressBar,
			this.activeTitle,
			this.bottomBox,
		] = newElement(
			"div",
			"RSCui",
			"RSCtimer",
			"RSCprogressBox",
			"RSCprogress",
			"",
			"RSCbottom"
		);
		const [rightBox, top] = newElement("div", "RSCright", "RSCtop");

		this.button = document.createElement("button");
		this.button.ariaLabel = "Play/Pause";
		this.button.classList.add("RSCbutton", "RSCbigButton", "RSCplaypause");

		this.progressBox.append(this.progressBar);
		this.bottomBox.append(this.progressBox);

		this.activeTitle.textContent = getTrackName(this.activeTrack);
		this.button.replaceChildren(Icons.playButton());
		this.updateDuration();

		top.append(this.activeTitle);
		rightBox.append(top, this.bottomBox);
		this.UI.append(this.button, rightBox);

		// Only display length of track once it is loaded
		if (this.activeTrack.duration !== undefined) {
			top.append(this.timer);
			this.updateDuration();
		} else {
			this.activeTrack.addEventListener(
				"loadedmetadata",
				() => {
					this.updateDuration();
					top.append(this.timer);
				},
				{ once: true }
			);
		}

		this.button.addEventListener("click", this.togglePlaying.bind(this));

		// Seeking is done as a result of the mousemove event after a mousedown event.
		// When, either the mouse is no longer pressed, or the mouse leaves the progress box,
		// The seeking must stop. An anonymous arrow function would be ideal as the callback for the
		// mousemove event, but it is nearly impossible to remove anonymous functions from event listeners.
		// Thus, the `seek` function has been extracted so that event that calls it can be removed.
		const seek = (e: MouseEvent) => {
			const percentage = e.offsetX / this.progressBox.scrollWidth;
			this.quickSeek(percentage);
		};
		this.progressBox.addEventListener("mousedown", (e) => {
			const percentage = e.offsetX / this.progressBox.scrollWidth;
			this.activeTrack.currentTime = (this.activeTrack.duration || 0) * percentage;
			this.progressBox.addEventListener("mousemove", seek);
		});
		this.progressBox.addEventListener("mouseleave", () => {
			this.progressBox.removeEventListener("mousemove", seek);
		});
		this.progressBox.addEventListener("mouseup", () => {
			this.progressBox.removeEventListener("mousemove", seek);
		});
	}

	protected switchTrack(track: HTMLAudioElement) {
		this.activeTrack.pause();
		this.activeTrack.currentTime = 0;
		this.activeTrack = track;
		this.activeTitle.textContent = getTrackName(this.activeTrack);
	}

	nextTrack() {
		if (this.activeNo < this.tracks.length - 1) {
			const nextTrack = this.tracks[this.activeNo + 1];
			this.activeNo += 1;
			this.switchTrack(nextTrack);
			this.play();
		}
	}
	prevTrack() {
		if (this.activeNo > 0) {
			const prevTrack = this.tracks[this.activeNo - 1];
			this.activeNo -= 1;
			this.switchTrack(prevTrack);
			this.play();
		}
	}
	isLastTrack(): boolean {
		return this.activeNo >= this.tracks.length - 1;
	}
	isFirstTrack(): boolean {
		return this.activeNo === 0;
	}

	isPlaying(): boolean {
		return !this.activeTrack.paused;
	}

	isPaused(): boolean {
		return this.activeTrack.paused;
	}

	private quickSeek(percentage: number) {
		this.activeTrack.fastSeek((this.activeTrack.duration || 0) * percentage);
	}

	protected updateDuration() {
		const totalDuration = formatDuration(this.activeTrack.duration);
		const currentTime = formatDuration(this.activeTrack.currentTime);
		this.timer.textContent = `${currentTime} / ${totalDuration}`;
		this.progressBar.style.width = `${
			100 * (this.activeTrack.currentTime / this.activeTrack.duration || 0)
		}%`;
	}

	protected setButtonIcon(icon: SVGElement) {
		this.button.replaceChildren(icon);
	}

	protected togglePlaying() {
		if (this.isPaused()) {
			this.play();
		} else {
			this.pause();
		}
	}
	play() {
		this.UI.dispatchEvent(new Event("RSCaudioStart"));
		const promise = this.activeTrack.play();
		if (promise === undefined) return;
		promise
			.then(() => {
				this.setStatus(TrackStatus.Playing);
			})
			.catch((e) => {
				this.setStatus(TrackStatus.Errored);
				if (!this.isLastTrack()) {
					this.nextTrack();
				}
				console.log(e);
				console.log(this.activeTrack.error);
			});
	}
	pause() {
		this.activeTrack.pause();
		this.setStatus(TrackStatus.Paused);
	}
	stop() {
		this.setStatus(TrackStatus.Paused);
		this.activeTrack.pause();
	}
	setStatus(s: TrackStatus) {
		if (s == TrackStatus.Playing) {
			this.setButtonIcon(Icons.pauseButton());
		} else if (s == TrackStatus.Errored) {
			this.setButtonIcon(Icons.errorButton());
		} else if (s == TrackStatus.Paused) {
			this.setButtonIcon(Icons.playButton());
		}
		this.activeTrackStatus = s;
	}
}
