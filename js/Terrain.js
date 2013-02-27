/*======================================================================================================================
 EarthServer Project
 2012 Fraunhofer IGD

 File:           Terrain.js
 Last change:    17.10.2012

 Description:

 ======================================================================================================================*/
function Terrain(root, data,index)
{
    "use strict";

    //private:
    var modelIndex 	    = index;
    var parentNode      = root;
    var minDEM          = data.minMSAT;          //minimum height of height map
    var maxDEM          = data.maxMSAT;         //average height of height map
    var averageDEM      = data.averageMSAT;

    var heightmap       = data.heightmap;

    var width           = data.width;
    var height          = data.height;
    var texture         = data.texture;

    var transparency    = data.transparency;

    var canvasTexture	= document.createElement('canvas');
    canvasTexture.style.display = "none";
    canvasTexture.setAttribute("id", "EarthServerGenericClient_Canvas"+this.modelIndex);
    canvasTexture.width = Math.pow(2, Math.round(Math.log(texture.width)/Math.log(2)));
    canvasTexture.height = Math.pow(2, Math.round(Math.log(texture.height)/Math.log(2)));

    var context = canvasTexture.getContext('2d');
    context.drawImage(texture, 0,0, canvasTexture.width, canvasTexture.height);

    var imageData = context.getImageData(0, 0, canvasTexture.width, canvasTexture.height);
    for (var i=0;i<imageData.data.length;i+=4)
    {
        imageData.data[i+3]=255;
    }
    context.putImageData(imageData,0,0);

    var numChunksX = parseInt(width/252, 10);
    if(width%252!==0)
    {
        numChunksX++;
    }

    var numChunksY = parseInt(height/252, 10);
    if(height%252!==0)
    {
        numChunksY++;
    }

    var numChunks = parseInt(numChunksY*numChunksX);
    var chunkArray=[numChunks];

    //==================================================================================================================
    // This function build all chunks.
    //==================================================================================================================
    this.createTerrain= function()
    {
        console.time("terrain_"+modelIndex+"_"+(numChunks-1));

        for(var currentChunk=0; currentChunk< numChunks;currentChunk++)
        {
            try
            {
                var info = {
                    xpos:parseInt(currentChunk%numChunksX)*252,
                    ypos:parseInt(currentChunk/numChunksX)*252,
                    width:0,
                    height:0,
                    hmWidth: width,
                    hmHeight: height,
                    ID:currentChunk,
                    modelIndex: modelIndex,
                    transparency: transparency
                };


                if( currentChunk%numChunksX === (numChunksX-1) )
                {
                    info.width = width - parseInt((numChunksX-1)*252);
                }
                else
                {
                    info.width = 253;
                }

                if( currentChunk >= numChunks - numChunksX)
                {
                    info.height = height - parseInt((numChunksY-1)*252);
                }
                else
                {
                    info.height = 253;
                }

                var hm = getHeightMap(info);           //create height map
                var image;               //create chunk texture
                if( currentChunk == 0)
                {   image = canvasTexture;}
                else
                {   image = "EarthServerGenericClient_Image"+modelIndex; }

                chunkArray[currentChunk] = new Chunk(parentNode,info, hm, image);
            }
            catch(error)
            {
                alert('Terrain::CreateNewChunk(): ' + error);
                return null;
            }
        }
    };

    //==================================================================================================================
    //Returns a specific part of the heightfield.
    //==================================================================================================================
    function getHeightMap(info)
    {
        try
        {
            x3dom.debug.logInfo("Get height map");
            var heightmapPart = new Array(info.height);
            for(var i=0; i<info.height; i++)
            {
                heightmapPart[i] = new Array(info.width);
                for(var j=0; j<info.width; j++)
                {
                    heightmapPart[i][j] = heightmap[info.xpos+j][info.ypos+i];
                }
            }
            return heightmapPart;
        }
        catch(error)
        {
            alert('Terrain::getHeightMap(): ' + error);
            return null;
        }
    }

    //==================================================================================================================
    // Get terrain sizes (x/z).
    //==================================================================================================================
    this.getTerrainSize = function()
    {
        var size = {
            x:width,
            y:height
        };
        return size;
    };

    //==================================================================================================================
    //Returns the Minimum,Maximum and Average value of the heightfield. [min,max,avg]
    //==================================================================================================================
    this.getDEMInfo = function()
    {
        var info = {
            min:minDEM,
            max:maxDEM,
            avg:averageDEM
        };
        return info;
    };

    //==================================================================================================================
    // Changes the transparency of all chunks.
    //==================================================================================================================
    this.setTransparency = function(value)
    {
        for(var i=0; i<chunkArray.length; i++)
        {
            chunkArray[i].setTransparency(value);
        }
    };

    //==================================================================================================================
    // DESTRUCTOR
    //==================================================================================================================
    this.destructor = function()
    {
        for(var i=0; i<numChunks; i++)
        {
            chunkArray[i].destructor();
        }
        chunkArray = {};
        parentNode = null;
    };
}