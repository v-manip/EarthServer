var RBV = RBV || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
RBV.Model_DemWithOverlays = function() {
    this.name = "DEM with overlay(s)";
    this.demRequest = null;
    this.imageryRequest = [];
};
RBV.Model_DemWithOverlays.inheritsFrom(EarthServerGenericClient.AbstractSceneModel);

/**
 * Sets the DEM request.
 * @param request - Configured Request object
 * @see Request
 */
RBV.Model_DemWithOverlays.prototype.setDEMRequest = function(request) {
    this.demRequest = request;
};

/**
 * Adds an imagery request.
 * @param request - Configured Request object
 * @see Request
 */
RBV.Model_DemWithOverlays.prototype.addImageryRequest = function(request) {
    this.imageryRequest.push(request);
};

/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
RBV.Model_DemWithOverlays.prototype.setTimespan = function(timespan) {
    this.timespan = timespan;
};

/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
RBV.Model_DemWithOverlays.prototype.setBoundingBox = function(minx, miny, maxx, maxy) {
    this.bbox = {
        minLongitude: miny,
        maxLongitude: maxy,
        minLatitude: minx,
        maxLatitude: maxx
    };
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
RBV.Model_DemWithOverlays.prototype.createModel = function(root, cubeSizeX, cubeSizeY, cubeSizeZ) {
    if (typeof root === 'undefined') {
        throw Error('[Model_DEMWithOverlays::createModel] root is not defined')
    }

    EarthServerGenericClient.MainScene.timeLogStart("Create Model_DEMWithOverlays " + this.name);

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;

    //Create Placeholder
    this.createPlaceHolder();

    EarthServerGenericClient.getDEMWithOverlays(this, {
        dem: this.demRequest,
        imagery: this.imageryRequest,
        bbox: this.bbox,
        timespan: this.timespan,
        resX: this.XResolution,
        resZ: this.ZResolution
    });
};

/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
RBV.Model_DemWithOverlays.prototype.receiveData = function(dataArray) {
    if (this.checkReceivedData(dataArray)) {
        this.removePlaceHolder();

        console.log('received layers #' + dataArray.length);

        // var data = dataArray;

        var data = null;
        var lastidx = -1;
        for (var idx = 0; idx < dataArray.length; ++idx) {
            if (dataArray[idx].heightmap) {
                data = dataArray[idx];
                lastidx = idx;
                console.log('hm is in #' + idx);

                break;
            }
        }

        var idx = -1;
        (lastidx === 0) ? idx = 1 : idx = 0;
        data.textureUrl = dataArray[idx].textureUrl;
        data.texture = dataArray[idx].texture;

        data.transparency = 1; //this.transparency;
        data.specularColor = EarthServerGenericClient.MainScene.getDefaultSpecularColor();
        data.diffuseColor = EarthServerGenericClient.MainScene.getDefaultDiffuseColor();

        var YResolution = this.YResolution || (parseFloat(data.maxHMvalue) - parseFloat(data.minHMvalue));
        var transform = this.createTransform(data.width, YResolution, data.height, parseFloat(data.minHMvalue), data.minXvalue, data.minZvalue);
        this.root.appendChild(transform);

        EarthServerGenericClient.MainScene.timeLogStart("Create Terrain " + this.name);

        this.terrain = new EarthServerGenericClient.LODTerrain(transform, data, this.index, this.noData, this.demNoData);
        this.terrain.createTerrain();

        //this.terrain = new EarthServerGenericClient.VolumeTerrain(transform, data, this.index, this.noData, this.demNoData);

        EarthServerGenericClient.MainScene.timeLogEnd("Create Terrain " + this.name);

        //this.elevationUpdateBinding();

        // if (this.sidePanels) {
        //     this.terrain.createSidePanels(this.transformNode, 1);
        // }
        EarthServerGenericClient.MainScene.timeLogEnd("Create Model " + this.name);

        transform = null;
    }
};

// FIXXME!
RBV.Model_DemWithOverlays.prototype.checkReceivedData = function(dataArray) {
    // // add module specific values
    // dataArray.transparency = 1; //this.transparency;
    // data.specularColor = this.specularColor || EarthServerGenericClient.MainScene.getDefaultSpecularColor();
    // data.diffuseColor = this.diffuseColor || EarthServerGenericClient.MainScene.getDefaultDiffuseColor();
    return true;
}

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 */
RBV.Model_DemWithOverlays.prototype.setSpecificElement = function(element) {
    EarthServerGenericClient.appendElevationSlider(element, this.index);
};
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