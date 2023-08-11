import * as Icons from "./icons";
import { AudioContainer, getTrackName } from "./audioContainer";
import { formatDuration, newDiv } from "./util";

export class AudioGroup extends AudioContainer {
	previousTrackButton: HTMLButtonElement;
	nextTrackButton: HTMLButtonElement;
	constructor(
		children: Array<HTMLAudioElement>,
		controller: HTMLElement,
		group: HTMLElement
	) {
		super(children);
		controller.append(this.container);

		this.previousTrackButton = document.createElement("button");
		this.nextTrackButton = document.createElement("button");
		this.previousTrackButton.appendChild(Icons.previousTrack());
		this.nextTrackButton.appendChild(Icons.nextTrack());
		this.nextTrackButton.onclick = this.nextTrack.bind(this);
		this.previousTrackButton.onclick = this.prevTrack.bind(this);
		this.previousTrackButton.setAttribute("inert", "true");
		this.nextTrackButton.ariaLabel = "Next track";
		this.previousTrackButton.ariaLabel = "Previous track";
		if (this.tracks.length === 1) {
			this.nextTrackButton.setAttribute("inert", "true");
		}

		[this.previousTrackButton, this.nextTrackButton].forEach((button) =>
			button.classList.add("RSCbutton", "RSCskipbutton")
		);

		this.bottomBox.append(this.previousTrackButton, this.nextTrackButton);

		for (const [i, track] of this.tracks.entries()) {
			const [audioCard, title, duration, trackNumber] = newDiv(
				"RSCcard",
				"",
				"RSCtimer",
				"RSCord"
			);
			const button = document.createElement("button") as HTMLButtonElement;

			audioCard.id = "RSCcard";

			button.classList.add("RSCbutton", "RSCsmallButton", "RSCplaypause");
			button.ariaLabel = "Play/Pause";
			button.tabIndex = 0;

			button.append(Icons.playButton());
			title.textContent = getTrackName(track);

			trackNumber.textContent = `${i + 1}.`;

			audioCard.append(button, trackNumber, title);

			// Method to add length of track to the track's card. Only works if metadata is loaded
			const addDurationToCard = () => {
				duration.textContent = `${formatDuration(track.duration)}`;
				audioCard.append(duration);
			};

			// If metadata is already loaded, format duration
			// Else, wait for metadata load event and then format duration
			if (track.duration !== undefined) {
				addDurationToCard();
			} else {
				track.addEventListener(
					"loadedmetadata",
					() => {
						addDurationToCard();
					},
					{ once: true }
				);
			}

			group.append(audioCard);

			button.addEventListener("click", () => {
				// If the clicked track is not the currently active track, switch over to it, and start playing.
				// Otherwise, if the clicked track is the currently active track, but is paused, start it.
				// Otherwise, stop playing the currently active track.
				if (this.activeTrack !== track) {
					this.switchTrackProxy(track);
					this.activeNo = i;
					this.start();
				} else if (this.activeTrack.paused) {
					this.start();
				} else {
					this.stop();
				}
			});

			// The builtin MediaEvents are used to update the button icons from play to pause.
			track.addEventListener("play", () => {
				button.replaceChildren(Icons.pauseButton());
				title.style.fontWeight = "bold";
			});
			track.addEventListener("pause", () => {
				// If the active track is paused, then the big button at the top will also need to be set as the play button
				if (this.activeTrack === track) {
					this.button.replaceChildren(Icons.playButton());
				}
				button.replaceChildren(Icons.playButton());
				title.style.fontWeight = "";
			});

			track.addEventListener("ended", () => {
				this.nextTrack();
				button.replaceChildren(Icons.playButton());
			});

			track.addEventListener("timeupdate", () => {
				this.updateDuration();
			});
		}
	}

	switchTrackProxy(track: HTMLAudioElement) {
		if (this.isFirstTrack()) {
			this.previousTrackButton.setAttribute("inert", "true");
		} else {
			this.previousTrackButton.removeAttribute("inert");
		}
		if (this.isLastTrack()) {
			console.log("adding inert");
			this.nextTrackButton.setAttribute("inert", "true");
		} else {
			console.log("removing inert");
			this.nextTrackButton.removeAttribute("inert");
		}
		this.switchTrack(track);
	}

	nextTrack() {
		if (this.activeNo < this.tracks.length - 1) {
			const nextTrack = this.tracks[this.activeNo + 1];
			this.activeNo += 1;
			this.switchTrackProxy(nextTrack);
			this.start();
		}
	}
	prevTrack() {
		if (this.activeNo > 0) {
			const prevTrack = this.tracks[this.activeNo - 1];
			this.activeNo -= 1;
			this.switchTrackProxy(prevTrack);
			this.start();
		}
	}
	isLastTrack(): boolean {
		return this.activeNo >= this.tracks.length - 1;
	}
	isFirstTrack(): boolean {
		return this.activeNo === 0;
	}
}
