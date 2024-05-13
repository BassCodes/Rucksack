// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-12

import { AudioPlayer, AudioPlayerI } from "./audioPlayer";

export class Orchestrator {
	players: Array<AudioPlayerI>;
	activePlayer: null | AudioPlayerI;
	constructor() {
		this.players = [];
		this.activePlayer = null;

		let session = navigator.mediaSession;

		session.setActionHandler("previoustrack", () => {
			this.activePlayer?.prev();
		});
		session.setActionHandler("nexttrack", () => {
			this.activePlayer?.next();
		});
		session.setActionHandler("pause", () => {
			this.activePlayer?.pause();
		});
		session.setActionHandler("play", () => {
			this.activePlayer?.play();
		});
		session.setActionHandler("stop", () => {
			this.activePlayer?.stop();
		});
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
