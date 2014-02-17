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

	this.mimeTypeHandlers = {};
}

RBV.Provider.OGCProvider.prototype.toString = function() {
	return '[' + this.protocol + '] id: ' + this.id;
};

/**
 * Registers a handler for a specific format for preprocessing data received
 * by a data request. An eventual registered handler with the same mimetype
 * will be overwritten.
 *
 * @param mimetype - MIME type name (i.e. 'image/x-aaigrid')
 * @returns {boolean} - TRUE if a handler for the given format was already registered,
 * FALSE if not
 */
RBV.Provider.OGCProvider.prototype.registerMimeTypeHandler = function(mimetype, handler) {
	var wasRegistered = false;
	if (this.mimeTypeHandlers[mimetype]) {
		wasRegistered = true;
	}
	this.mimeTypeHandlers[mimetype] = handler;

	return wasRegistered;
};

RBV.Provider.OGCProvider.prototype.getMimeTypeHandlers = function() {
	return this.mimeTypeHandlers;
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