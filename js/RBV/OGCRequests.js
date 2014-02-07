RBV.Request = RBV.Request || {};

/**
 * @class Request.OGCBase: An abstract object managing a request to a OGC service provider.
 */
RBV.Request.OGCBase = function(opts) {}

RBV.Request.OGCBase.prototype.init = function(opts) {
	// FIXXME: error handling!
	this.protocol = opts.protocol;
	this.id = opts.id;
	this.urls = opts.urls;
	this.style = opts.style || 'default';
	this.crs = opts.crs;
	this.format = opts.format;
	this.version = opts.version;
}

RBV.Request.OGCBase.prototype.toString = function() {
	return '[' + this.protocol + '] id: ' + this.id;
};

RBV.Request = RBV.Request || {};

RBV.Request.WMS = function(opts) {
	opts.protocol = 'WMS';
	opts.version = opts.version || '1.0.0';
	RBV.Request.OGCBase.prototype.init.call(this, opts);
}
RBV.Request.WMS.inheritsFrom(RBV.Request.OGCBase)

RBV.Request.WCS = function(opts) {
	opts.protocol = 'WCS';
	opts.version = opts.version || '2.0.0';
	RBV.Request.OGCBase.prototype.init.call(this, opts);

	this.outputCRS = opts.outputCRS;
	this.datatype = opts.datatype;
}
RBV.Request.WCS.inheritsFrom(RBV.Request.OGCBase)