//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

EarthServerGenericClient.ServerResponseData = function () {
    this.heightmap = null;          //Heightmap
    this.heightmapUrl = "";         //If available, you can use the link as alternative.
    this.texture = new Image();     //Texture as image object
    this.texture.crossOrigin = '';
    this.textureUrl = "";           //If available, you can use the link as alternative.
    this.width = 0;                 //Hm width
    this.height = 0;                //Hm height
    this.minMSAT = 1000000;
    this.maxMSAT = -1000000;
    this.averageMSAT = 0;

    this.texture.crossOrigin = '';
};

EarthServerGenericClient.ajaxRequest = function(url, type, dataType, data, callback)
{
    $.ajax(
        {
            url: url,
            type: type,
            dataType: dataType,
            data: data,
            success: function(receivedData)
            {
                callback(receivedData);
            },
            error: function(xhr, ajaxOptions, thrownError)
            {
                x3dom.debug.logInfo('\t' + xhr.status +" " + ajaxOptions + " " + thrownError);
            }
        }
    );
};

EarthServerGenericClient.combinedCallBack = function(callback,numberToCombine)
{
    var counter = 0;
    this.name = "Combined Callback: " + callback.name;

    this.receiveData = function(data)
    {
        counter++;
        if( counter ==  numberToCombine)
        {
            EarthServerGenericClient_MainScene.timeLogEnd("Combine: " + callback.name);
            callback.receiveData(data);
        }
    }

};

EarthServerGenericClient.getCoverageWMS = function(callback,responseData,WMSurl,WMScoverID,WMSCRS,WMSImageFormat,BoundingBox,WMSVersion,width,height)
{
    responseData.textureUrl = WMSurl + "?service=WMS&version=" + WMSVersion +"&request=Getmap&layers=" + WMScoverID;
    responseData.textureUrl += "&" + WMSCRS + "&format=image/" + WMSImageFormat;
    responseData.textureUrl += "&bbox=" + BoundingBox.minLatitude + "," + BoundingBox.minLongitude + ","+ BoundingBox.maxLatitude + "," + BoundingBox.maxLongitude;
    responseData.textureUrl += "&width="+width+"&height="+height;

    responseData.texture.onload = function()
    {
        callback.receiveData(responseData);
    };
    responseData.texture.onerror = function()
    {
        x3dom.debug.logInfo("Could not load Image.");
    };
    responseData.texture.src = responseData.textureUrl;

};

EarthServerGenericClient.getCoverageWCPS = function(callback,responseData,url, query, DemInAlpha)
{
    EarthServerGenericClient_MainScene.timeLogStart("WCPS: " + callback.name);
    try
    {

        responseData.texture.onload = function()
        {
            EarthServerGenericClient_MainScene.timeLogEnd("WCPS: " + callback.name);
            if(DemInAlpha)
            {
                responseData.heightmapUrl = responseData.texture.src;

                var canvas = document.createElement('canvas');
                canvas.width = responseData.texture.width;
                canvas.height = responseData.texture.height;
                var context = canvas.getContext('2d');
                context.drawImage(responseData.texture, 0, 0);

                var hm = new Array(canvas.width);
                for(var k=0; k<canvas.width; k++)
                {
                    hm[k] = new Array(canvas.height);
                }

                responseData.width = hm.length;
                responseData.height = hm[0].length;

                var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                var total = 0;
                for(var i=3; i<imageData.data.length; i+=4)
                {
                    var index = i/4;
                    hm[parseInt(index%hm.length)][parseInt(index/hm.length)] = imageData.data[i];

                    if( responseData.minMSAT > imageData.data[i] )
                    { responseData.minMSAT = imageData.data[i]  }
                    if( responseData.maxMSAT < imageData.data[i] )
                    { responseData.maxMSAT = imageData.data[i]  }
                    total = total + parseFloat(imageData.data[i]);

                }
                responseData.averageMSAT = parseFloat(total / imageData.data.length);
                responseData.heightmap = hm;
            }

            x3dom.debug.logInfo("Server request done.");
            context = null;
            canvas = null;
            callback.receiveData(responseData);
        };
        responseData.texture.onerror = function()
        {
            x3dom.debug.logInfo("ServerRequest::wcpsRequest(): Could not load Image from url " + url + "! Aborted!");
            callback.receiveData(null);
        };

        responseData.textureUrl = url + "?query=" + encodeURI(query);
        responseData.texture.src = url + "?query=" + encodeURI(query);
    }
    catch(error)
    {
        x3dom.debug.logInfo('ServerRequest::getCoverageWCPS(): ' + error);
    }
};

