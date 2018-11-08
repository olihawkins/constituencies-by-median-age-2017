/* eslint-env node */
const path = require("path");

module.exports = {
	entry: "./src/vis.js",
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "vis.bundle.js"
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: "babel-loader",
				options: {
					presets: ["@babel/preset-env"],
					plugins: [["@babel/plugin-transform-runtime", {
						helpers: false,
						regenerator: true}]]
				}
			}
		]
	},
	stats: {
		colors: true
	},
	mode: "production",
	// devtool: "source-map",
	watch: true
};
