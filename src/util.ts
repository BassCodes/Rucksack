// Created to reduce large quantities of `document.createElement("div")` calls.
// The intended use of this method is:
// const [first, second, third] = newElement("div", "idOfFirst", "idOfSecond", "idOfThird");
export const newElement = (
	elementName: string,
	...elementIdList: Array<string>
): Array<HTMLElement> =>
	elementIdList.map((id) => {
		const newDiv = document.createElement(elementName);
		newDiv.id = id;
		return newDiv;
	});

const toStringPadZerosToStart = (n: number): string =>
	(n || 0).toString().padStart(2, "0");

// Format a number to the form of `MM:SS` .
// Does not support hours as lengths, though that could be nice for longer audio files
export const formatDuration = (time: number): string => {
	const seconds = Math.floor(time % 60);
	const minutes = Math.floor(time / 60) % 60;

	return `${toStringPadZerosToStart(minutes)}:${toStringPadZerosToStart(seconds)}`;
};
