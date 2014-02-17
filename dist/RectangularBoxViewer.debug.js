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

/**
 * @class Context: Defines data and state for a model. Changes to the visualization
 * of a model are done solely via the context object.
 */
RBV.Context = function(opts) {

};
var RBV = RBV || {};

/**
 * @class This terrain builds up a LOD with 3 levels of the received data.
 * @param root - Dom Element to append the terrain to.
 * @param data - Received Data of the Server request.
 * @param index - Index of the model that uses this terrain.
 * @param noDataValue - Array with the RGB values to be considered as no data available and shall be drawn transparent.
 * @param noDemValue - The single value in the DEM that should be considered as NODATA
 * @augments EarthServerGenericClient.AbstractTerrain
 * @constructor
 */
RBV.LODTerrainWithOverlays = function(opts/*root, data, index, noDataValue, noDemValue*/) {
    this.materialNodes = []; //Stores the IDs of the materials to change the transparency.
    this.data = opts.data;
    this.index = opts.index;
    this.noData = opts.noDataValue;
    this.noDemValue = opts.noDemValue;

    /**
     * Distance to change between full and 1/2 resolution.
     * @type {number}
     */
    var lodRange1 = opts.lodRange1 || 5000;
    /**
     * Distance to change between 1/2 and 1/4 resolution.
     * @type {number}
     */
    var lodRange2 = opts.lodRange1 || 17000;

    /**
     * The canvas that holds the received image.
     * @type {HTMLElement}
     */
    this.canvasTexture = this.createCanvas(data.texture, index, noDataValue, data.removeAlphaChannel);

    /**
     * Size of one chunk. Chunks at the borders can be smaller.
     * We want to build 3 chunks for the LOD with different resolution but the same size on the screen.
     * With 121 values the length of the most detailed chunk is 120.
     * The second chunk has 61 values and the length of 60. With a scale of 2 it's back to the size of 120.
     * The third chunk has 31 values and the length if 30. With a scale of 4 it's also back to the size 120.
     * @type {number}
     */
    var chunkSize = 121;
    /**
     * General information about the number of chunks needed to build the terrain.
     * @type {number}
     */
    var chunkInfo = this.calcNumberOfChunks(data.width, data.height, chunkSize);

    /**
     * Counter for the insertion of chunks.
     * @type {number}
     */
    var currentChunk = 0;

    /**
     * Builds the terrain and appends it into the scene.
     */
    this.createTerrain = function() {
        for (currentChunk = 0; currentChunk < chunkInfo.numChunks; currentChunk++) {
            EarthServerGenericClient.MainScene.enterCallbackForNextFrame(this.index);
        }
        currentChunk = 0;
        //chunkInfo = null;

        EarthServerGenericClient.MainScene.reportProgress(index);
    };

    /**
     * The Scene Manager calls this function after a few frames since the last insertion of a chunk.
     */
    this.nextFrame = function() {
        try {
            //Build all necessary information and values to create a chunk
            var info = this.createChunkInfo(this.index, chunkSize, chunkInfo, currentChunk, data.width, data.height);
            var hm = this.getHeightMap(info);
            var appearance = this.getAppearances("TerrainApp_" + index, 3, index, this.canvasTexture,
                data.transparency, this.data.specularColor, this.data.diffuseColor);

            var transform = document.createElement('Transform');
            transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
            transform.setAttribute("scale", "1.0 1.0 1.0");

            var lodNode = document.createElement('LOD');
            lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
            lodNode.setAttribute("id", 'lod' + info.ID);

            if (this.noData !== undefined || this.noDemValue != undefined) {
                new GapGrid(lodNode, info, hm, appearance, this.noDemValue);
            } else {
                new ElevationGrid(lodNode, info, hm, appearance);
            }

            transform.appendChild(lodNode);
            root.appendChild(transform);

            currentChunk++;
            //Delete vars avoid circular references
            info = null;
            hm = null;
            appearance = null;
            transform = null;
            lodNode = null;
        } catch (error) {
            alert('Terrain::CreateNewChunk(): ' + error);
        }
    };
};
RBV.LODTerrainWithOverlays.inheritsFrom(EarthServerGenericClient.AbstractTerrain);
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
    this.imageryRequests = [];
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
    this.imageryRequests.push(request);
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
        minLatitude: this.minx,
        maxLatitude: this.maxx
    };

    this.root = root;

    this.createPlaceHolder();

    EarthServerGenericClient.getDEMWithOverlays(this, {
        dem: this.demRequest,
        imagery: this.imageryRequests,
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
        this.terrain = new RBV.LODTerrainWithOverlays(transform, data, this.index, this.noData, this.demNoData);
        this.terrain.getAppearances = this.getAppearances;
        this.terrain.setTransparency = this.setTransparency;
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

/**
 * This function handles the creation and usage of the appearances. It can be called for every shape or LOD that should use a canvasTexture.
 * It returns the amount of appearances specified. For every name only one appearance exits, every other uses it.
 * @param AppearanceName - Name of the appearance. If this name is not set in the array, it will be registered.
 *      In the case the name is already set, the existing one will be used.
 * @param AppearanceCount - Number of appearance to be created. E.g. the LODs use a bunch of three appearance nodes.
 * @param modelIndex - Index of the model using this appearance.
 * @param canvasTexture - Canvas element to be used in the appearance as texture.
 * @param transparency - Transparency of the appearance.
 * @param specular - Specular color of the appearance.
 * @param diffuse - Diffuse color of the appearance.
 * @param upright - Flag if the terrain is upright (underground data) and the texture stands upright in the cube.
 * @returns {Array} - Array of appearance nodes. If any error occurs, the function will return null.
 */
RBV.Model_DemWithOverlays.prototype.getAppearances = function(AppearanceName, AppearanceCount, modelIndex, canvasTexture, transparency, specular, diffuse, upright) {
    var appearance = document.createElement('Appearance');

    if (transparency === 0) {
        appearance.setAttribute('sortType', 'opaque');
    } else {
        appearance.setAttribute('sortType', 'transparent');
    }

    var texture = document.createElement('Texture');
    texture.setAttribute('hideChildren', 'true');
    texture.setAttribute("repeatS", 'true');
    texture.setAttribute("repeatT", 'true');
    texture.setAttribute("scale", "false");
    texture.appendChild(canvasTexture);

    var imageTransform = document.createElement('TextureTransform');
    imageTransform.setAttribute("scale", "1,-1");
    if (upright) {
        imageTransform.setAttribute("rotation", "-1.57");
    }

    var material = document.createElement('material');
    material.setAttribute("specularColor", specular);
    material.setAttribute("diffuseColor", diffuse);
    // material.setAttribute("diffuseColor", '0 0 1');
    material.setAttribute('transparency', '0.5');
    // material.setAttribute('transparency', transparency);
    material.setAttribute('ID', AppearanceName + "_mat");
    //Save this material ID to change transparency during runtime
    this.materialNodes.push(AppearanceName + "_mat");

    appearance.appendChild(material);
    appearance.appendChild(imageTransform);
    appearance.appendChild(texture);

    // var myshader = document.getElementById('myshader');
    // // var shader = myshader.cloneNode(false);
    // var shader = $('#myshader').clone().attr('id', AppearanceName + "_mat");
    // appearance.appendChild(shader.get()[0]);
    // console.log('shader: ', shader.get()[0]);

    var transparencyFieldID = AppearanceName + "_mat_transparency";
    var cShader = document.createElement("composedShader");
    var field1 = document.createElement("field");
    field1.setAttribute("name", "diffuseColor");
    field1.setAttribute("type", "SFVec3f");
    field1.setAttribute("value", "1 0 1");
    cShader.appendChild(field1);
    var field2 = document.createElement("field");
    field2.setAttribute("id", transparencyFieldID);
    field2.setAttribute("name", "transparency");
    field2.setAttribute("type", "SFFloat");
    field2.setAttribute("value", "1");
    cShader.appendChild(field2);

    var fadeOut = function() {
        var value = field2.getAttribute('value');
        field2.setAttribute("value", String(value - 0.1));
        setTimeout(fadeOut, 200);
    };
    setTimeout(fadeOut, 5000);

    var vertexCode = "attribute vec3 position; \n";
    vertexCode += "uniform mat4 modelViewProjectionMatrix; \n";
    vertexCode += "void main() { \n";
    vertexCode += "gl_Position = modelViewProjectionMatrix * vec4(position, 1.0); }\n";
    var shaderPartVertex = document.createElement("shaderPart");
    shaderPartVertex.setAttribute("type", "VERTEX");
    shaderPartVertex.innerHTML = vertexCode;
    cShader.appendChild(shaderPartVertex);

    var fragmentCode = "#ifdef GL_ES \n";
    fragmentCode += "precision highp float; \n";
    fragmentCode += "#endif \n";
    fragmentCode += "uniform vec3 diffuseColor; \n";
    fragmentCode += "uniform float transparency; \n";
    fragmentCode += "void main() { \n";
    fragmentCode += "gl_FragColor = vec4(diffuseColor, transparency); } \n";

    var shaderPartFragment = document.createElement("shaderPart");
    shaderPartFragment.setAttribute("type", "FRAGMENT");
    shaderPartFragment.innerHTML = fragmentCode;
    cShader.appendChild(shaderPartFragment);

    appearance.appendChild(cShader);

    return [appearance];
};

/**
 * Overwrites function from base terrain class. Sets the transparency in the shader.
 * @param value - Transparency value between 0 (full visible) and 1 (invisible).
 */
RBV.Model_DemWithOverlays.prototype.setTransparency = function(value) {
    var transparencyField = document.getElementById(this.transparencyFieldID);

    if (transparencyField)
        transparencyField.setAttribute("value", String(1.0 - value));
    else
        console.log("RBV.Model_DemWithOverlays: Can't find transparency field.")
};
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
/**
 * @class Runtime: Manages multiple EarthServerClient-based models. It's main responsibility
 * is to select a model to be shown.
 */
RBV.Runtime = function(opts) {

};