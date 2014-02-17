RBV.Provider = RBV.Provider || {};

/**
 * @class OGCProvider: An abstract object managing a request to a OGC service provider.
 */
RBV.Provider.OGCProvider = function(opts) {}

RBV.Provider.OGCProvider.prototype.init = function(opts) {
	// FIXXME: error handling!
	this.protocol = opts.protocol;
	this.id = opts.id;
	this.urls = opts.urls;
	this.style = opts.style || 'default';
	this.crs = opts.crs;
	this.format = opts.format;
	this.version = opts.version;
}

RBV.Provider.OGCProvider.prototype.toString = function() {
	return '[' + this.protocol + '] id: ' + this.id;
};

/**
 * @class WMS: A WMS provider.
 */
RBV.Provider.WMS = function(opts) {
	opts.protocol = 'WMS';
	opts.version = opts.version || '1.0.0';
	RBV.Provider.OGCProvider.prototype.init.call(this, opts);
}
RBV.Provider.WMS.inheritsFrom(RBV.Provider.OGCProvider)

/**
 * @class WCS: A WCS provider.
 */
RBV.Provider.WCS = function(opts) {
	opts.protocol = 'WCS';
	opts.version = opts.version || '2.0.0';
	RBV.Provider.OGCProvider.prototype.init.call(this, opts);

	this.outputCRS = opts.outputCRS;
	this.datatype = opts.datatype;
}
RBV.Provider.WCS.inheritsFrom(RBV.Provider.OGCProvider)