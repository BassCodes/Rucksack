import { AudioPlayer } from "./audioPlayer";

export class Orchestrator {
	players: Array<AudioPlayer>;
	activePlayer: null | AudioPlayer;
	constructor() {
		this.players = [];
		this.activePlayer = null;

		navigator.mediaSession.setActionHandler("previoustrack", () => {
			this.activePlayer?.prevTrack();
		});
		navigator.mediaSession.setActionHandler("nexttrack", () => {
			this.activePlayer?.nextTrack();
		});
		navigator.mediaSession.setActionHandler("pause", () => {
			this.activePlayer?.pause();
		});
		navigator.mediaSession.setActionHandler("play", (e) => {
			this.activePlayer?.play();
		});
		navigator.mediaSession.setActionHandler("stop", () => {
			this.activePlayer?.stop();
		});
	}

	addPlayer(player: AudioPlayer) {
		this.players.push(player);
		player.UI.addEventListener("RSCaudioStart", () => {
			this.setActivePlayer(player);
		});
	}
	setActivePlayer(p: AudioPlayer) {
		this.activePlayer = p;
		for (const player of this.players) {
			if (p == player) continue;
			player.pause();
		}
	}
}
