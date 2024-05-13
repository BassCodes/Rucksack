// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-12
import * as Icons from "./icons";
import { AudioPlayer, getTrackName } from "./audioPlayer";
import { newElement, formatDuration } from "./util";
import { TrackStatus } from "./audioTrack";

export class MultiTrack extends AudioPlayer {
	previousTrackButton: HTMLButtonElement;
	nextTrackButton: HTMLButtonElement;
	trackListElement: HTMLElement;
	constructor(children: Array<HTMLAudioElement>) {
		super(children);

		this.trackListElement = document.createElement("ol");
		this.trackListElement.classList.add("audioGroup");

		this.previousTrackButton = document.createElement("button");
		this.previousTrackButton.append(Icons.previousTrack());
		this.previousTrackButton.onclick = this.prevTrack.bind(this);
		this.previousTrackButton.ariaLabel = "Previous track";
		this.previousTrackButton.setAttribute("inert", "true");

		this.nextTrackButton = document.createElement("button");
		this.nextTrackButton.append(Icons.nextTrack());
		this.nextTrackButton.onclick = this.nextTrack.bind(this);
		this.nextTrackButton.ariaLabel = "Next track";
		// Though it would pointless compared to a `singleTrack`, an `audioGroup` with one track can be created.
		// In this case, the next track button would never work, thus it is made inert.

		if (this.tracks.length === 1) {
			this.nextTrackButton.setAttribute("inert", "true");
		}

		[this.previousTrackButton, this.nextTrackButton].forEach((button) =>
			button.classList.add("RSCbutton", "RSCskipbutton")
		);

		this.bottomBox.append(this.previousTrackButton, this.nextTrackButton);

		this.trackListElement.role = "list";

		for (const [i, track] of this.tracks.entries()) {
			let trackCard = this.setupTrackCard(i, track);

			this.trackListElement.append(trackCard);
		}
	}

	private setupTrackCard(i: number, track: HTMLAudioElement): HTMLElement {
		// Frankly, I don't like how the track cards work, but I don't want to make another class. Probably will need to eventually
		const [audioCard] = newElement("li", "RSCcard");
		const [title, duration, trackNumber] = newElement(
			"span",
			"RSCtitle",
			"RSCtimer",
			"RSCord"
		);

		audioCard.id = "RSCcard";
		audioCard.role = "listitem";

		const button = document.createElement("button");
		button.classList.add("RSCbutton", "RSCsmallButton", "RSCplaypause");
		button.ariaLabel = "Play/Pause";
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
		console.log(track.error);
		if (track.error != undefined) {
			button.classList.add("errored");
			button.replaceChildren(Icons.errorButton());
			duration.textContent = "track could not be loaded";
		}
		button.addEventListener("click", () => {
			if (this.activeTrack !== track) {
				this.switchTrack(track);
				this.activeNo = i;
				this.play();
			} else {
				this.togglePlaying();
			}
		});

		track.addEventListener("play", () => {
			if (this.activeTrack != track) {
				this.switchTrack(track);
			}
			button.replaceChildren(Icons.pauseButton());
			title.style.fontWeight = "bold";
		});
		track.addEventListener("pause", () => {
			// If the active track is paused, then the big button at the top will also need to be set as the play button
			if (this.activeTrack === track) {
				this.setStatus(TrackStatus.Paused);
			}
			button.replaceChildren(Icons.playButton());
			title.style.fontWeight = "";
		});

		track.addEventListener("ended", () => {
			this.nextTrack();
			button.replaceChildren(Icons.playButton());
			if (this.activeTrack === track) {
				this.setStatus(TrackStatus.Paused);
			}
		});

		track.addEventListener("timeupdate", () => {
			this.updateDuration();
		});

		track.addEventListener("error", (e) => {
			console.log(e);
			duration.textContent = "error";
		});
		return audioCard;
	}

	switchTrack(track: HTMLAudioElement): void {
		super.switchTrack(track);
		if (this.isFirstTrack()) {
			this.previousTrackButton.setAttribute("inert", "true");
		} else {
			this.previousTrackButton.removeAttribute("inert");
		}
		if (this.isLastTrack()) {
			this.nextTrackButton.setAttribute("inert", "true");
		} else {
			this.nextTrackButton.removeAttribute("inert");
		}
	}
}
