// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-25

//
// ALIASES
//

// Typing out the following global objects costs many bytes.
// Aliasing them to a constant allows the mangler to shorten them to

export let CONSOLE = console;

export let LOG = CONSOLE.log;

export let LOG_ERROR = CONSOLE.error;

export let DOCUMENT = document;

// Aliased Methods

export let SET_MEDIA_ACTION_HANDLER = (a: MediaSessionAction, b: () => void): void =>
	navigator?.mediaSession?.setActionHandler?.(a, b);

export let APPEND_CHILDREN = (a: Element, ...b: Element[]): void => a.append(...b);

export let SET_TEXT_CONTENT = (el: HTMLElement, c: string): void => {
	el.textContent = c;
};

//
// DOM MANIPULATION
//

/** Create an HTML element from a tag name. Alias for `document.createElement(tagname)` */
export let CREATE_ELEMENT = <E extends keyof HTMLElementTagNameMap>(
	tagName: E
): HTMLElementTagNameMap[E] => DOCUMENT.createElement(tagName);

/** Create dom elements of type `elementName`. Each further parameter will be the id of an element returned from the function
 Created to reduce large quantities of `document.createElement("div")` calls.
 let [first, second, third] = newElement("div", "idOfFirst", "idOfSecond", "idOfThird");
**/
export let newElements = <E extends keyof HTMLElementTagNameMap>(
	elementName: E,
	...elementIdList: Array<string>
): Array<HTMLElementTagNameMap[E]> =>
	elementIdList.map((id) => {
		let newDiv = CREATE_ELEMENT(elementName);
		newDiv.id = id;
		return newDiv;
	});

export let QUERY_SELECTOR_ALL = (
	node: Element | Document,
	sel: string
): Array<Element> => [...node.querySelectorAll(sel)];

//
// MISC UTILITIES
//

let toStringPadZerosToStart = (n: number): string => (n || 0).toString().padStart(2, "0");

// Format a number to the form of `MM:SS` .
// Does not support hours as lengths, though that could be nice for longer audio files
export let formatDuration = (time: number): string => {
	let seconds = Math.floor(time % 60);
	let minutes = Math.floor(time / 60) % 60;

	return `${toStringPadZerosToStart(minutes)}:${toStringPadZerosToStart(seconds)}`;
};

// Audio metadata load callback
export let audioMetadataLoad = (audio: HTMLAudioElement, callback: () => void): void => {
	// I'm unsure of the validity of this method as it seems like it wouldn't catch all cases
	// but it seems to work.
	if (audio.duration) {
		callback();
	} else {
		audio.addEventListener(
			"loadedmetadata",
			() => {
				callback();
			},
			{ once: true }
		);
	}
};
