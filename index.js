"use strict";
let mediaElements = [];

document.addEventListener("DOMContentLoaded", () => {
	mediaElements = Array.from(document.getElementsByTagName("audio"));
	mediaElements = mediaElements.filter((el) => {
		return "controls" in el;
	});
	const individualA = mediaElements.filter(
		(el) => !el.parentElement.classList.contains("audioGroup")
	);
	for (const el of individualA) {
		new Audio(el);
	}

	const controllers = document.querySelectorAll("div.audioControls");
	const groups = Array.from(document.querySelectorAll("div.audioGroup"));

	for (const c of controllers) {
		const f = c.getAttribute("for");
		if (f === undefined) {
			console.warn(`Audio controls without \`for\` attribute`);
			continue;
		}

		const group = groups.find((g) => g.getAttribute("name") === f);
		if (group === undefined) {
			console.warn(`Audio controls references group name which can't be found`);
			continue;
		}

		Array.from(group.children).forEach((c) => (c.style.display = "none"));

		const audioChildren = Array.from(group.querySelectorAll("audio[controls]"));

		new Audio(null, c, group, audioChildren);
		console.log(group);
	}

	console.log(`AVControlSync: Watching ${mediaElements.length} media elements`);
});

const SVG_NS = "http://www.w3.org/2000/svg";

const playButton = document.createElementNS(SVG_NS, "svg");
const pauseButton = document.createElementNS(SVG_NS, "svg");
playButton.setAttributeNS(null, "viewBox", "0 0 1 1");
{
	const poly = document.createElementNS(SVG_NS, "polygon");
	poly.setAttributeNS(null, "points", "0,0 0,1 1,0.5");
	playButton.appendChild(poly);
}
pauseButton.setAttributeNS(null, "viewBox", "0 0 1 1");
{
	const rect1 = document.createElementNS(SVG_NS, "rect");
	rect1.setAttributeNS(null, "width", "0.25");
	rect1.setAttributeNS(null, "height", "1");
	const rect2 = document.createElementNS(SVG_NS, "rect");
	rect2.setAttributeNS(null, "width", "0.25");
	rect2.setAttributeNS(null, "x", "0.75");
	rect2.setAttributeNS(null, "height", "1");
	pauseButton.appendChild(rect1);
	pauseButton.appendChild(rect2);
}

function newDiv(count) {
	if (count > 1) {
		const ret = Array(count);
		for (let i = 0; i < ret.length; i++) {
			ret[i] = document.createElement("div");
		}
		return ret;
	} else {
		return document.createElement("div");
	}
}

