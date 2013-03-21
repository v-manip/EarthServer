//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_WMSDemWCS = function()
{
    this.setDefaults();
    this.name = "WMS Image with DEM from WCS Query.";
    /**
     * WCS version for the query.
     * @default "2.0.0"
     * @type {String}
     */
    this.WCSVersion = "2.0.0";
    /**
     * WMS version for the query.
     * @default "1.3"
     * @type {String}
     */
    this.WMSVersion = "1.3";
};
EarthServerGenericClient.Model_WMSDemWCS.inheritsFrom( EarthServerGenericClient.AbstractSceneModel );
/**
 * Sets the url for both the WMS and WCS Queries.
 * @param WMSurl - Service URL for the WMS Request
 * @param demurl  - Service URL for the WCS Request
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setURLs=function(WMSurl, demurl){
    /**
     * URL for the WMS service.
     * @type {String}
     */
    this.URLWMS = String(WMSurl);
    /**
     * URL for the WCS service.
     * @type {String}
     */
    this.URLDEM  = String(demurl);
};
/**
 * Sets both coveragenames
 * @param coverageImage - Coverage name for the image dataset.
 * @param coverageDem   - Coverage name for the dem dataset.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setCoverages = function (coverageImage, coverageDem) {
    /**
     * Name of the image coverage.
     * @type {String}
     */
    this.coverageImage = String(coverageImage);
    /**
     * Name if the dem coverage.
     * @type {String}
     */
    this.coverageDEM = String(coverageDem);
};
/**
 * Sets the WCS Version for the WCS Query String. Default: "2.0.0"
 * @param version - String with WCS version number.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setWCSVersion = function(version)
{
    this.WCSVersion = String(version);
};
/**
 * Sets the WMS Version for the WMS Query String. Default: "1.3"
 * @param version - String with WMS version number.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setWMSVersion = function(version)
{
    this.WMSVersion = String(version);
};
/**
 * Sets the Coordinate Reference System.
 * @param System - eg. CRS,SRS
 * @param value - eg. EPSG:4326
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setCoordinateReferenceSystem = function(System,value)
{
    this.CRS = System + "=" + value;
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 * @param index - Index of this model in the SceneManager list.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.createModel=function(root, index, cubeSizeX, cubeSizeY, cubeSizeZ){
    if( root === undefined)
        alert("root is not defined");

    EarthServerGenericClient_MainScene.timeLogStart("Create Model " + this.name);

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;
    this.index = index;

    //Create Placeholder
    this.placeHolder = this.createPlaceHolder();
    this.root.appendChild( this.placeHolder );

    //1: Check if mandatory values are set
    if( this.coverageImage === undefined || this.coverageDEM === undefined || this.URLWMS === undefined || this.URLDEM === undefined
        || this.minx === undefined || this.miny === undefined || this.maxx === undefined || this.maxy === undefined || this.CRS === undefined )
    {
        alert("Not all mandatory values are set. WMSDemWCS: " + this.name );
        console.log(this);
        return;
    }

    //2: Make ServerRequest and receive data.
    var bb = {
        minLongitude: this.miny,
        maxLongitude: this.maxy,
        minLatitude:  this.minx,
        maxLatitude:  this.maxx
    };

    EarthServerGenericClient.requestWMSImageWCSDem(this,bb,this.XResolution,this.ZResolution,
                                                this.URLWMS,this.coverageImage,this.WMSVersion,this.CRS,this.imageFormat,
                                                this.URLDEM,this.coverageDEM,this.WCSVersion);
};

/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.receiveData= function( data)
{
    if( data === null)
    { console.log("Model_WMSDemWCS" + this.name +": Request not successful.");}
    else
    {
        //Remove the placeHolder
        if( this.placeHolder !== null && this.placeHolder !== undefined )
        {
            this.root.removeChild( this.placeHolder);
            this.placeHolder = null;
        }

        var YResolution = (parseFloat(data.maxHMvalue) - parseFloat(data.minHMvalue) );
        var transform = this.createTransform(data.width,YResolution,data.height,parseFloat(data.minHMvalue));
        this.root.appendChild( transform);

        //Set transparency
        data.transparency = this.transparency;
        //Create Terrain out of the received data
        EarthServerGenericClient_MainScene.timeLogStart("Create Terrain " + this.name);
        this.terrain = new EarthServerGenericClient.LODTerrain(transform, data, this.index);
        this.terrain.createTerrain();
        EarthServerGenericClient_MainScene.timeLogEnd("Create Terrain " + this.name);
        EarthServerGenericClient_MainScene.timeLogEnd("Create Model " + this.name);
    }
};

/**
 * Updates the transparency of the scene model. Values between 0-1 (Fully Opaque - Fully Transparent).
 * @param transparency
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.updateTransparency = function( transparency ){
    this.terrain.setTransparency(transparency);
};

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 * @param modelNumber - Number of this model in the SceneManager.
 */
EarthServerGenericClient.Model_WMSDemWCS.prototype.setSpecificElement= function(element,modelNumber)
{
    EarthServerGenericClient.appendElevationSlider(element,modelNumber);
};