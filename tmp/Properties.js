var Properties = {};

(function () {

	Properties.get = function (key) {
		return PropertiesService.getScriptProperties().getProperty(key);
	}
	Properties.set = function (key, val) {
		PropertiesService.getScriptProperties().setProperty(key, val);
	}

})();
