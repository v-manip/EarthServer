//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: Module for underground data.
 * One service URL, one coverage
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_Sharad = function()
{
    this.setDefaults();
    this.modelIndex = -1; // sharad modules can be bound to other modules. -1: unbound
    this.name = "Sharad Underground";
};
EarthServerGenericClient.Model_Sharad.inheritsFrom( EarthServerGenericClient.AbstractSceneModel );


EarthServerGenericClient.Model_Sharad.prototype.setURL=function(serviceURL)
{
    this.serviceURL = serviceURL;
};


EarthServerGenericClient.Model_Sharad.prototype.setCoverages = function (coverage)
{
    this.coverage = coverage;
};

/**
 * Sets a complete custom querystring.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_Sharad.prototype.setWCPSQuery = function(querystring)
{
    /**
     * The custom query.
     * @type {String}
     */
    this.WCPSQuery = String(querystring);
};

/**
 * Sets the RGB value to be considered as NODATA. All pixels with this RGB value will be drawn transparent.
 * @param red - Value for the red channel.
 * @param green - Value for the green channel.
 * @param blue - Value for the blue channel.
 */
EarthServerGenericClient.Model_Sharad.prototype.setNoDataValue = function(red,green,blue)
{
    this.noData = [];
    this.noData[0] = parseInt(red);
    this.noData[1] = parseInt(green);
    this.noData[2] = parseInt(blue);
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
EarthServerGenericClient.Model_Sharad.prototype.createModel=function(root,cubeSizeX, cubeSizeY, cubeSizeZ){
    if( root === undefined)
    {   alert("root is not defined");    }

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;

    //Create Placeholder
    this.createPlaceHolder();

    //1: Check if mandatory values are set
    if( this.serviceURL === undefined || this.coverage === undefined || this.WCPSQuery === undefined )
    {
        alert("Not all mandatory values are set. Sharad: " + this.name );
        console.log(this);
        return;
    }

    //Replace $ symbols with the actual values
    this.WCPSQuery = this.WCPSQuery.replace("$CI",this.coverage);
    this.WCPSQuery = this.WCPSQuery.replace("$MINX",this.minx);
    this.WCPSQuery = this.WCPSQuery.replace("$MINY",this.miny);
    this.WCPSQuery = this.WCPSQuery.replace("$MAXX",this.maxx);
    this.WCPSQuery = this.WCPSQuery.replace("$MAXY",this.maxy);
    this.WCPSQuery = this.WCPSQuery.replace("$CRS" ,'"' + this.CRS + '"');
    this.WCPSQuery = this.WCPSQuery.replace("$CRS" ,'"' + this.CRS + '"');
    this.WCPSQuery = this.WCPSQuery.replace("$RESX",this.XResolution);
    this.WCPSQuery = this.WCPSQuery.replace("$RESZ",this.ZResolution);

    //2: Make ServerRequest
    EarthServerGenericClient.requestWCPSImage(this,this.serviceURL,this.WCPSQuery);
};

/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
EarthServerGenericClient.Model_Sharad.prototype.receiveData= function( data)
{
    if( this.checkReceivedData(data))
    {
        // Remove the placeHolder
        this.removePlaceHolder();

        var width = Math.pow(2, Math.round(Math.log(data.texture.width)/Math.log(2)));
        var height = Math.pow(2, Math.round(Math.log(data.texture.height)/Math.log(2)));

        if( width > 8192) width = 8192;
        if( height > 8192) height = 8192;

        // This modules creates it's own transformation.
        var trans = document.createElement('Transform');
        trans.setAttribute("id", "EarthServerGenericClient_modelTransform"+this.index);

        this.YResolution = 1000;

        var scaleX = (this.cubeSizeX*this.xScale)/(parseInt(width)-1);
        var scaleY = (this.cubeSizeY*this.yScale)/1000;
        var scaleZ = (this.cubeSizeY*this.yScale)/(parseInt(height)-1);

        trans.setAttribute("scale", "" + scaleX + " " + scaleY + " " + scaleZ);

        //TODO: calc position of both ends in the cube

        var xoff = (this.cubeSizeX * this.xOffset) - (this.cubeSizeX/2.0);
        var yoff = (this.cubeSizeY * this.yOffset) + (height*scaleY) - (this.cubeSizeY/2.0);
        var zoff = (this.cubeSizeZ * this.zOffset) - (this.cubeSizeZ/2.0);
        trans.setAttribute("translation", "" + xoff+ " " + yoff  + " " + zoff);

        //TODO: calc rotation
        // turn upright
        trans.setAttribute("rotation","1 0 0 1.57");
        this.root.appendChild( trans);

        // Set transparency
        data.transparency = this.transparency;

        // Create terrain
        this.terrain = new EarthServerGenericClient.SharadTerrain(trans, data, this.index,this.noData);
        this.terrain.createTerrain();
    }
};

/**
 * Sets the index of the scene model the sharad module is bound to.
 * @param index - Index of the scene model.
 */
EarthServerGenericClient.Model_Sharad.prototype.setBoundModuleIndex = function(index)
{
    if(index === this.index)//prevent to bind this module to itself
    {
        console.log("Module_Sharad: Can't bind module to itself.");
    }
    else
    {
        console.log("Modeule_Sharad: Bound to model: " + index);
        this.modelIndex = index;
    }
};

/**
 * Returns the index of the model sharad module is bound to.
 * @returns {number} - Index of the model or -1 if unbound.
 */
EarthServerGenericClient.Model_Sharad.prototype.getBoundModuleIndex = function()
{
    return this.modelIndex;
};

/**
 * Resets the modelIndex sharad module is bound to back to -1 and marks it as unbound.
 */
EarthServerGenericClient.Model_Sharad.prototype.releaseBinding = function()
{
    this.modelIndex = -1;
};

/**
 * If sharad module is bound to another module the sharad module shall move when the other module is moved.
 * This function shall receive the delta of the positions every time the module is moved.
 * @param axis - Axis of the movement.
 * @param delta - Delta to the last position.
 */
EarthServerGenericClient.Model_Sharad.prototype.movementUpdate = function(axis,delta)
{
   EarthServerGenericClient.MainScene.updateOffsetByDelta(this.index,axis,delta);
};

/**
 * This function notifies sharad module that the bound module's elevation was changed.
 * All annotation will be checked and altered in their position.
 */
EarthServerGenericClient.Model_Sharad.prototype.elevationUpdate = function()
{
    //TODO: implement
};



/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model
 */
EarthServerGenericClient.Model_Sharad.prototype.setSpecificElement= function(element)
{
    // updateLength() is called for elevation because the model is rotated. Scaling it's length
    // scales the size on the y-axis in fact.
    EarthServerGenericClient.appendGenericSlider(element,"EarthServerGenericClient_Slider_E_"+this.index,"Elevation",
                                                this.index,0,100,10,EarthServerGenericClient.MainScene.updateLength);
};