class Audio {
	constructor(singleElement, controller, group, children) {
		this.trackNumber = 0;


		[
			this.container,
			this.playButton,
			this.progressTimer,
			this.progressBar,
			this.progressIndicator,
			this.trackTitle,
		] = newDiv(6);

		if (singleElement !== null) {
			this.tracks = [singleElement];

			this.groupMode = false;
			singleElement.style.display = "none";
			singleElement.addEventListener("timeupdate", () => {
				this.updateDuration();
			});
			singleElement.addEventListener("pause", () => {
				this.playButton.replaceChildren(playButton.cloneNode(true));
			});
		} else {
			this.tracks = children;
      this.container = controller;
			for (const [i, child] of children.entries()) {
				const [audioCard, button, title, duration, trackNumber] = newDiv(5);
				audioCard.id = "audioCard";
				title.id = "cardTitle";
				button.id = "playButtonSmall";
				button.appendChild(playButton.cloneNode(true));
				title.textContent =
					child.getAttribute("title") ??
					child.src.split("/").reverse()[0] ??
					"";
				duration.id = "progressTimer";
				child.addEventListener(
					"loadedmetadata",
					() => {
						duration.textContent = `${formatDuration(child.duration)}`;
						audioCard.appendChild(duration);
					},
					{ once: true }
				);
				trackNumber.textContent = `${i}.`;
				trackNumber.id = "trackNumber";

				audioCard.appendChild(button);
				audioCard.appendChild(trackNumber);
				audioCard.appendChild(title);
				group.appendChild(audioCard);

				button.addEventListener("click", () => {
					if (this.playingTrack !== child) {
						this.switchTrack(child);
						this.trackNumber = i;
						this.start();
						return;
					}
					if (this.playingTrack.paused || this.playingTrack.ended) {
						this.start();
					} else {
						this.stop();
					}
				});

				child.addEventListener("play", () => {
					button.replaceChildren(pauseButton.cloneNode(true));
				});
				child.addEventListener("pause", () => {
					if (this.playingTrack === child) {
						this.playButton.replaceChildren(playButton.cloneNode(true));
					}
					button.replaceChildren(playButton.cloneNode(true));
				});
				child.addEventListener("ended", () => {
					this.nextTrack();
					button.replaceChildren(playButton.cloneNode(true));
				});

				child.addEventListener("timeupdate", () => {
					this.updateDuration();
				});
			}
			this.groupMode = true;
		}


		const [rightBox, top] = newDiv(2);
		this.container.className = "audioBlock";
		this.playButton.id = "playButton";

		rightBox.id = "right";

		top.classList.add("row");

		this.progressTimer.id = "progressTimer";

		this.progressBar.id = "progressBar";

		this.progressIndicator.id = "progressIndicator";

		this.trackTitle.id = "title";

		this.progressBar.appendChild(this.progressIndicator);

		this.switchTrack(this.tracks[0]);
		this.stop();
		this.updateDuration();

		top.append(this.trackTitle, this.progressTimer);
		rightBox.append(top, this.progressBar);
		this.container.append(this.playButton, rightBox);

		if (this.groupMode) {
			document.body.insertBefore(this.container, group);
		} else {
			document.body.appendChild(this.container);
		}

		this.playingTrack.addEventListener(
			"loadedmetadata",
			() => {
				this.updateDuration();
			},
			{ once: true }
		);

		this.playButton.addEventListener("click", () => {
			this.togglePlaying();
		});

		const seek = (e) => this.quickSeek(e);
		this.progressBar.addEventListener("mousedown", (e) => {
			const percentage = e.offsetX / this.progressBar.scrollWidth;
			this.playingTrack.currentTime =
				(this.playingTrack.duration || 0) * percentage;
			this.progressBar.addEventListener("mousemove", seek);
		});
		this.progressBar.addEventListener("mouseleave", () => {
			this.progressBar.removeEventListener("mousemove", seek);
		});
		this.progressBar.addEventListener("mouseup", () => {
			this.progressBar.removeEventListener("mousemove", seek);
		});
	}

	nextTrack() {
		if (this.trackNumber + 1 < this.tracks.length) {
			const nextTrack = this.tracks[this.trackNumber + 1];
			this.switchTrack(nextTrack);
			this.trackNumber += 1;
			this.start();
		}
	}
	prevTrack() {
		if (this.trackNumber > 0) {
			const prevTrack = this.tracks[this.trackNumber - 1];
			this.switchTrack(prevTrack);
			this.trackNumber -= 1;
			this.start();
		}
	}

	switchTrack(track) {
		if (this.playingTrack !== undefined) {
			this.playingTrack.pause();
			this.playingTrack.currentTime = 0;
		}
		this.playingTrack = track;
		this.trackTitle.textContent =
			this.playingTrack.getAttribute("title") ??
			this.playingTrack.src.split("/").reverse()[0] ??
			"";
	}

	quickSeek(e) {
		const percentage = e.offsetX / this.progressBar.scrollWidth;
		this.playingTrack.fastSeek((this.playingTrack.duration || 0) * percentage);
	}

	updateDuration() {
		const totalDuration = formatDuration(this.playingTrack.duration || 0);
		const currentTime = formatDuration(this.playingTrack.currentTime || 0);
		const formatted = `${currentTime} / ${totalDuration}`;
		this.progressTimer.textContent = formatted;
		this.progressIndicator.style.width = `${
			100 *
			(this.playingTrack.currentTime / (this.playingTrack.duration || 0) || 0)
		}%`;
	}
	togglePlaying() {
		if (this.playingTrack.paused || this.playingTrack.ended) {
			this.start();
		} else {
			this.stop();
		}
	}
	start() {
		stopAllOtherMedia();
		this.playButton.replaceChildren(pauseButton.cloneNode(true));
		stopAllOtherMedia();
		this.playingTrack.play();
	}
	stop() {
		this.playButton.replaceChildren(playButton.cloneNode(true));
		this.playingTrack.pause();
	}
}

function formatDuration(time) {
	const seconds = Math.floor(time % 60);
	const minutes = Math.floor(time / 60) % 60;

	return `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
}

function stopAllOtherMedia() {
	mediaElements.forEach((el) => {
		// if (el === playingElement) {
		// return;
		// }
		el.pause();
	});
}
