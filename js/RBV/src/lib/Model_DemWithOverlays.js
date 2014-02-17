RBV.Models = RBV.Models || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
RBV.Models.DemWithOverlays = function() {
    this.setDefaults();
    this.name = "DEM with overlay(s)";

    this.terrain = null;
    this.demRequest = null;
    this.imageryProviders = [];
};
RBV.Models.DemWithOverlays.inheritsFrom(EarthServerGenericClient.AbstractSceneModel);

/**
 * Sets the DEM request.
 * @param request - Configured Request object
 * @see Request
 */
RBV.Models.DemWithOverlays.prototype.setDemProvider = function(provider) {
    this.demRequest = provider;
};

/**
 * Adds an imagery request.
 * @param request - Configured Request object
 * @see Request
 */
RBV.Models.DemWithOverlays.prototype.setImageryProviders = function(providers) {
    for (var idx = 0; idx < providers.length; idx++) {
        this.imageryProviders.push(providers[idx]);
    };
};

/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
RBV.Models.DemWithOverlays.prototype.setTimespan = function(timespan) {
    this.timespan = timespan;
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
RBV.Models.DemWithOverlays.prototype.createModel = function(root, cubeSizeX, cubeSizeY, cubeSizeZ) {
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
        imagery: this.imageryProviders,
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
RBV.Models.DemWithOverlays.prototype.receiveData = function(dataArray) {
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
        this.terrain = new RBV.LODTerrainWithOverlays({
            transform: transform,
            data: data,
            index: this.index,
            noData: this.noData,
            demNoData: this.demNoData,
            root: this.root
        });
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
RBV.Models.DemWithOverlays.prototype.checkReceivedData = function(dataArray) {
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
RBV.Models.DemWithOverlays.prototype.setSpecificElement = function(element) {
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
RBV.Models.DemWithOverlays.prototype.getAppearances = function(AppearanceName, AppearanceCount, modelIndex, canvasTexture, transparency, specular, diffuse, upright) {
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
RBV.Models.DemWithOverlays.prototype.setTransparency = function(value) {
    var transparencyField = document.getElementById(this.transparencyFieldID);

    if (transparencyField)
        transparencyField.setAttribute("value", String(1.0 - value));
    else
        console.log("RBV.Models.DemWithOverlays: Can't find transparency field.")
};