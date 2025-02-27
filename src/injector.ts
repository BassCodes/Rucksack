// authors  : Alexander Bass
// created  : 2024-5-12
// modified : 2024-5-25

import { AudioPlayer, AudioTrack } from "./audioPlayer";
import { MultiTrack } from "./multiTrackPlayer";
import { QUERY_SELECTOR_ALL, LOG_ERROR } from "./util";

// Finds candidate audio containers and collections their audio elements.
// Creates Rucksack players and injects them into the document.

export let extractSingleData = (container: Element): AudioTrack | undefined => {
	let title = container.textContent?.trim();
	if (!title || title.length == 0) {
		LOG_ERROR("RSC: audio title empty");
		return;
	}

	let audios = QUERY_SELECTOR_ALL(container, "audio[controls]");

	if (audios.length > 1) {
		LOG_ERROR(`RSC: audio with title ${title} has too many audio tags.`);
		return;
	} else if (audios.length == 0) {
		LOG_ERROR(
			`RSC: track with title ${title} has no audio tag with 'controls' attribute`
		);
		return;
	}

	// Type cast to HTMLAudioElement is assumed to be safe as the above
	// querySelectorAll specifically looks for audio elements.
	let a = audios[0] as HTMLAudioElement;
	return { a, title };
};

export let getSinglePlayers = (): Array<AudioPlayer> => {
	let players = [];

	for (let container of QUERY_SELECTOR_ALL(document, "figure[data-rsc]")) {
		let track = extractSingleData(container);
		if (track) {
			let player = new AudioPlayer([track]);

			container.replaceWith(player.UI);
			players.push(player);
		}
	}
	return players;
};

export let getMultiPlayers = (): Array<MultiTrack> => {
	return QUERY_SELECTOR_ALL(document, "ol[data-rsc]").map((container) => {
		let p = new MultiTrack(
			QUERY_SELECTOR_ALL(container, "li")
				.map(extractSingleData)
				.filter((t) => t) as Array<AudioTrack>
		);
		container.insertAdjacentElement("afterend", p.trackListElement);
		container.replaceWith(p.UI);
		return p;
	});
};
