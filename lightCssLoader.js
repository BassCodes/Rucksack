// The usual combo of style-loader + css-loader creates a pretty large file.
// In the case of the rest the rucksack library,
// the boilerplate created by those two webpack plugins rivals the size of the code from rucksack itself.

function addStyleToDocument(value) {
	const stylesheet = document.createElement("style");
	stylesheet.textContent = value;
	document.head.append(stylesheet);
}

function loader(data) {
	return `
    (${addStyleToDocument.toString()})(${JSON.stringify(data)})
  `;
}

module.exports = loader;
