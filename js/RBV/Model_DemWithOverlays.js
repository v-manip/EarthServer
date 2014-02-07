var RBV = RBV || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
RBV.Model_DemWithOverlays = function() {
    this.setDefaults();
    this.name = "DEM with overlay(s)";

    this.terrain = null;
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

    var bbox = {
        minLongitude: this.miny,
        maxLongitude: this.maxy,
        minLatitude:  this.minx,
        maxLatitude:  this.maxx
    };

    this.root = root;

    this.createPlaceHolder();

    EarthServerGenericClient.getDEMWithOverlays(this, {
        dem: this.demRequest,
        imagery: this.imageryRequest,
        bbox: bbox,
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

        var YResolution = this.YResolution || (parseFloat(data.maxHMvalue) - parseFloat(data.minHMvalue));
        var transform = this.createTransform(data.width, YResolution, data.height, parseFloat(data.minHMvalue), data.minXvalue, data.minZvalue);
        this.root.appendChild(transform);

        EarthServerGenericClient.MainScene.timeLogStart("Create Terrain " + this.name);


        // this.terrain = new EarthServerGenericClient.VolumeTerrain(transform, dataArray, this.index, this.noData, this.demNoData);
        this.terrain = new EarthServerGenericClient.LODTerrain(transform, data, this.index, this.noData, this.demNoData);
        this.terrain.createTerrain();

        EarthServerGenericClient.MainScene.timeLogEnd("Create Terrain " + this.name);

        //this.elevationUpdateBinding();

        // if (this.sidePanels) {
        //     this.terrain.createSidePanels(this.transformNode, 1);
        // }
        EarthServerGenericClient.MainScene.timeLogEnd("Create Model " + this.name);

        transform = null;
    }
};

/**
 * Validates the received data from the server request.
 */
RBV.Model_DemWithOverlays.prototype.checkReceivedData = function(dataArray) {
    for (var idx = 0; idx < dataArray.length; ++idx) {
        var data = dataArray[idx];
        this.receivedDataCount++;
        this.reportProgress();

        // No texture whished?
        if (this.colorOnly && data !== null && data !== undefined) {
            data.validateTexture = false; // disable check for texture
            data.texture = undefined;
        }

        // if (data === null || !data.validate()) {
        //     alert(this.name + ": Request not successful.");
        //     console.log(data);
        //     this.reportProgress(); //NO Terrain will be built so report the progress here
        //     this.removePlaceHolder(); //Remove the placeHolder.

        //     //delete UI elements
        //     var header = document.getElementById("EarthServerGenericClient_ModelHeader_" + this.index);
        //     var div = document.getElementById("EarthServerGenericClient_ModelDiv_" + this.index);

        //     if (header && div) {
        //         var parent = div.parentNode;

        //         if (parent) {
        //             parent.removeChild(div);
        //             parent.removeChild(header);
        //         }
        //     }
        //     return false;
        // }

        // add module specific values
        data.transparency = this.transparency;
        data.specularColor = this.specularColor || EarthServerGenericClient.MainScene.getDefaultSpecularColor();
        data.diffuseColor = this.diffuseColor || EarthServerGenericClient.MainScene.getDefaultDiffuseColor();
    }

    return true;
};

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 */
RBV.Model_DemWithOverlays.prototype.setSpecificElement = function(element) {
    EarthServerGenericClient.appendElevationSlider(element, this.index);
};