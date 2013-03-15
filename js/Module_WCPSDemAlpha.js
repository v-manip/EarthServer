//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Scene Model: WCPS Image with DEM in Alpha Channel
 * 1 URL for the service, 2 Coverage names for the image and dem.
 * @augments EarthServerGenericClient.AbstractSceneModel
 */
EarthServerGenericClient.Model_WCPSDemAlpha = function()
{
    this.setDefaults();
    this.name = "WCPS Image with DEM in alpha channel.";
    /**
     * Determines if progressive or complete loading of the model is used.
     * @default false
     * @type {bool}
     */
    this.progressiveLoading = false;
    /**
     * The custom WCPS query for the rgba channels.
     * @type {Array}
     */
    this.WCPSString = [];
    /**
     * The custom or default WCPS Queries. The array contains either one element for complete loading
     * or multiple (3) queries for progressive loading of the model.
     * @type {Array}
     */
    this.wcpsQuery  = [];
};
EarthServerGenericClient.Model_WCPSDemAlpha.inheritsFrom( EarthServerGenericClient.AbstractSceneModel );
/**
 * Enables/Disables the progressive loading of the model.
 * @param value - True or False
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setProgressiveLoading=function(value){
    this.progressiveLoading = value;
};
/**
 * Sets the URL for the service.
 * @param url
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setURL=function(url){
    /**
     * URL for the WCPS service.
     * @type {String}
     */
    this.url = String(url);
};
/**
 * Sets both coverage names.
 * @param coverageImage - Coverage name for the image dataset.
 * @param coverageDem   - Coverage name for the dem dataset.
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setCoverages = function (coverageImage, coverageDem) {
    /**
     * Name of the image coverage.
     * @type {String}
     */
    this.coverageImage = String(coverageImage);
    /**
     * name of the dem coverage.
     * @type {String}
     */
    this.coverageDEM = String(coverageDem);
};
/**
 * Sets a specific querystring for the RED channel of the WCPS query.
 * All red,blue,green and alpha has to be set, otherwise the standard query will be used.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setWCPSForChannelRED = function(querystring)
{
    this.WCPSString[0] = querystring;
};
/**
 * Sets a specific querystring for the GREEN channel of the WCPS query.
 * All red,blue,green and alpha has to be set, otherwise the standard query will be used.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setWCPSForChannelGREEN = function(querystring)
{
    this.WCPSString[1] = querystring;
};
/**
 * Sets a specific querystring for the BLUE channel of the WCPS query.
 * All red,blue,green and alpha has to be set, otherwise the standard query will be used.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setWCPSForChannelBLUE = function(querystring)
{
    this.WCPSString[2] = querystring;
};
/**
 * Sets a specific querystring for the ALPHA channel of the WCPS query.
 * All red,blue,green and alpha has to be set, otherwise the standard query will be used.
 * @param querystring - the querystring. Use $CI (coverageImage), $CD (coverageDEM),
 * $MINX,$MINY,$MAXX,$MAXY(AoI) and $RESX,ResZ (Resolution) for automatic replacement.
 * Examples: $CI.red , x($MINX:$MINY)
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setWCPSForChannelALPHA = function(querystring)
{
    this.WCPSString[3] = querystring;
};

/**
 * Creates the x3d geometry and appends it to the given root node. This is done automatically by the SceneManager.
 * @param root - X3D node to append the model.
 * @param index - Index of this model in the SceneManager list.
 * @param cubeSizeX - Size of the fishtank/cube on the x-axis.
 * @param cubeSizeY - Size of the fishtank/cube on the y-axis.
 * @param cubeSizeZ - Size of the fishtank/cube on the z-axis.
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.createModel=function(root, index, cubeSizeX, cubeSizeY, cubeSizeZ){
    if( root === undefined)
        alert("root is not defined");

    this.cubeSizeX = cubeSizeX;
    this.cubeSizeY = cubeSizeY;
    this.cubeSizeZ = cubeSizeZ;

    this.root = root;
    this.index = index;

    //1: Check if mandatory values are set
    if( this.coverageImage === undefined || this.coverageDEM === undefined || this.url === undefined
        || this.minx === undefined || this.miny === undefined || this.maxx === undefined || this.maxy === undefined )
    {
        alert("Not all mandatory values are set. WCPSDemAlpha: " + this.name );
        alert(this.coverageImage + this.coverageDEM + this.url + this.minx === undefined + this.miny+ this.maxx + this.maxy );
        console.log(this);
        return;
    }

    //2: create wcps query/queries
    //Either user set if query strings are set for all wcps channels or standard wcps query if wcps channels are not set
    //Build one query for complete loading and multiple queries for progressive loading
    var queryCnt = 1;
    if( this.progressiveLoading){ queryCnt = 3; }
    //IF something is not defined use standard query.
    if( this.WCPSString[0] === undefined || this.WCPSString[1] === undefined || this.WCPSString[2] === undefined || this.WCPSString[3] === undefined)
    {
        for(var i=0; i<queryCnt; i++)
        {
            var currentXRes = parseInt(this.XResolution / Math.pow(2,i) );
            var currentZRes = parseInt(this.ZResolution / Math.pow(2,i) );
            this.wcpsQuery[i] =  "for i in (" + this.coverageImage + "), dtm in (" + this.coverageDEM + ") return encode ( { ";
            this.wcpsQuery[i] += "red: scale(trim(i.red, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + currentXRes + '), y:"CRS:1"(0:' + currentZRes + ")}, {}); ";
            this.wcpsQuery[i] += "green: scale(trim(i.green, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + currentXRes + '), y:"CRS:1"(0:' + currentZRes + ")}, {}); ";
            this.wcpsQuery[i] += "blue: scale(trim(i.blue, {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + currentXRes + '), y:"CRS:1"(0:' + currentZRes + ")}, {});";
            this.wcpsQuery[i] += "alpha: (char) (((scale(trim(dtm , {x(" + this.minx + ":" +  this.maxx + "), y(" + this.miny + ":" + this.maxy + ') }), {x:"CRS:1"(0:' + currentXRes + '), y:"CRS:1"(0:' + currentZRes + ")}, {})) / 1349) * 255)";
            this.wcpsQuery[i] += '}, "' + this.imageFormat +'" )';
        }
    }
    else //ALL set so use custom query
    {
        for(var j=0; j<queryCnt; j++)
        {
            //Replace $ symbols with the actual values
            var tmpString = [];
            for(i=0; i<4; i++)
            {
                tmpString[i] = this.WCPSString[i].replace("$CI","image");
                tmpString[i] = this.WCPSString[i].replace("$CD","dtm");
                tmpString[i] = this.WCPSString[i].replace("$MINX",this.minx);
                tmpString[i] = this.WCPSString[i].replace("$MINY",this.miny);
                tmpString[i] = this.WCPSString[i].replace("$MAXX",this.maxx);
                tmpString[i] = this.WCPSString[i].replace("$MAXY",this.maxy);
                tmpString[i] = this.WCPSString[i].replace("$RESX",parseInt(this.XResolution / Math.pow(2,i) ) );
                tmpString[i] = this.WCPSString[i].replace("$RESZ",parseInt(this.ZResolution / Math.pow(2,i) ) );
            }
            this.wcpsQuery[j] =  "for image in (" + this.coverageImage + "), dtm in (" + this.coverageDEM + ") return encode ( { ";
            this.wcpsQuery[j] += "red: " + tmpString[0] + " ";
            this.wcpsQuery[j] += "green: " + tmpString[1]+ " ";
            this.wcpsQuery[j] += "blue: " + tmpString[2] + " ";
            this.wcpsQuery[j] += "alpha: " + tmpString[3];
            this.wcpsQuery[j] += '}, "' + this.imageFormat +'" )';
        }
    }

    //3: Make ServerRequest and receive data.
    if( !this.progressiveLoading)
    {   EarthServerGenericClient.requestWCPSDemAlpha(this,this.url,this.wcpsQuery[0]);  }
    else
    {   EarthServerGenericClient.progressiveWCPSLoader(this,this.url,this.wcpsQuery);   }
};
/**
 * This is a callback method as soon as the ServerRequest in createModel() has received it's data.
 * This is done automatically.
 * @param data - Received data from the ServerRequest.
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.receiveData = function( data)
{
    console.timeEnd(this.name+"_request");
    if( data === null)
    { console.log("WCPSDemAlpha "+ this.name +": Request not successful.");}
    else
    {
        //If progressive loading is enabled this function is called multiple times.
        //The lower resolution version shall be removed and replaced with the new one.
        //So the old transformNode will be removed and a new one created.
        if(this.transformNode !== undefined )
        {   this.root.removeChild(this.transformNode); }

        var YResolution = (parseFloat(data.maxMSAT) - parseFloat(data.minMSAT) );
        this.transformNode = this.createTransform(this.cubeSizeX,this.cubeSizeY,this.cubeSizeZ,data.width,YResolution,data.height,parseFloat(data.minMSAT));
        this.root.appendChild(this.transformNode);

        //Set transparency
        data.transparency =  this.transparency;

        //Create Terrain out of the received data
        if( !this.progressiveLoading)
        {
            this.terrain = new EarthServerGenericClient.LODTerrain(this.transformNode, data, this.index);
            this.terrain.createTerrain();
        }
        else
        {
            //Check if terrain is already created. Create it in the first function call.
            if( this.terrain === undefined )
            {   this.terrain = new EarthServerGenericClient.ProgressiveTerrain(this.index); }

            //Add new data (with higher resolution) to the terrain
            this.terrain.insertLevel(this.transformNode,data);
        }
    }
};

/**
 * Updates the transparency of the scene model. Values between 0-1 (Fully Opaque - Fully Transparent).
 * @param transparency
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.updateTransparency = function( transparency ){
    this.terrain.setTransparency(transparency);
};

/**
 * Every Scene Model creates it's own specific UI elements. This function is called automatically by the SceneManager.
 * @param element - The element where to append the specific UI elements for this model.
 * @param modelNumber - Number of this model in the SceneManager.
 */
EarthServerGenericClient.Model_WCPSDemAlpha.prototype.setSpecificElement= function(element,modelNumber)
{
    EarthServerGenericClient.appendElevationSlider(element,modelNumber);
};