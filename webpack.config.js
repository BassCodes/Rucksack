const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const config = {
	entry: "./src/index.ts",
	cache: false,
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					mangle: {
						properties: true,
					},
					compress: {
						// inline: false,
						evaluate: false,
					},
					ecma: 6,
				},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				loader: require.resolve("./lightCssLoader"),
			},
		],
	},
	resolve: {
		extensions: [".ts"],
	},
	output: {
		filename: "rucksack.js",
		path: path.resolve(__dirname, "dist"),
	},
};
module.exports = (env, argv) => {
	if (argv.mode === "development") {
		config.devtool = "source-map";
		config.optimization.minimize = false;
		config.optimization.minimizer = [];
	}

	// if (argv.mode === "production") {
	// }

	return config;
};
