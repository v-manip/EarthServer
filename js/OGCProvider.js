//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Provider: An abstract object providing data via an OGC protocol.
 */
EarthServerGenericClient.AbstractOGCProvider = function(opts) {}

EarthServerGenericClient.AbstractOGCProvider.prototype.init = function(opts) {
	// FIXXME: error handling!
	this.protocol = opts.protocol;
	this.id = opts.id;
	this.urls = opts.urls;
	this.style = opts.style || 'default';
	this.crs = opts.crs;
	this.format = opts.format;
	this.version = opts.version;
}

EarthServerGenericClient.AbstractOGCProvider.prototype.toString = function() {
	return '[' + this.protocol + '] id: ' + this.id;
};

EarthServerGenericClient.WMSProvider = function(opts) {
	opts.protocol = 'WMS';
	opts.version = opts.version || '1.0.0';
	EarthServerGenericClient.AbstractOGCProvider.prototype.init.call(this, opts);
}
EarthServerGenericClient.WMSProvider.inheritsFrom(EarthServerGenericClient.AbstractOGCProvider)

EarthServerGenericClient.WCSProvider = function(opts) {
	opts.protocol = 'WCS';
	opts.version = opts.version || '2.0.0';
	EarthServerGenericClient.AbstractOGCProvider.prototype.init.call(this, opts);

	this.outputCRS = opts.outputCRS;
	this.datatype = opts.datatype;
}
EarthServerGenericClient.WCSProvider.inheritsFrom(EarthServerGenericClient.AbstractOGCProvider)