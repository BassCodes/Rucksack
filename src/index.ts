// authors  : Alexander Bass
// created  : 2023-8-30
// modified : 2024-5-13

import { Orchestrator } from "./orchestrator";
import { getMultiPlayers, getSinglePlayers } from "./injector";
import { N } from "./util";

const setup = (): void => {
	const stylesheet = N("style");
	stylesheet.textContent = "TEMPLATE REPLACED IN BUILD";
	document.head.append(stylesheet);

	// Orchestrator handles media events and ensures only one player can be playing at a time
	let orc = new Orchestrator();

	let single = getSinglePlayers();
	let multi = getMultiPlayers();
	single.forEach((p) => {
		orc.addPlayer(p);
	});
	multi.forEach((p) => {
		orc.addPlayer(p);
	});

	console.info(`Rucksack: Watching ${orc.players.length} tracks`);
};

addEventListener("DOMContentLoaded", setup);
