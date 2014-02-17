var RBV = RBV || {};

/**
 * @class Viewer: The 'Viewer' object is a 'wrapper' around a RBV.Runtime that provides a
 * predefined set of EarthServerClient models, which can be selected via the
 * Viewer's API.
 *
 * Application which need direct control over runtimes can directly use
 * the RBV.Runtime objects and manage them to their liking.
 */
RBV.Viewer = function(opts) {
	this.runtime = new RBV.Runtime({});

	// There is one context for all Models at the moment, for simplicity:
	this.context = null;
};

RBV.Viewer.prototype.addModel = function(id, opts) {
	// body...
};

RBV.Viewer.prototype.showModel = function(id, opts) {
	// body...
};

RBV.Viewer.prototype.setContext = function(context) {
	// body...
};
