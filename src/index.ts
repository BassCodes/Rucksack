// Rucksack
//
// A script which replaces the inconsistent browser <audio controls> implementations with a simple widget inspired by <https://bandcamp.com>.
//
// This script is optimized to be as small as reasonably possible without compromising source readability.
//

import "./style.css";

import { SingleTrack } from "./singleTrack";
import { AudioGroup } from "./audioGroup";
import { mediaElements } from "./audioContainer";

// Hide audio elements before the document is rendered
const hideAllAudioElements = () => {
	const groups = document.querySelectorAll("ol.audioGroup");
	for (const group of groups) {
		for (const child of group.children) {
			(child as HTMLElement).style.display = "none";
		}
	}
	const audioControls = document.querySelectorAll("audio[controls]");
	for (const track of audioControls) {
		(track as HTMLAudioElement).style.display = "none";
	}
};

const setup = () => {
	hideAllAudioElements();

	mediaElements.list = Array.from(document.querySelectorAll("audio[controls]"));

	// Get all audio elements with controls which are not part of a group
	const nonGroupedAudioElements = document.querySelectorAll(
		"audio[controls]:not(ol.audioGroup audio)"
	);

	for (const track of nonGroupedAudioElements) {
		const container = new SingleTrack(track as HTMLAudioElement);
		(track.parentElement as HTMLElement).insertBefore(container.container, track);
	}

	const controllers = document.querySelectorAll("div.audioControls");
	const groups = Array.from(document.querySelectorAll("ol.audioGroup"));

	// For each controller (<div class="audioControls" for="2022"></div>),
	// find the respective Group (<ol class="audioGroup" name="2022">)
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

	console.info(`Rucksack: Watching ${mediaElements.list.length} tracks`);
};
addEventListener("load", setup);
