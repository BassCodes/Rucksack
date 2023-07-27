// Rucksack
//
// A script which replaces the inconsistent browser <audio> implementations with a simple widget inspired by <https://bandcamp.com>.
//
// This script is optimized to be as small as reasonably possible without compromising source readability.
// It is intended to be fed through a JS minifier such as <https://www.npmjs.com/package/uglify-js> to slim it down further.
// You will find, through reading these comments and the code it goes with,
// that many quirky design decisions have been made in the effort of slimming down the size of the output file.
//
// Some further size optimizations, like replacing `this` with an alias,
// or extracting methods like `addEventListener` to another function could be made, but would greatly reduce source readability.

"use strict";
// IIFE to
//  A. Isolate code from other scripts that might be running on page
//  B. Assist the minifier in changing variable and function names at the top level
(function () {
	// Would likely be much better to use something like webpack to insert the stylesheet into the script file
	{
		const styleSheet = `.RSCcontainer{align-items:center;padding:10px}.audioGroup audio{margin-inline-start:20px}.RSCcontainer,#RSCcard{font-family:"nimbus sans",sans-serif;display:flex;column-gap:9px}#RSCbottom{display:flex;column-gap:9px;align-items:center}#RSCbottom svg{height:15px;width:auto;cursor:pointer}#RSCbutton,#RSCbuttonSmall{box-sizing:content-box}#RSCbutton{width:20px;height:20px;padding:10px;border:1px solid gray}#RSCbutton:hover,#RSCbuttonSmall:hover{cursor:pointer}#RSCcard{font-size:.9rem;margin-block:5px;padding-inline:10px;align-items:center}#RSCbuttonSmall{display:flex;width:11px;height:11px;border:1px solid gray;padding:5px}#RSCord,#RSCtimer{color:gray;user-select:none}#RSCtimer{font-size:.8em;line-height:1.6em}#RSCright{flex-direction:column;justify-content:space-between;row-gap:3px}#RSCprogress{max-width:100%;width:0;height:100%;background-color:gray}#RSCprogressBox{width:100%;min-width:300px;background-color:#d3d3d3;height:10px;border:1px solid gray}#RSCtop{display:flex;justify-content:space-between;column-gap:10px;flex-wrap:wrap}
	`;
		const style = document.createElement("style");
		style.textContent = styleSheet;
		document.head.append(style);
	}
	let mediaElements: Array<HTMLMediaElement> = [];

	const stopAllMedia = () => {
		mediaElements.forEach((el) => {
			el.pause();
		});
	};

	// Hide audio elements before the document is rendered
	const hideAllAudioElements = () => {
		const groups = document.querySelectorAll("div.audioGroup");
		const audioControls = document.querySelectorAll("audio[controls]");
		for (const group of groups) {
			for (const child of group.children) {
				(child as HTMLElement).style.display = "none";
			}
		}
		for (const track of audioControls) {
			(track as HTMLAudioElement).style.display = "none";
		}
	};

	// Hide audio elements only if and when the document has loaded
	if (document.readyState === "interactive" || document.readyState === "complete") {
		hideAllAudioElements();
	} else {
		document.addEventListener("DOMContentLoaded", () => hideAllAudioElements);
	}

	const setup = () => {
		mediaElements = Array.from(document.querySelectorAll("audio[controls]"));

		// Get all audio elements with controls which are not part of a group
		const nonGroupedAudioElements = document.querySelectorAll(
			"audio[controls]:not(div.audioGroup audio)"
		);

		for (const track of nonGroupedAudioElements) {
			const container = new SingleTrack(track as HTMLAudioElement);
			(track.parentElement as HTMLElement).insertBefore(container.container, track);
		}

		const controllers = document.querySelectorAll("div.audioControls");
		const groups = Array.from(document.querySelectorAll("div.audioGroup"));

		// For each controller (<div class="audioControls" for="2022"></div>),
		// find the respective Group (<div class="audioGroup" name="2022">)
		// Once group, controller, and audio elements have been found, create an AudioGroup
		for (const controller of controllers) {
			const groupName = controller.getAttribute("for");
			if (groupName === undefined) {
				console.warn(`Audio controls without \`for\` attribute`);
				continue;
			}

			const group = groups.find((g) => g.getAttribute("name") === groupName);
			if (group === undefined) {
				console.warn(`Audio controls references group name which can't be found`);
				continue;
			}

			const audioChildren = Array.from(
				group.querySelectorAll("audio[controls]")
			) as Array<HTMLAudioElement>;

			if (audioChildren.length === 0) {
				console.warn("Empty audio group");
				continue;
			}
			new AudioGroup(audioChildren, controller as HTMLAudioElement, group as HTMLElement);
		}

		console.log(`Rucksack: Watching ${mediaElements.length} tracks`);
	};
	addEventListener("load", setup);

	// Instead of calling `document.createElement("div")` many times, this method returns an array of unique new divs.
	// when used in combination with destructuring `const [divA,divB,divC] = newDiv(3)`, `newDiv` saves many bytes
	//
	// The first though approach of using `Array(count).fill(document.createElement("div"));`
	// does not work because it references that once div
	// The second thought idea of for-looping from zero to the count and for each one, manually filling an array works, but takes a lot of bytes.
	// So, instead, each index of the array is filled with the method to make an element on the document, then a `.map()` executes each method with the `"div"` parameter.
	const newDiv = (count: number): Array<HTMLDivElement> =>
		Array(count)
			.fill(document.createElement.bind(document))
			.map((m) => m("div"));

	// Originally, each individual namespaced svg element and attribute was added to create the play and pause buttons.
	// This took up a considerable amount of the file size, so they have been condensed into a few hacky hand-optimized lines.
	//
	// More traditionally, one might have these icons requested over the network, but that's a point of failure, and is much more hassle.

	// Detect whether the client is in dark mode. The color scheme of the player is pretty good in most configurations, except for the play and pause icons.
	// The `dark` constant is used to make the icons lighter when dark mode is on.

	const dark = matchMedia("(prefers-color-scheme: dark)")?.matches ? `fill="gray"` : ``;
	// Yet another space saving measure; putting all of the preamble text of the svgs into one const.
	// Additionally, `dark` is slotted in at this point.
	const svg_pre = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="20" ${dark}><`;

	// The slimmest way of creating unique svg objects from a string I could find.
	// Unique objects are required to prevent extra characters being used to clone a reference each time an icon is used.
	const svgFromText = (input: string): SVGElement => {
		const [t] = newDiv(1);
		// The input must be valid svg or else this code is unsafe.
		t.innerHTML = input;
		return t.firstChild as SVGElement;
	};

	const playButtonIcon = (): SVGElement =>
		svgFromText(`${svg_pre}polygon points="0,0 0,1 1,0.5" /></svg>`);

	const pauseButtonIcon = (): SVGElement =>
		svgFromText(
			`${svg_pre}rect width="0.25" height="1" /><rect width="0.25" x="0.75" height="1" /></svg>`
		);
	const nextTrackIcon = (): SVGElement =>
		svgFromText(
			`${svg_pre}polygon points="0,0.1 0,0.9 0.5,0.5 0.5,0.9 1,0.5 0.5,0.1 0.5,0.5" /></svg>`
		);
	const previousTrackIcon = (): SVGElement =>
		svgFromText(
			`${svg_pre}polygon points="1,0.1 1,0.9 0.5,0.5 0.5,0.9 0,0.5 0.5,0.1 0.5,0.5" /></svg>`
		);

	// Strings used many times have been extracted into constants
	// This can be taken further, but it is important to make sure that extracting a string into a constant *actually reduces* the minified size.
	const loadedmetadata = "loadedmetadata";
	const mousemove = "mousemove";

	abstract class AudioContainer {
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
				this.button,
				this.timer,
				this.progressBox,
				this.progress,
				this.activeTitle,
				this.bottomBox,
			] = newDiv(7);

			const [rightBox, top] = newDiv(2);
			top.id = "RSCtop";

			this.container.className = "RSCcontainer";
			this.button.id = "RSCbutton";

			rightBox.id = "RSCright";
			this.timer.id = "RSCtimer";
			this.progressBox.id = "RSCprogressBox";
			this.progress.id = "RSCprogress";
			this.bottomBox.id = "RSCbottom";

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
					loadedmetadata,
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
				this.progressBox.addEventListener(mousemove, seek);
			});
			this.progressBox.addEventListener("mouseleave", () => {
				this.progressBox.removeEventListener(mousemove, seek);
			});
			this.progressBox.addEventListener("mouseup", () => {
				this.progressBox.removeEventListener(mousemove, seek);
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
			this.button.replaceChildren(pauseButtonIcon());
			this.activeTrack.play();
		}
		stop() {
			this.button.replaceChildren(playButtonIcon());
			this.activeTrack.pause();
		}
	}

	class SingleTrack extends AudioContainer {
		constructor(track: HTMLAudioElement) {
			super([track]);

			track.addEventListener("play", () => {
				this.button.replaceChildren(pauseButtonIcon());
			});
			track.addEventListener("pause", () => {
				this.button.replaceChildren(playButtonIcon());
			});

			track.addEventListener("ended", () => {
				this.button.replaceChildren(playButtonIcon());
			});

			track.addEventListener("timeupdate", () => {
				this.updateDuration();
			});
		}
	}

	class AudioGroup extends AudioContainer {
		constructor(
			children: Array<HTMLAudioElement>,
			controller: HTMLElement,
			group: HTMLElement
		) {
			super(children);
			controller.append(this.container);
			const nextTrackButton = nextTrackIcon();
			const previousTrackButton = previousTrackIcon();
			this.bottomBox.append(previousTrackButton, nextTrackButton);
			nextTrackButton.onclick = this.nextTrack.bind(this);
			previousTrackButton.onclick = this.prevTrack.bind(this);

			for (const [i, track] of this.tracks.entries()) {
				const [audioCard, button, title, duration, trackNumber] = newDiv(5);
				audioCard.id = "RSCcard";
				button.id = "RSCbuttonSmall";
				trackNumber.id = "RSCord";
				button.append(playButtonIcon());
				title.textContent = getTrackName(track);
				duration.id = "RSCtimer";

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
						loadedmetadata,
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
						this.switchTrack(track);
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
					button.replaceChildren(pauseButtonIcon());
					title.style.fontWeight = "bold";
				});
				track.addEventListener("pause", () => {
					// If the active track is paused, then the big button at the top will also need to be set as the play button
					if (this.activeTrack === track) {
						this.button.replaceChildren(playButtonIcon());
					}
					button.replaceChildren(playButtonIcon());
					title.style.fontWeight = "";
				});

				track.addEventListener("ended", () => {
					this.nextTrack();
					button.replaceChildren(playButtonIcon());
				});

				track.addEventListener("timeupdate", () => {
					this.updateDuration();
				});
			}
		}

		nextTrack() {
			if (this.activeNo + 1 < this.tracks.length) {
				const nextTrack = this.tracks[this.activeNo + 1];
				this.switchTrack(nextTrack);
				this.activeNo += 1;
				this.start();
			}
		}
		prevTrack() {
			if (this.activeNo > 0) {
				const prevTrack = this.tracks[this.activeNo - 1];
				this.switchTrack(prevTrack);
				this.activeNo -= 1;
				this.start();
			}
		}
	}

	const getTrackName = (track: HTMLAudioElement): string =>
		track.getAttribute("title") ?? track.src.split("/").reverse()[0] ?? "";

	const toStringPadZerosToStart = (n: number): string =>
		(n || 0).toString().padStart(2, "0");
	const formatDuration = (time: number): string => {
		const seconds = Math.floor(time % 60);
		const minutes = Math.floor(time / 60) % 60;

		return `${toStringPadZerosToStart(minutes)}:${toStringPadZerosToStart(seconds)}`;
	};
})();
