var RBV = RBV || {};

/**
 * @class Scene: The 'Scene' object is a 'wrapper' around a RBV.Runtime that provides a
 * predefined set of EarthServerClient models, which can be selected via the
 * Scene's API.
 *
 * RBV.Provider objects can be added to the Scene. Depending on the displayed Model one
 * ore more providers are selected to provide the data base for the model.
 *
 * Application which need direct control over runtimes can directly use
 * the RBV.Runtime objects and manage them to their liking.
 */
RBV.Scene = function(opts) {
	// There is one context for all Models at the moment (for simplicity):
	this.context = opts.context || null;

	// FIXXME: those values are model specific, how to handle?
	this.resolution = opts.resolution || [500, 500];
	this.noDemValue = opts.noDemValue || 0;

	this._setupEarthServerGenericClient(opts);
};

// FIXXME: Currently the model needs to know if a Provider has a custom
// mimetype handler attached. This is due to the slightly "clumpsy" way
// the EarthServerGenericClient library is handling data requests.
// Adding a provider or request based abstraction to the EarthServerGenericClient
// would solve the problem, as then the abstraction layer takes care of the
// mimetype handling, not the model itself.
RBV.Scene.prototype.addModel = function(model, providers) {
	for (var idx = 0; idx < providers.length; idx++) {
		var mimeTypeHandlers = providers[idx].getMimeTypeHandlers();
		for (var key in mimeTypeHandlers) {
			if (mimeTypeHandlers.hasOwnProperty(key)) {
				model.registerMIMETypeHandler(key, mimeTypeHandlers[key]);
			}
		}
	};
	EarthServerGenericClient.MainScene.addModel(model);

	this.model = model;
};

RBV.Scene.prototype.show = function(opts) {
	this.model.setAreaOfInterest(this.context.aoi[0], this.context.aoi[1], this.context.aoi[2], this.context.aoi[3], this.context.aoi[4], this.context.aoi[5]);
	this.model.setTimespan(this.context.toi);
	// this.model.setOffset(0, 0.2, 0);
	// this.model.setScale(1, 3, 1);

	// create the viewer: Cube has 60% height compared to width and length
	// EarthServerGenericClient.MainScene.createScene('x3dScene', 'theScene', 1, 0.6, 1);
	// EarthServerGenericClient.MainScene.createScene('x3dScene', 'x3dScene', 1, 0.6, 1);
	// FIXXME: this was the only combination that worked, investigate API!
	EarthServerGenericClient.MainScene.createScene(opts.x3dscene_id, opts.x3dscene_id, 1, 0.8, 1);
	EarthServerGenericClient.MainScene.createAxisLabels("Latitude", "Height", "Longitude");
	var pb = new EarthServerGenericClient.createProgressBar("progressbar");
	EarthServerGenericClient.MainScene.setProgressCallback(pb.updateValue);
	EarthServerGenericClient.MainScene.createUI('x3domUI');
	EarthServerGenericClient.MainScene.createModels();
};

RBV.Scene.prototype.setContext = function(context) {
	this.context = context;
};

/**
 * Registers a handler for a specific format for preprocessing data received
 * by a data request. An eventual registered handler with the same mimetype
 * will be overwritten.
 *
 * @param mimetype - MIME type name (i.e. 'image/x-aaigrid')
 */
RBV.Scene.prototype.registerMIMETypeHandler = function(mimetype, handler) {
	this.mimeTypeHandlers[mimetype, handler];
	// FIXXME: has to be delegated to a Model!
};

RBV.Scene.prototype._setupEarthServerGenericClient = function(opts) {
	EarthServerGenericClient.MainScene.resetScene();
	EarthServerGenericClient.MainScene.setTimeLog(opts.setTimeLog);
	EarthServerGenericClient.MainScene.addLightToScene(opts.addLightToScene);
	EarthServerGenericClient.MainScene.setBackground(opts.background[0], opts.background[1], opts.background[2], opts.background[3]);
};