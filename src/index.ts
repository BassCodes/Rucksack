// authors  : Alexander Bass
// created  : 2023-8-30
// modified : 2024-5-12

// Rucksack
//
// A script which replaces the inconsistent browser <audio controls> implementations with a widget inspired by <https://bandcamp.com>.
//
// This script is optimized to be as small as reasonably possible without compromising source readability.
//

import "./style.css";

import { Orchestrator } from "./orchestrator";
import { getMultiPlayers, getSinglePlayers } from "./injector";

const setup = () => {
	const orc = new Orchestrator();

	const single = getSinglePlayers();
	const multi = getMultiPlayers();
	single.forEach((p) => {
		orc.addPlayer(p);
	});
	multi.forEach((p) => {
		orc.addPlayer(p);
	});

	console.info(`Rucksack: Watching ${orc.players.length} tracks`);
};

addEventListener("DOMContentLoaded", setup);
