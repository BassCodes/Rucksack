export const newDiv = (...divIds: Array<string>): Array<HTMLDivElement> =>
	divIds.map((id) => {
		const newDiv = document.createElement("div");
		newDiv.id = id;
		return newDiv;
	});

export const toStringPadZerosToStart = (n: number): string =>
	(n || 0).toString().padStart(2, "0");
export const formatDuration = (time: number): string => {
	const seconds = Math.floor(time % 60);
	const minutes = Math.floor(time / 60) % 60;

	return `${toStringPadZerosToStart(minutes)}:${toStringPadZerosToStart(seconds)}`;
};
