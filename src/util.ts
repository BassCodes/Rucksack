// authors  : Alexander Bass
// created  : 2024
// modified : 2024-5-22

/** Create an HTML element from a tag name. Alias for `document.createElement(tagname)` */
export let N = <E extends keyof HTMLElementTagNameMap>(
	tagName: E
): HTMLElementTagNameMap[E] => document.createElement(tagName);

/** Create dom elements of type `elementName`. Each further parameter will be the id of an element returned from the function
 Created to reduce large quantities of `document.createElement("div")` calls.
 let [first, second, third] = newElement("div", "idOfFirst", "idOfSecond", "idOfThird");
**/
export let newElements = <E extends keyof HTMLElementTagNameMap>(
	elementName: E,
	...elementIdList: Array<string>
): Array<HTMLElementTagNameMap[E]> =>
	elementIdList.map((id) => {
		let newDiv = N(elementName);
		newDiv.id = id;
		return newDiv;
	});

export let $ = (node: Element | Document, sel: string): Array<Element> => [
	...node.querySelectorAll(sel),
];

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
