// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-13

import { AudioPlayer, AudioPlayerI } from "./audioPlayer";

export class Orchestrator {
	players: Array<AudioPlayerI>;
	activePlayer: null | AudioPlayerI;
	constructor() {
		this.players = [];
		this.activePlayer = null;
		const handlers = [
			[
				"previoustrack",
				(): void => {
					this.activePlayer?.prev();
				},
			],
			[
				"nexttrack",
				(): void => {
					this.activePlayer?.next();
				},
			],
			[
				"pause",
				(): void => {
					this.activePlayer?.pause();
				},
			],
			[
				"play",
				(): void => {
					this.activePlayer?.play();
				},
			],
			[
				"stop",
				(): void => {
					this.activePlayer?.pause();
				},
			],
		];
		for (const [key, val] of handlers) {
			navigator.mediaSession.setActionHandler(
				key as MediaSessionAction,
				val as MediaSessionActionHandler
			);
		}
	}

	addPlayer(player: AudioPlayer): void {
		this.players.push(player);
		player.UI.addEventListener("RSCaudioStart", () => {
			this.setActivePlayer(player);
		});
	}
	setActivePlayer(p: AudioPlayer): void {
		this.activePlayer = p;
		for (const player of this.players) {
			if (p == player) continue;
			player.pause();
		}
	}
}
