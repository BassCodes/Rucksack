// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-25

import * as Icons from "./icons";
import { AudioPlayer, AudioTrack, STATUS_PAUSED } from "./audioPlayer";
import {
	newElements,
	formatDuration,
	audioMetadataLoad,
	CREATE_ELEMENT,
	LOG,
	APPEND_CHILDREN,
	SET_TEXT_CONTENT,
} from "./util";

export class MultiTrack extends AudioPlayer {
	previousTrackButton: HTMLButtonElement;
	nextTrackButton: HTMLButtonElement;
	trackListElement: HTMLElement;
	constructor(tracks: Array<AudioTrack>) {
		super(tracks);

		this.trackListElement = CREATE_ELEMENT("ol");
		this.trackListElement.classList.add("audioGroup");

		[this.previousTrackButton, this.nextTrackButton] = newElements("button", "", "");

		APPEND_CHILDREN(this.previousTrackButton, Icons.previousTrack());
		this.previousTrackButton.onclick = this.prev.bind(this);
		this.previousTrackButton.ariaLabel = "Previous track";
		this.previousTrackButton.setAttribute("inert", "");

		APPEND_CHILDREN(this.nextTrackButton, Icons.nextTrack());
		this.nextTrackButton.onclick = this.next.bind(this);
		this.nextTrackButton.ariaLabel = "Next track";
		// Though it would pointless compared to a `audioPlayer`, a `MultiTrack` with one track can be created.
		// In this case, the next track button would never work, thus it is made inert.
		if (this.tracks.length == 1) {
			this.nextTrackButton.setAttribute("inert", "");
		}

		[this.previousTrackButton, this.nextTrackButton].forEach((b) =>
			b.classList.add("RSCbutton", "RSCskipbutton")
		);

		APPEND_CHILDREN(this.bottomBox, this.previousTrackButton, this.nextTrackButton);

		for (const [i, track] of this.tracks.entries()) {
			let trackCard = this.setupTrackCard(i, track);

			APPEND_CHILDREN(this.trackListElement, trackCard);
		}
	}

	private setupTrackCard(i: number, track: AudioTrack): HTMLElement {
		// Frankly, I don't like how the track cards work, but I don't want to make another class. Probably will need to eventually
		const [audioCard] = newElements("li", "RSCcard");
		const [title, duration, trackNumber] = newElements(
			"span",
			"RSCtitle",
			"RSCtimer",
			"RSCord"
		);

		audioCard.role = "listitem";

		const button = CREATE_ELEMENT("button");
		button.classList.add("RSCbutton", "RSCsmallButton", "RSCplaypause");
		button.ariaLabel = "Play/Pause";
		APPEND_CHILDREN(button, Icons.playButton());

		SET_TEXT_CONTENT(title, track.title);

		SET_TEXT_CONTENT(trackNumber, `${i + 1}.`);

		APPEND_CHILDREN(audioCard, button, trackNumber, title);

		// Method to add length of track to the track's card. Only works if metadata is loaded
		const addDurationToCard = (): void => {
			SET_TEXT_CONTENT(duration, `${formatDuration(track.a.duration)}`);
			APPEND_CHILDREN(audioCard, duration);
		};

		// If metadata is already loaded, format duration
		// Else, wait for metadata load event and then format duration
		audioMetadataLoad(track.a, addDurationToCard);

		if (track.a.error) {
			button.classList.add("errored");
			button.replaceChildren(Icons.errorButton());
			SET_TEXT_CONTENT(duration, "track could not be loaded");
		}

		button.onclick = (): void => {
			if (this.at != track) {
				this.switchTrack(i);
				this.activeNo = i;
				this.play();
			} else {
				this.togglePlaying();
			}
		};

		track.a.onplay = (): void => {
			if (this.at != track) {
				this.switchTrack(i);
			}
			button.replaceChildren(Icons.pauseButton());
			title.style.fontWeight = "bold";
		};

		track.a.onpause = (): void => {
			// If the active track is paused, then the big button at the top will also need to be set as the play button
			if (this.at == track) {
				this.setStatus(STATUS_PAUSED);
			}
			button.replaceChildren(Icons.playButton());
			title.style.fontWeight = "";
		};

		track.a.onended = (): void => {
			this.next();
			button.replaceChildren(Icons.playButton());
			if (this.at == track) this.setStatus(STATUS_PAUSED);
		};

		track.a.onerror = (e): void => {
			LOG(e);
			SET_TEXT_CONTENT(duration, "error");
		};
		return audioCard;
	}

	switchTrack(trackno: number): void {
		super.switchTrack(trackno);
		if (this.isFirstTrack()) {
			this?.previousTrackButton?.setAttribute("inert", "");
		} else {
			this?.previousTrackButton?.removeAttribute("inert");
		}
		if (this.isLastTrack()) {
			this?.nextTrackButton?.setAttribute("inert", "");
		} else {
			this?.nextTrackButton?.removeAttribute("inert");
		}
	}
}
