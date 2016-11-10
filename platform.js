var platform="browser";
(function detectPlatform() {
	try {
		const react_native=require("react-native");
		const OS=react_native.Platform.OS;
		if (OS==='android') {
			platform="react-native-android";
		} else {
			platform="react-native-ios";
		}
	} catch (e) {
		if (typeof process!=="undefined"&&process.versions&&process.versions.node) {
			platform="node";
		}
	}
})();

module.exports=platform;