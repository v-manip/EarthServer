//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: WCPS Image with DEM from WCS Query
 * 2 URLs for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_WCPSDemWCS = function()
{
    this.setDefaults();
    this.name = "WCPS Image with DEM from WCS Query.";
    /**
     * WCS version for the query.
     * @default "2.0.0"
     * @type {String}
     */
    this.WCSVersion = "2.0.0";
};
EarthServerGenericClient.Model_WCPSDemWCS.inheritsFrom( EarthServerGenericClient.AbstractSceneModel );
/**
 * Sets the url for both the WCPS and WCS Queries.
 * @param wcpsurl - Service URL for the WCPS Request
 * @param demurl  - Service URL for the WCS Request
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.setURLs=function(wcpsurl, demurl){
    /**
     * URL for the WCPS service.
     * @type {String}
     */
    this.URLWCPS = String(wcpsurl);
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
EarthServerGenericClient.Model_WCPSDemWCS.prototype.setCoverages = function (coverageImage, coverageDem) {
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
 * Sets a complete custom querystring.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.setWCPSQuery = function(querystring)
{
    /**
     * The custom query.
     * @type {String}
     */
    this.customQuery = String(querystring);
};

/**
 * Sets the WCS Version for the WCS Query String. Default: "2.0.0"
 * @param version - String with WCS version number.
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.setWCSVersion = function(version)
{
    this.WCSVersion = String(version);
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param index - Index of this model in the SceneManager list.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.createModel=function(root, index, cubeSizeX, cubeSizeY, cubeSizeZ){
    if( root === undefined)
        alert("root is not defined");

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;
    this.index = index;

    //1: Check if mandatory values are set
    if( this.coverageImage === undefined || this.coverageDEM === undefined || this.URLWCPS === undefined || this.URLDEM === undefined
        || this.minx === undefined || this.miny === undefined || this.maxx === undefined || this.maxy === undefined )
    {
        alert("Not all mandatory values are set. WCPSDemWCS: " + this.name );
        console.log(this);
        return;
    }

    //2: create wcps query
    //Either user set if query strings are set for all wcps channels or standard wcps query if wcps channels are not set
    //IF something is not defined use standard query.
    if( this.customQuery === undefined)
    {
        this.wcpsQuery =  "for i in (" + this.coverageImage + "), dtm in (" + this.coverageDEM + ") return encode ( { ";
        this.wcpsQuery += "red: scale(trim(i.red, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + this.XResolution + '), y:"CRS:1"(0:' + this.ZResolution + ")}, {}); ";
        this.wcpsQuery += "green: scale(trim(i.green, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + this.XResolution + '), y:"CRS:1"(0:' + this.ZResolution + ")}, {}); ";
        this.wcpsQuery += "blue: scale(trim(i.blue, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + this.XResolution + '), y:"CRS:1"(0:' + this.ZResolution + ")}, {})";
        this.wcpsQuery += '}, "' + this.imageFormat +'" )';
    }
    else //ALL set so use custom query
    {
        //Replace $ symbols with the actual values
        this.customQuery = this.customQuery.replace("$CI",this.coverageImage);
        this.customQuery = this.customQuery.replace("$MINX",this.minx);
        this.customQuery = this.customQuery.replace("$MINY",this.miny);
        this.customQuery = this.customQuery.replace("$MAXX",this.maxx);
        this.customQuery = this.customQuery.replace("$MAXY",this.maxy);
        this.customQuery = this.customQuery.replace("$RESX",this.XResolution);
        this.customQuery = this.customQuery.replace("$RESZ",this.ZResolution);

        this.wcpsQuery = this.customQuery;
    }

    //3: Make ServerRequest and receive data.
    var bb = {
        minLongitude: this.miny,
        maxLongitude: this.maxy,
        minLatitude:  this.minx,
        maxLatitude:  this.maxx
    };
    EarthServerGenericClient.requestWCPSDemWCS(this,this.URLWCPS,this.wcpsQuery,this.URLDEM,this.coverageDEM,bb,this.WCSVersion);
};

/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.receiveData= function( data)
{
    console.timeEnd(this.name+"_request");

    if( data === null)
    { console.log("Model_WCPSDemWCS: Request not successful.");}
    else
    {
        var YResolution = (parseFloat(data.maxMSAT) - parseFloat(data.minMSAT) );
        var transform = this.createTransform(this.cubeSizeX,this.cubeSizeY,this.cubeSizeZ,data.width,YResolution,data.height,parseFloat(data.minMSAT));
        this.root.appendChild( transform);

        //Set transparency
        data.transparency = this.transparency;
        //Create Terrain out of the received data
        this.terrain = new EarthServerGenericClient.LODTerrain(transform, data, this.index);
        this.terrain.createTerrain();
    }
};

/**
 * Updates the transparency of the scene model. Values between 0-1 (Fully Opaque - Fully Transparent).
 * @param transparency
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.updateTransparency = function( transparency ){
    this.terrain.setTransparency(transparency);
};

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 * @param modelNumber - Number of this model in the SceneManager.
 */
EarthServerGenericClient.Model_WCPSDemWCS.prototype.setSpecificElement= function(element,modelNumber)
{
    EarthServerGenericClient.appendElevationSlider(element,modelNumber);
};