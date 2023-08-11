// Originally, each individual namespaced svg element and attribute was added to create the play and pause buttons.
// This took up a considerable amount of the file size, so they have been condensed into a few hacky hand-optimized lines.
//
// More traditionally, one might have these icons requested over the network, but that's a point of failure, and is much more hassle.

// Detect whether the client is in dark mode. The color scheme of the player is pretty good in most configurations, except for the play and pause icons.
// The `dark` constant is used to make the icons lighter when dark mode is on.

const dark = matchMedia("(prefers-color-scheme: dark)")?.matches ? `fill="gray"` : ``;
// Yet another space saving measure; putting all of the preamble text of the svgs into one const.
// Additionally, `dark` is slotted in at this point.
const svgPre = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="20" ${dark}><`;
const svgPost = " /></svg>";
// The slimmest way of creating unique svg objects from a string I could find.
// Unique objects are required to prevent extra characters being used to clone a reference each time an icon is used.
const svgFromText = (input: string): SVGElement => {
	const svgCreationContainer = document.createElement("div");
	// The input must be valid svg or else this code is unsafe.
	svgCreationContainer.innerHTML = input;
	return svgCreationContainer.firstChild as SVGElement;
};

export const playButton = (): SVGElement =>
	svgFromText(`${svgPre}polygon points="0,0 0,1 1,0.5"${svgPost}`);

export const pauseButton = (): SVGElement =>
	svgFromText(
		`${svgPre}rect width="0.25" height="1" /><rect width="0.25" x="0.75" height="1"${svgPost}`
	);
export const nextTrack = (): SVGElement =>
	svgFromText(
		`${svgPre}polygon points="0,0.1 0,0.9 0.5,0.5 0.5,0.9 1,0.5 0.5,0.1 0.5,0.5"${svgPost}`
	);
export const previousTrack = (): SVGElement =>
	svgFromText(
		`${svgPre}polygon points="1,0.1 1,0.9 0.5,0.5 0.5,0.9 0,0.5 0.5,0.1 0.5,0.5"${svgPost}`
	);
