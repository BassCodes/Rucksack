import { formatDuration, newElement } from "./util";
import * as Icons from "./icons";

export const getTrackName = (track: HTMLAudioElement): string =>
	track.getAttribute("title") ?? track.src.split("/").reverse()[0] ?? "";

// ugly workaround to get a global variable usable across all modules
export let mediaElements: { list: Array<HTMLMediaElement> } = { list: [] };

function stopAllMedia() {
	mediaElements.list.forEach((el) => {
		el.pause();
	});
}

export abstract class AudioContainer {
	activeTrack: HTMLAudioElement;
	activeNo: number;
	activeTitle: HTMLElement;

	tracks: Array<HTMLAudioElement>;

	container: HTMLElement;
	button: HTMLElement;
	timer: HTMLElement;
	progressBox: HTMLElement;
	progress: HTMLElement;
	bottomBox: HTMLElement;

	constructor(tracks: Array<HTMLAudioElement>) {
		this.activeNo = 0;
		this.tracks = tracks;
		this.activeTrack = this.tracks[0];

		this.tracks.forEach((t) => t.setAttribute("preload", "metadata"));

		[
			this.container,
			this.timer,
			this.progressBox,
			this.progress,
			this.activeTitle,
			this.bottomBox,
		] = newElement(
			"div",
			"RSCcontainer",
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

		this.progressBox.append(this.progress);
		this.bottomBox.append(this.progressBox);
		this.switchTrack(this.tracks[0]);
		this.stop();
		this.updateDuration();

		top.append(this.activeTitle);
		rightBox.append(top, this.bottomBox);
		this.container.append(this.button, rightBox);

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

	switchTrack(track: HTMLAudioElement) {
		if (this.activeTrack !== undefined) {
			this.activeTrack.pause();
			this.activeTrack.currentTime = 0;
		}
		this.activeTrack = track;
		this.activeTitle.textContent = getTrackName(this.activeTrack);
	}

	quickSeek(percentage: number) {
		this.activeTrack.fastSeek((this.activeTrack.duration || 0) * percentage);
	}

	updateDuration() {
		const totalDuration = formatDuration(this.activeTrack.duration);
		const currentTime = formatDuration(this.activeTrack.currentTime);
		this.timer.textContent = `${currentTime} / ${totalDuration}`;
		this.progress.style.width = `${
			100 * (this.activeTrack.currentTime / this.activeTrack.duration || 0)
		}%`;
	}
	togglePlaying() {
		if (this.activeTrack.paused) {
			this.start();
		} else {
			this.stop();
		}
	}
	start() {
		stopAllMedia();
		this.button.replaceChildren(Icons.pauseButton());
		this.activeTrack.play();
	}
	stop() {
		this.button.replaceChildren(Icons.playButton());
		this.activeTrack.pause();
	}
}
