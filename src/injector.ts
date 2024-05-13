// authors  : Alexander Bass
// created  : 2024-5-12
// modified : 2024-5-12

import { MultiTrack } from "./multiTrackPlayer";
import { SingleTrack } from "./singleTrackPlayer";

// Finds candidate audio containers and collections their audio elements.
// Creates Rucksack players and injects them into the document.

export function getSinglePlayers(): Array<SingleTrack> {
	const containers = Array.from(document.querySelectorAll("figure[data-rsc]"));
	let players = [];

	for (const container of containers) {
		const data = extractSingleData(container);
		if (data === undefined) {
			continue;
		}
		const { audio, title } = data;

		const player = new SingleTrack(audio);

		container.replaceWith(player.UI);
		players.push(player);
	}
	return players;
}

function extractSingleData(container: Element):
	| {
			audio: HTMLAudioElement;
			title: string;
	  }
	| undefined {
	const title = container.textContent?.trim();
	if (title === undefined || title.length === 0) {
		console.error("RSC: audio title empty");
		return;
	}

	const audios = Array.from(container.querySelectorAll("audio[controls]"));
	if (audios.length > 1) {
		console.error(`RSC: audio with title ${title} has too many audio tags.`);
		return;
	} else if (audios.length === 0) {
		console.error(
			`RSC: audio with title ${title} has no audio tag with 'controls' attribute`
		);
		return;
	}

	// Type cast to HTMLAudioElement is assumed to be safe as the above
	// querySelectorAll specifically looks for audio elements.
	const audio = audios[0] as HTMLAudioElement;
	return { audio, title };
}

export function getMultiPlayers(): Array<MultiTrack> {
	let players = [];

	const containers = Array.from(document.querySelectorAll("ol[data-rsc]"));
	for (const container of containers) {
		const data = extractMultiData(container);
		if (data === undefined) {
			continue;
		}
		const audios = data.map((d) => d.audio);
		const player = new MultiTrack(audios);
		container.insertAdjacentElement("afterend", player.trackListElement);
		container.replaceWith(player.UI);
		players.push(player);
	}

	return players;
}

function extractMultiData(container: Element): Array<{
	audio: HTMLAudioElement;
	title: string;
}> {
	const title = container.textContent?.trim();
	let tracks = [];
	const items = Array.from(container.querySelectorAll("li"));
	for (const i of items) {
		const data = extractSingleData(i);
		if (data === undefined) {
			continue;
		}
		tracks.push(data);
	}

	return tracks;
}
