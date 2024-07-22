"use strict";
// authors  : Alexander Bass
// created  : 2024-5-13
// modified : 2024-5-26

// Build script gluing Rollup, a customer CSS minifier, and terser together into three stages.

// Previously the project was built with webpack, but the resulting JS files had a lot of unnecessary bytes.
// With this build system, the output file size can be minimized.

// This does essentially what a makefile would do, except cross platform

import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { minify_sync } from "terser";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";

const SOURCE_DIRECTORY = "src";
const BUILD_DIRECTORY = "build";

async function main() {
	const arg = process.argv[2];
	if (arg === "dev" || arg === undefined) {
		await compileAndBundle();
		injectCSS();
	} else if (arg === "prod") {
		await compileAndBundle();
		injectCSS();
		minifyJS();
	} else if (arg === "clean") {
		try {
			fs.rmSync(BUILD_DIRECTORY, { recursive: true });
			console.log("Removed build directory.");
		} catch (all) {
			if (all.errno === -2) {
				console.log("Project already cleaned.");
			} else {
				console.log("Error occurred while cleaning: ", all);
			}
		}
	} else {
		console.error(`Unknown flag passed: ${arg}`);
	}
}

const ROLLUP_OPTS = {
	input: "src/index.ts",
	plugins: [typescript()],
	output: {
		file: "build/stage1/bundle.js",
		format: "iife",
		sourcemap: true,
	},
};

// Stage 1
async function compileAndBundle() {
	console.log("| Building stage 1: Compiling Typescript and bundling...");

	const bundle = await rollup(ROLLUP_OPTS);
	await bundle.write(ROLLUP_OPTS.output);

	bundle.close();
	console.log("Stage 1 Done.");
}

// Stage 2
function injectCSS() {
	console.log("| Building stage 2: Minifying and injecting css into bundle...");
	const stylePath = path.resolve(SOURCE_DIRECTORY, "style.css");
	const styleCSS = fs.readFileSync(stylePath).toString();

	const finalCSS = cssMinify(styleCSS);

	console.log(`Minified CSS Size ${finalCSS.length}B`);

	const bundlePath = path.resolve(BUILD_DIRECTORY, "stage1", "bundle.js");
	const bundle = fs.readFileSync(bundlePath).toString();

	const bundleTemplateString = /"TEMPLATE REPLACED IN BUILD"/;
	if (!bundleTemplateString.test(bundle)) {
		throw 'ERROR: CSS template string "TEMPLATE REPLACED IN BUILD" not found in bundle.';
	}

	const bundleWithInjectedCSS = bundle.replace(bundleTemplateString, `\`${finalCSS}\``);

	console.log(`Unminified JS Size ${bundleWithInjectedCSS.length}B`);
	console.log(`Unminified hash: "${sha256_hash_string(bundleWithInjectedCSS)}"`);

	const outputDirPath = path.resolve(BUILD_DIRECTORY, "stage2");
	if (!fs.existsSync(outputDirPath)) {
		fs.mkdirSync(outputDirPath, { recursive: true });
	}
	const outputFilePath = path.join(outputDirPath, "rucksack.js");
	fs.writeFileSync(outputFilePath, bundleWithInjectedCSS);
	fs.copyFileSync(
		path.resolve(BUILD_DIRECTORY, "stage1", "bundle.js.map"),
		path.join(outputDirPath, "bundle.js.map")
	);
	console.log("Stage 2 Done.");
}

function cssMinify(cssString) {
	const noNewlines = cssString.replaceAll(/\n/g, "\\n");
	const noTabs = noNewlines.replaceAll(/\t*/g, "");
	const noUnneededSpacesAndNewlines = noTabs
		.replaceAll("{\\n", "{")
		.replaceAll("\\n}", "}")
		.replaceAll(": ", ":")
		.replaceAll(" {", "{")
		.replaceAll(";}", "}")
		.replaceAll(", ", ",")
		.replaceAll("\\n", "");
	const noComments = noUnneededSpacesAndNewlines.replaceAll(/\/\*.*\*\//g, "");

	return noComments;
}

// Stage 3
function minifyJS() {
	console.log("| Building stage 3: Minifying javascript...");
	// Minify JS

	const inputFilePath = path.resolve(BUILD_DIRECTORY, "stage2", "rucksack.js");

	const terserConfig = {
		mangle: {
			properties: true,
		},
		compress: {
			booleans_as_integers: true,
			ecma: 2020,
			keep_fargs: false,
			pure_new: true,
			toplevel: true,
			unsafe: true,
			unsafe_arrows: true,
			unsafe_comps: true,
			unsafe_math: true,
			unsafe_methods: true,
			unsafe_undefined: true,
		},
	};

	const minifiedJS = minify_sync(
		{
			"bundle_with_css.js": fs.readFileSync(inputFilePath, "utf8"),
		},
		terserConfig
	).code;

	const outputDirPath = path.resolve(BUILD_DIRECTORY, "stage3");
	if (!fs.existsSync(outputDirPath)) {
		fs.mkdirSync(outputDirPath, { recursive: true });
	}
	const outputFilePath = path.resolve(BUILD_DIRECTORY, "stage3", "rucksack.min.js");

	console.log(`Minified JS Size ${minifiedJS.length}B`);
	console.log(`Minified hash: "${sha256_hash_string(minifiedJS)}"`);
	fs.writeFileSync(outputFilePath, minifiedJS);
	console.log("Stage 3 Done.");
}

function sha256_hash_string(str) {
	return crypto.createHash("sha256").update(str).digest("hex");
}

main();
