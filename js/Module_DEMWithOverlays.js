//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_DEMWithOverlays = function() {
    this.name = "DEM with overlay(s)";
    this.demProvider = null;
    this.imageryProvider = [];
};
EarthServerGenericClient.Model_DEMWithOverlays.inheritsFrom(EarthServerGenericClient.AbstractSceneModel);

/**
 * Sets the DEM provider.
 * @param provider - Configured Provider object
 * @see Provider
 */
EarthServerGenericClient.Model_DEMWithOverlays.prototype.setDEMProvider = function(provider) {
    this.demProvider = provider;
};

/**
 * Adds an imagery provider.
 * @param provider - Configured Provider object
 * @see Provider
 */
EarthServerGenericClient.Model_DEMWithOverlays.prototype.addImageryProvider = function(provider) {
    this.imageryProvider.push(provider);
};

/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
EarthServerGenericClient.Model_DEMWithOverlays.prototype.setTimespan = function(timespan) {
    this.timespan = timespan;
};

/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
EarthServerGenericClient.Model_DEMWithOverlays.prototype.setBoundingBox = function(minx, miny, maxx, maxy) {
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
EarthServerGenericClient.Model_DEMWithOverlays.prototype.createModel = function(root, cubeSizeX, cubeSizeY, cubeSizeZ) {
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
        dem: this.demProvider,
        imagery: this.imageryProvider,
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
EarthServerGenericClient.Model_DEMWithOverlays.prototype.receiveData = function(dataArray) {
    if (this.checkReceivedData(dataArray)) {
        this.removePlaceHolder();

        console.log('received layers #' + dataArray.length);

        // var data = dataArray;

        var data = null;
        var lastidx = -1;
        for (var idx=0; idx<dataArray.length; ++idx) {
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
        data.transparency = dataArray[idx].transparency;
        data.specularColor = dataArray[idx].specularColor;
        data.diffuseColor = dataArray[idx].diffuseColor;

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
EarthServerGenericClient.Model_DEMWithOverlays.prototype.checkReceivedData = function(dataArray) {
    return true;
}

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 */
EarthServerGenericClient.Model_DEMWithOverlays.prototype.setSpecificElement = function(element) {
    EarthServerGenericClient.appendElevationSlider(element, this.index);
};