EarthServerGenericClient.getCoverageWCS = function(callback,responseData,WCSurl,WCScoverID,WCSBoundingBox,WCSVersion)
{
    var request = 'service=WCS&Request=GetCoverage&version=' + WCSVersion + '&CoverageId=' + WCScoverID;
    request += '&subsetx=x(' + WCSBoundingBox.minLatitude + ',' + WCSBoundingBox.maxLatitude + ')&subsety=y(' + WCSBoundingBox.minLongitude + ',' + WCSBoundingBox.maxLongitude + ')';

    $.ajax(
        {
            url: WCSurl,
            type: 'GET',
            dataType: 'XML',
            data: request,
            success: function(receivedData)
            {
                var Grid = $(receivedData).find('GridEnvelope');
                var low  = $(Grid).find('low').text().split(" ");
                var high = $(Grid).find('high').text().split(" ");

                var sizeX = high[0] - low[0] + 1;
                var sizeY = high[1] - low[1] + 1;

                responseData.height = sizeX;
                responseData.width  = sizeY;

                var hm = new Array(sizeX);
                for(var index=0; index<hm.length; index++)
                {
                    hm[index] = new Array(sizeY);
                }

                var DataBlocks = $(receivedData).find('DataBlock');
                DataBlocks.each(function () {
                    var tuples = $(this).find("tupleList").text().split('},');
                    for (var i = 0; i < tuples.length; i++) {
                        var tmp = tuples[i].substr(1);
                        var valuesList = tmp.split(",");

                        for (var k = 0; k < valuesList.length; k++) {
                            tmp = parseFloat(valuesList[k]);

                            hm[parseInt(k/(sizeX))][parseInt(k%(sizeX))] = tmp;

                            if (responseData.maxMSAT < tmp)
                            {
                                responseData.maxMSAT = parseInt(tmp);
                            }
                            if (responseData.minMSAT > tmp)
                            {
                                responseData.minMSAT = parseInt(tmp);
                            }
                        }
                    }
                    if(responseData.minMSAT!=0 && responseData.maxMSAT!=0)
                    {
                        responseData.averageMSAT = (responseData.minMSAT+responseData.maxMSAT)/2;
                    }
                    tuples = null;
                });
                DataBlocks = null;
                responseData.heightmap = hm;
                callback.receiveData(receivedData);
            },
            error: function(xhr, ajaxOptions, thrownError)
            {
                x3dom.debug.logInfo('\t' + xhr.status +" " + ajaxOptions + " " + thrownError);
            }
        }
    );
};


EarthServerGenericClient.requestWCPSDemAlpha = function(callback,WCPSurl,WCPSquery)
{
    var responseData = new EarthServerGenericClient.ServerResponseData();
    EarthServerGenericClient.getCoverageWCPS(callback,responseData,WCPSurl,WCPSquery,true);
};

EarthServerGenericClient.progressiveWCPSLoader = function(callback,WCPSurl,WCPSqueries)
{
    var which = WCPSqueries.length -1;
    //We need one responseData for every query in WCPSqueries
    var responseData = [];
    //For time logging.
    this.name = "Progressive WCPS Loader: " + callback.name;

    for(var i=0;i<WCPSqueries.length;i++)
    {   responseData[i] = new EarthServerGenericClient.ServerResponseData();    }

    this.makeRequest =  function(which)
    {
        if(which >= 0)
        {
            EarthServerGenericClient_MainScene.timeLogStart("Progressive WCPS: " + WCPSurl + "_Query_" +which);
            EarthServerGenericClient.getCoverageWCPS(this,responseData[which],WCPSurl,WCPSqueries[which],true);
        }
    };
    this.receiveData = function(data)
    {
        EarthServerGenericClient_MainScene.timeLogEnd("Progressive WCPS: " + WCPSurl + "_Query_" +which);
        which--;
        this.makeRequest(which);
        callback.receiveData(data);
    };
    this.makeRequest(which);
};

EarthServerGenericClient.requestWCPSDemWCS = function(callback,WCPSurl,WCPSquery,WCSurl,WCScoverID,WCSBoundingBox,WCSVersion)
{
    var responseData = new EarthServerGenericClient.ServerResponseData();
    var combine = new EarthServerGenericClient.combinedCallBack(callback,2);

    EarthServerGenericClient_MainScene.timeLogStart("Combine: " + callback.name);
    EarthServerGenericClient.getCoverageWCPS(combine,responseData,WCPSurl,WCPSquery,false);
    EarthServerGenericClient.getCoverageWCS(combine,responseData,WCSurl,WCScoverID,WCSBoundingBox,WCSVersion);
};

EarthServerGenericClient.requestWMSDemWCS = function(callback,BoundingBox,ResX,ResY,WMSurl,WMScoverID,WMSversion,WMSCRS,WMSImageFormat,WCSurl,WCScoverID,WCSVersion)
{
    var responseData = new EarthServerGenericClient.ServerResponseData();
    var combine = new EarthServerGenericClient.combinedCallBack(callback,2);

    EarthServerGenericClient_MainScene.timeLogStart("Combine: " + callback.name);
    EarthServerGenericClient.getCoverageWMS(combine,responseData,WMSurl,WMScoverID,WMSCRS,WMSImageFormat,BoundingBox,WMSversion,ResX,ResY);
    EarthServerGenericClient.getCoverageWCS(combine,responseData,WCSurl,WCScoverID,BoundingBox,WCSVersion);

};