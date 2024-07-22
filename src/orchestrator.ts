// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-25

import { AudioPlayer } from "./audioPlayer";

interface Orchestrator {
	players: AudioPlayer[];
	activePlayer?: undefined | AudioPlayer;
	addPlayer: (a: AudioPlayer) => void;
	setActivePlayer: (a: AudioPlayer) => void;
}

export let orchestrator: Orchestrator = {
	players: [],
	// These functions could be replaced with arrow functions with some hacks.
	// Not sure if that would be worthwhile.
	addPlayer: function (player: AudioPlayer): void {
		this.players.push(player);

		player.UI.addEventListener("RSCaudioStart", () => {
			this.setActivePlayer(player);
		});
	},
	setActivePlayer: function (p: AudioPlayer): void {
		this.activePlayer = p;
		for (const player of this.players) {
			if (p == player) continue;
			player.pause();
		}
	},
};
