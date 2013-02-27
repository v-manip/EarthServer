/*======================================================================================================================
     EarthServer Project
     2012 Fraunhofer IGD

     File:           ServerControl.js
     Last change:    29.10.2012

     Description:

======================================================================================================================*/
function ServerRequest(forwardTo)
{
    "use strict";

    var responseData = {
        heightmap:null,             //Heightmap
        heightmapUrl:"",            //If available, you can use the link as alternative.
        texture:new Image(),        //Texture as image object.
        textureUrl:"",              //If available, you can use the link as alternative.
        width:0,                    //Hm width
        height:0,                   //Hm height
        minMSAT: 1000000,
        maxMSAT: -1000000,
        averageMSAT:0
    };
	
	responseData.texture.crossOrigin='';

    var forwardReply = forwardTo;
    var axisLabels = [];
    var gridX = 0;
    var gridY = 0;
    var srsSource = "";
    var maxLongitude = 0.0;
    var minLongitude = 0.0;
    var maxLatitude = 0.0;
    var minLatitude = 0.0;
    var subSetX = [minLongitude, minLatitude];
    var subSetY = [maxLongitude, maxLatitude];
    var epsg = "";
    var epsgType = "";
    var boundLongitude;
    var boundLatitude;

    //==================================================================================================================
    // Sets up several data containers and starts the right request process.
    //==================================================================================================================
    this.request = function(data)
    {
        try
        {
            "use strict";

            if(data.useWcs)
            {
                  subSetX = [data.lowerCorner[1],data.upperCorner[1]];
                  subSetY = [data.lowerCorner[0],data.upperCorner[0]];

                //getCapabilitiesWCS(data.wcsUrl, data.wcsVersion, data.wcsCoverID);    //Supports the server this coverage?
                //describeCoverageWCS(data.wcsUrl, data.wcsVersion, data.wcsCoverID);
                getCoverageWCS(data.wcsUrl, data.wcsVersion, data.wcsCoverID);//,0,0,responseData.width,responseData.height);
            }

            if(data.mode)       //Use WMS for texturing or ...
            {
                getCapabilitiesWMS(data.wmsUrl, data.wmsVersion, data.wmsCoverID);
                describeCoverageWMS(data.wmsUrl, data.wmsVersion, data.wmsCoverID);
                getCoverageWMS(data.wmsUrl, data.wmsVersion, data.wmsCoverID);
            }
            else                //... use WCPS instead.
            {
                getCoverageWCPS(data.wcpsUrl, data.wcpsQuery, data.useWcs);
            }
        }
        catch(error)
        {
            x3dom.debug.logInfo('ServerRequest.request(): ' + error);
        }
    };

    //==================================================================================================================
    // Finally ...
    //==================================================================================================================
    this.destructor = function()
    {
        responseData = null;
    };

    //==================================================================================================================
    //
    //==================================================================================================================
    this.getDownloadUrl = function () {
        return responseData.textureUrl;
    };


    //==================================================================================================================
    // Starts a "describeCoverage" request (WCS service).
    //==================================================================================================================
    var describeCoverageWCS = function(url, version, id)
    {
        ajaxRequest(url, 'GET', 'xml', 'service=WCS&Request=DescribeCoverage&version='+version+'&CoverageId='+id, onDescribeCoverageWCS);
    };

    var onDescribeCoverageWCS = function(content)
    {
        $(content).find('Envelope').each(function()     //Long/Lat Bounds Envelope
        {
            $.each(this.attributes, function(i,attrib)
            {
                if( attrib.name === "srsName" )
                {
                    srsSource = attrib.value.split("/");
                    srsSource = srsSource[ srsSource.length-1];
                }
            });

            //Set min/max longitude/latitude DEFAULT values.
            //Will be overwriten if srsName is found and bounds are retrieved
            var low  = $(this).find('lowerCorner').text().split(" ");
            var high = $(this).find('upperCorner').text().split(" ");
            minLongitude = low[0];
            minLatitude  = low[1];
            maxLongitude = high[0];
            maxLatitude  = high[1];
        });

        //Axis Names
        axisLabels = $(content).find('axisLabels').text().split(" ");
    }

    //==================================================================================================================
    // Sends a request and gets the desired coverage. The coverage data will be converted into a heightmap.
    //==================================================================================================================
    var getCoverageWCS = function(url ,version, id)//, xPos, yPos, sizeX, sizeY)
    {
        var request = 'service=WCS&Request=GetCoverage&version=' + version + '&CoverageId=' + id;
        //request += '&subsetx=x(' + startX + ',' + endX + ')&subsety=y(' + startY + ',' + endY + ')';
        request += '&subsetx=x(' + subSetX[0] + ',' + subSetX[1] + ')&subsety=y(' + subSetY[0] + ',' + subSetY[1] + ')';
        ajaxRequest(url, 'GET', 'xml', request, onGetCoverageWCS);
    }

    var onGetCoverageWCS = function(content)
    {
        var Grid = $(content).find('GridEnvelope');
        var low  = $(Grid).find('low').text().split(" ");
        var high = $(Grid).find('high').text().split(" ");

        var sizeX = high[0] - low[0] + 1;
        var sizeY = high[1] - low[1] + 1;

        responseData.height = sizeX;
        responseData.width = sizeY;

        var hm = new Array(sizeX);
        for(var index=0; index<hm.length; index++)
        {
            hm[index] = new Array(sizeY);
        }

        var DataBlocks = $(content).find('DataBlock');
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
    }

    //==================================================================================================================
    // Starts a "getCapabilities" request (WMS service).
    //==================================================================================================================
    var getCapabilitiesWMS = function(url, version, id)
    {
        ajaxRequest(url, 'GET', 'xml', 'service=wms&version='+version+'&request=getcapabilities', onGetCapabilitiesWMS);
    };

    var onGetCapabilitiesWMS = function(content)
    {
        $(content).find('Layer').each(function(index, element)
        {
            if($(element).children('Name').text().toLowerCase()===id.toLowerCase())
            {
                epsg = $(this).find('CRS').text();
                epsgType = "CRS";

                if(epsg==="" || epsg===undefined)
                {
                    epsg = $(this).find('SRS').text();
                    epsgType = "SRS";
                }

                $(this).find('BoundingBox').each(function()
                {
                    $.each(this.attributes, function(i,attr)
                    {
                        var name = String(attr.name);
                        if( name === "minx" )
                        {
                            minLatitude = parseFloat(attr.value);
                        }
                        else if( name === "maxx" )
                        {
                            maxLatitude = parseFloat(attr.value);
                        }
                        else if( name === "miny" )
                        {
                            minLongitude = parseFloat(attr.value);
                        }
                        else if( name === "maxy" )
                        {
                            maxLongitude = parseFloat(attr.value);
                        }
                        name = null;
                    });
                });
                return true;        //Coverage data was found!
            }
        });
        return false;               //No matches! No results!
    }

    //==================================================================================================================
    // Starts a "describeCoverage" request (WMS service).
    //==================================================================================================================
    var describeCoverageWMS = function(url, version, id)
    {
        ajaxRequest(url, 'GET', 'xml', 'service=WMS&Request=DescribeCoverage&version='+version+'&CoverageId='+id, onDescribeCoverageWMS);
    };

    var onDescribeCoverageWMS = function(content )
    {
        //Long/Lat Bounds Envelope
        var low, high;
        $(content).find('Envelope').each(function()
        {
            $.each(this.attributes, function(i,attr)
            {
                var name = String(attr.name);
                if( name === "srsName" )
                {
                    srsSource = attr.value;
                    srsSource = srsSource.split("/");
                    srsSource = srsSource[srsSource.length-1];
                }
            });
            //Set min/max longitude/latitude DEFAULT values.
            //Will be overwritten if srsName is found and bounds are retrieved
            low  = $(this).find('low').text().split(" ");
            high = $(this).find('high').text().split(" ");
            minLongitude = low[0];
            minLatitude  = low[1];
            maxLongitude = high[0];
            maxLatitude  = high[1];
        });
        //GridBounds
        var envBounds = $(content).find('GridEnvelope');
        envBounds.each(function()
        {
            low  = $(this).find('low').text().split(" ");
            high = $(this).find('high').text().split(" ");
            gridX = high[0];
            gridY = high[1];
        });
        //Axis Names
        axisLabels = $(content).find('axisLabels').text().split(" ");

        setSrsByWCS();
        if(!checkBounds())
        {
            throw "\tQuery Bounds are not available in the coverages!";
        }
    }

    //==================================================================================================================
    // Starts a "describeCoverage" request (WMS service).
    //==================================================================================================================
    var getCoverageWMS = function(url, version, id)
    {
        var boundingBox = subSetX[0] + ',' + subSetY[0] + ',' + subSetX[1] + ',' + subSetY[1];

        responseData.textureUrl = url + "?service=WMS&version=" + version +"&request=Getmap&layers=" + id;
        responseData.textureUrl += "&" + epsgType + "=" + epsg + "&format=image/png&styles=&bbox=" + boundingBox;
        responseData.textureUrl += "&width="+(1*responseData.width)+"&height="+(1*responseData.height);

        responseData.texture.onload = function()
        {
            x3dom.debug.logInfo("Server request done.");
            forwardReply.receiveData(responseData);
        };
        responseData.texture.onerror = function()
        {
            x3dom.debug.logInfo("Could not load Image.");
        }
        responseData.texture.src = responseData.textureUrl;
    };

    //==================================================================================================================
    //
    //==================================================================================================================
    var getCoverageWCPS = function(url, query, mode)
    {
        console.time("WCPS_Image: "+url);

        try
        {
            "use strict";

            responseData.texture.onload = function()
            {
                console.time("WCPS_Image_process: "+url);
                if(!mode)
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
                console.timeEnd("WCPS_Image_process: "+url);
                forwardReply.receiveData(responseData);
            }
            responseData.texture.onerror = function()
            {
                x3dom.debug.logInfo("ServerRequest::wcpsRequest(): Could not load Image from url " + url + "! Aborted!");
                forwardReply.receiveData(null);
            }

            responseData.textureUrl = url + "?query=" + encodeURI(query);
            responseData.texture.src = url + "?query=" + encodeURI(query);
        }
        catch(error)
        {
            x3dom.debug.logInfo('ServerRequest::getCoverageWCPS(): ' + error);
        }

        console.timeEnd("WCPS_Image: "+url);
    };

    //==================================================================================================================
    //Tries to get the EX_GeographicBoundingBox from the given srs/EPSG Namecode.
    //Stores the min/max long/lat in the given array
    //==================================================================================================================
    /*var setSrsByWCS = function()
    {
        console.log("wat")
        if (srsSource !== undefined )
        {
            ajaxRequest('http://kahlua.eecs.jacobs-university.de:8080/def/crs/EPSG/0/', 'GET', 'xml', srsSource, onSetSrsByWCS);
        }
    };

    var onSetSrsByWCS = function(content)
    {
        $(content).find('EX_GeographicBoundingBox').each(function()
        {
            var bound = $(this).find('westBoundLongitude');
            var westBoundLong = parseFloat($(bound).find('Decimal').text());

            bound = $(this).find('eastBoundLongitude');
            var eastBoundLong = parseFloat($(bound).find('Decimal').text());
            boundLongitude = [westBoundLong, eastBoundLong];

            bound = $(this).find('northBoundLatitude');
            var northBoundLat = parseFloat($(bound).find('Decimal').text());

            bound = $(this).find('southBoundLatitude');
            var southBoundLat = parseFloat($(bound).find('Decimal').text());
            boundLatitude = [northBoundLat, southBoundLat];
            bound = null;
            return true;
        });
    }*/

    //==================================================================================================================
    //
    //==================================================================================================================
    var checkBounds = function()
    {
        try
        {
            if(subSetX[0] < minLatitude)
            {
                throw "MinLatidude " + subSetX[0] +" not in " + minLatitude;
            }

            if(subSetX[1] > maxLatitude)
            {
                throw "\tMaxLatidude " + subSetX[1] +" not in " + maxLatitude;
            }

            if(subSetY[0] < minLongitude)
            {
                throw "\tMinlongitude " + subSetY[0] +" not in " + minLongitude;
            }

            if(subSetY[1] > maxLongitude)
            {
                throw "\tMaxlongitude " + subSetY[1] +" not in " + maxLongitude;
            }
            return true;
        }
        catch(error)
        {
            x3dom.debug.logInfo('ServerRequest::checkBounds(): ' + error);
            return false;
        }
    };

    var ajaxRequest = function(url, type, dataType, data, callback)
    {
        console.time("AjaxRequest: "+url);
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

        console.timeEnd("AjaxRequest: "+url);
    };
}