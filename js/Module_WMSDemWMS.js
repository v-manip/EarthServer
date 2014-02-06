//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: WMS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_WMSDemWMS = function()
{
    this.setDefaults();
    this.name = "WMS Image with DEM from WMS Query.";
    /**
     * WMS version for the query.
     * @default "1.3"
     * @type {String}
     */
    this.WMSVersion = "1.3";
};
EarthServerGenericClient.Model_WMSDemWMS.inheritsFrom( EarthServerGenericClient.AbstractSceneModel );
/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setBoundingBox = function(minx, miny, maxx, maxy) {
    this.bbox = {
        minLongitude: miny,
        maxLongitude: maxy,
        minLatitude: minx,
        maxLatitude: maxx
    };
};
/**
 * Sets the url for both the WMS and WCS Queries.
 * @param WMSurl - Service URL for the WMS Request
 * @param demurl  - Service URL for the WCS Request
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setURLs=function(WMSurl, demurl){
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
 * Sets both coverage names
 * @param coverageImage - Coverage name for the image data set.
 * @param coverageDem   - Coverage name for the dem data set.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setCoverages = function (coverageImage, coverageDem) {
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
 * Sets the WMS Version for the WMS Query String. Default: "1.3"
 * @param version - String with WMS version number.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setWCSVersion = function(version)
{
    this.WCSVersion = String(version);
};
/**
 * Sets the WMS Version for the WMS Query String. Default: "1.3"
 * @param version - String with WMS version number.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setWMSVersion = function(version)
{
    this.WMSVersion = String(version);
};
/**
 * Sets the data type for the ajax call executing the WCS query.
 * @param type - Datatype for the ajax call (default: 'XML')
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setWCSDataType =function(type){
    this.WCSDataType = String(type);
};
/**
 * Sets the desired MIME type for the response of the WCS Queries.
 * @param type - MIME string for the WCS Response (i.e.: 'image/x-aaigrid')
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setWCSMimeType =function(type){
    this.WCSMimeType = String(type);
};
/**
 * Sets the Coordinate Reference System.
 * @param System - eg. CRS,SRS
 * @param value - eg. EPSG:4326
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setCoordinateReferenceSystem = function(System, value)
{
    this.CRS = System + "=" + value;
};
/**
 * Sets the output CRS.
 @param outputCRS - The output CRS, e.g. 'http://www.opengis.net/def/crs/EPSG/0/4326'
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setOutputCRS = function(value)
{
    this.WCSOutputCRS = value;
};
/**
 * Sets the timespan for the request
 * @param timespan - eg. '2013-06-05T00:00:00Z/2013-06-08T00:00:00Z'
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setTimespan = function(timespan)
{
    this.timespan = timespan;
};
/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.createModel=function(root, cubeSizeX, cubeSizeY, cubeSizeZ){
    if( root === undefined) {
        console.log("root is not defined");
    }

    EarthServerGenericClient.MainScene.timeLogStart("Create Model " + this.name);

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;

    // FIXXME: this is not the right place for eventually setting the default value:
    if (!this.WCSMimeType) {
        this.WCSMimeType = 'image/x-aaigrid';
    }

    //Create Placeholder
    this.createPlaceHolder();

    //1: Check if mandatory values are set
    if( this.coverageImage === undefined || this.coverageDEM === undefined || this.URLWMS === undefined || this.URLDEM === undefined
        || this.minx === undefined || this.miny === undefined || this.maxx === undefined || this.maxy === undefined || this.CRS === undefined)
    {
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
                                                this.URLDEM,this.coverageDEM,this.WCSVersion,this.WCSMimeType,this.WCSDataType, 
                                                this.WCSOutputFormat,this.WCSOutputCRS,this.timespan);
};

/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.receiveData= function( data)
{
    if( this.checkReceivedData(data))
    {
        //Remove the placeHolder
        this.removePlaceHolder();

        var YResolution = this.YResolution || (parseFloat(data.maxHMvalue) - parseFloat(data.minHMvalue) );
        var transform = this.createTransform(data.width,YResolution,data.height,parseFloat(data.minHMvalue),data.minXvalue,data.minZvalue);
        this.root.appendChild( transform);

        //Create Terrain out of the received data
        EarthServerGenericClient.MainScene.timeLogStart("Create Terrain " + this.name);
        this.terrain = new EarthServerGenericClient.LODTerrain(transform, data, this.index, this.noData, this.demNoData);
        this.terrain.createTerrain();
        EarthServerGenericClient.MainScene.timeLogEnd("Create Terrain " + this.name);
        this.elevationUpdateBinding();
        if(this.sidePanels)
        {   this.terrain.createSidePanels(this.transformNode,1);    }
        EarthServerGenericClient.MainScene.timeLogEnd("Create Model " + this.name);

        transform = null;
    }
};


/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 */
EarthServerGenericClient.Model_WMSDemWMS.prototype.setSpecificElement= function(element)
{
    EarthServerGenericClient.appendElevationSlider(element,this.index);
};