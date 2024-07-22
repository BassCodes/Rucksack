// authors  : Alexander Bass
// created  : 2023-8-30
// modified : 2024-5-25

import { orchestrator } from "./orchestrator";
import { getMultiPlayers, getSinglePlayers } from "./injector";
import {
	APPEND_CHILDREN,
	CONSOLE,
	CREATE_ELEMENT,
	DOCUMENT,
	SET_MEDIA_ACTION_HANDLER,
	SET_TEXT_CONTENT,
} from "./util";

const setup = (): void => {
	const stylesheet = CREATE_ELEMENT("style");
	// Do not change the below string. The build system
	// replaces it with css from the style.css
	SET_TEXT_CONTENT(stylesheet, "TEMPLATE REPLACED IN BUILD");
	APPEND_CHILDREN(DOCUMENT.head, stylesheet);

	// Orchestrator handles media events and ensures only one player can be playing at a time
	SET_MEDIA_ACTION_HANDLER("previoustrack", (): void => {
		orchestrator.activePlayer?.prev();
	});
	SET_MEDIA_ACTION_HANDLER("nexttrack", (): void => {
		orchestrator.activePlayer?.next();
	});
	SET_MEDIA_ACTION_HANDLER("pause", (): void => {
		orchestrator.activePlayer?.pause();
	});
	SET_MEDIA_ACTION_HANDLER("play", (): void => {
		orchestrator.activePlayer?.play();
	});
	SET_MEDIA_ACTION_HANDLER("stop", (): void => {
		orchestrator.activePlayer?.pause();
	});

	// Extract info from page and inject players
	let single = getSinglePlayers();
	let multi = getMultiPlayers();
	// Add players to orchestrator
	[...single, ...multi].forEach((p) => {
		orchestrator.addPlayer(p);
	});

	// TODO: change this to count number of tracks too
	CONSOLE.info(`Rucksack: Watching ${orchestrator.players.length} players`);
};

addEventListener("DOMContentLoaded", setup);
