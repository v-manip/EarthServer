//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};


EarthServerGenericClient.AbstractLODTerrain = function()
{
    var AppearanceDefined = [];

    this.createCanvas =  function(texture,index)
    {
        var canvasTexture	= document.createElement('canvas');
        canvasTexture.style.display = "none";
        canvasTexture.setAttribute("id", "EarthServerGenericClient_Canvas"+index);
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

        return canvasTexture;
    };

    this.calcNumberOfChunks = function(width,height,chunkSize)
    {
        var chunksInfo = {};

        chunksInfo.numChunksX = parseInt(width/chunkSize);
        if(width%chunkSize!==0)
        {   chunksInfo.numChunksX++;  }

        chunksInfo.numChunksY = parseInt(height/chunkSize);
        if(height%chunkSize!==0)
        {   chunksInfo.numChunksY++;  }

        chunksInfo.numChunks = parseInt(chunksInfo.numChunksY*chunksInfo.numChunksX);

        return chunksInfo;
    };

    this.getHeightMap = function(info,hm)
    {
        try
        {
            var heightmapPart = new Array(info.height);
            for(var i=0; i<info.height; i++)
            {
                heightmapPart[i] = new Array(info.width);
                for(var j=0; j<info.width; j++)
                {
                    heightmapPart[i][j] = hm[info.xpos+j][info.ypos+i];
                }
            }
            return heightmapPart;
        }
        catch(error)
        {
            alert('AbstractLODTerrain::getHeightMap(): ' + error);
            return null;
        }
    };

    this.getAppearances = function(AppearanceName,AppearanceCount,modelIndex,canvasTexture,transparency)
    {
        try
        {
            var appearances = [AppearanceCount];
            for(var i=0; i<AppearanceCount;i++)
            {
                var appearance = document.createElement('Appearance');
                appearance.setAttribute('sortType', 'transparent');

                if( AppearanceDefined[AppearanceName] != undefined )//use the already defined appearance
                {
                    appearance.setAttribute("use", AppearanceDefined[AppearanceName]);
                }
                else    //create a new appearance with the given parameter
                {
                    AppearanceDefined[AppearanceName] = AppearanceName;
                    appearance.setAttribute("id",AppearanceDefined[AppearanceName]);
                    appearance.setAttribute("def",AppearanceDefined[AppearanceName]);
                    //Set texture
                    var texture = document.createElement('Texture');
                    texture.setAttribute('hideChildren', 'true');
                    texture.setAttribute("repeatS",'true');
                    texture.setAttribute("repeatT",'true');

                    texture.appendChild(canvasTexture);

                    var imageTransform = document.createElement('TextureTransform');
                    imageTransform.setAttribute("scale", "1,-1");

                    var material = document.createElement('material');
                    //material.setAttribute('specularColor', '0.0 0.0 0.0');
                    //material.setAttribute('diffuseColor', '0.8 0.8 0.8');
                    material.setAttribute("specularColor", "0.1,0.1,0.1");
                    material.setAttribute("diffuseColor", "0.4,0.4,0.4");
                    material.setAttribute('transparency', transparency);
                    this.materialNodes.push( material);

                    appearance.appendChild(material);
                    appearance.appendChild(imageTransform);
                    appearance.appendChild(texture);
                }
                appearances[i]=appearance;
            }
            return appearances;
        }
        catch(error)
        {
            alert('AbstractLODTerrain::getAppearances(): ' + error);
            return null;
        }
    }

};

EarthServerGenericClient.ProgressiveLODTerrain = function(root,index,numberOfLevels)
{
    //Prepare Terrain
    this.materialNodes  = [];

    //var appearances = [numberOfLevels];
    var chunkInfo   = [numberOfLevels];
    var canvasTexture = [numberOfLevels];
    var currentLevel  = numberOfLevels-1;

    var LODNodes  = [];
    var lodRange1       = 5000;
    var lodRange2       = 10000;
    var ranges = ["100,2000","100",""];

    this.getRange = function(currentLevel)
    {
        return ranges[currentLevel];
    };

    this.insertLevel = function(data)
    {
        canvasTexture[currentLevel] = this.createCanvas(data.texture,index);
        chunkInfo[currentLevel]   = this.calcNumberOfChunks(data.width,data.height,252/Math.pow(2,currentLevel) );

        for(var currentChunk=0; currentChunk< chunkInfo[currentLevel].numChunks;currentChunk++)
        {
            try
            {
                var info = {
                    xpos:parseInt(currentChunk%chunkInfo[currentLevel].numChunksX)*252/Math.pow(2,currentLevel),
                    ypos:parseInt(currentChunk/chunkInfo[currentLevel].numChunksX)*252/Math.pow(2,currentLevel),
                    width:0,
                    height:0,
                    hmWidth: data.width,
                    hmHeight: data.height,
                    ID:currentLevel + "_" + currentChunk,
                    modelIndex: index
                };

                if( currentChunk%chunkInfo[currentLevel].numChunksX === (chunkInfo[currentLevel].numChunksX-1) )
                {   info.width = data.width - parseInt((chunkInfo[currentLevel].numChunksX-1)*252/Math.pow(2,currentLevel));   }
                else
                {   info.width = (252/Math.pow(2,currentLevel))+1;   }

                if( currentChunk >= chunkInfo[currentLevel].numChunks - chunkInfo[currentLevel].numChunksX)
                {   info.height = data.height - parseInt((chunkInfo[currentLevel].numChunksY-1)*252/Math.pow(2,currentLevel)); }
                else
                {   info.height = (252/Math.pow(2,currentLevel))+1;  }

                var appendAfter = false;
                if( LODNodes[currentChunk] === undefined)
                {
                    appendAfter = true;
                    var transform = document.createElement('Transform');
                    transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
                    transform.setAttribute("scale", "1.0 1.0 1.0");

                    var lodNode = document.createElement('LOD');
                    //lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
                    lodNode.setAttribute("Range", this.getRange(currentLevel));
                    lodNode.setAttribute("id", 'lod' + info.ID);
                    //lodNode.setAttribute("forceTransitions", true);

                    LODNodes[currentChunk] = lodNode;

                }
                var hm = this.getHeightMap(info,data.heightmap);           //create height map
                var appearance = this.getAppearances("TerrainApp_"+index+"_"+currentLevel,1,index,canvasTexture[currentLevel],data.transparency);

                new Chunk(LODNodes[currentChunk],info, hm, appearance);
                LODNodes[currentChunk].setAttribute("Range", this.getRange(currentLevel));

                if(appendAfter)
                {
                    transform.appendChild(lodNode);
                    root.appendChild(transform);
                }
            }
            catch(error)
            {
                alert('Terrain::CreateNewChunk(): ' + error);
                return null;
            }
        }
        currentLevel--;
    };
};
EarthServerGenericClient.ProgressiveLODTerrain.inheritsFrom( EarthServerGenericClient.AbstractLODTerrain);




EarthServerGenericClient.LODTerrain = function(root, data,index)
{
    var lodRange1       = 10000;
    var lodRange2       = 200000;

    var canvasTexture   = this.createCanvas( data.texture,index);
    var chunkInfo       = this.calcNumberOfChunks(data.width,data.height,252);

    var chunkArray      = [chunkInfo.numChunks];
    this.materialNodes  = [];

    //==================================================================================================================
    // This function build all chunks.
    //==================================================================================================================
    this.createTerrain= function()
    {
        console.time("terrain_"+index+"_"+(chunkInfo.numChunks-1));

        for(var currentChunk=0; currentChunk< chunkInfo.numChunks;currentChunk++)
        {
            try
            {
                var info = {
                    xpos:parseInt(currentChunk%chunkInfo.numChunksX)*252,
                    ypos:parseInt(currentChunk/chunkInfo.numChunksX)*252,
                    width:0,
                    height:0,
                    hmWidth: data.width,
                    hmHeight: data.height,
                    ID:currentChunk,
                    modelIndex: index
                };


                if( currentChunk%chunkInfo.numChunksX === (chunkInfo.numChunksX-1) )
                {   info.width = data.width - parseInt((chunkInfo.numChunksX-1)*252);   }
                else
                {   info.width = 253;   }

                if( currentChunk >= chunkInfo.numChunks - chunkInfo.numChunksX)
                {   info.height = data.height - parseInt((chunkInfo.numChunksY-1)*252); }
                else
                {   info.height = 253;  }

                var transform = document.createElement('Transform');
                transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
                transform.setAttribute("scale", "1.0 1.0 1.0");

                var lodNode = document.createElement('LOD');
                lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
                lodNode.setAttribute("id", 'lod' + info.ID);

                var hm = this.getHeightMap(info,data.heightmap);           //create height map
                var appearance = this.getAppearances("TerrainApp_"+index,3,index,canvasTexture,data.transparency);      //create chunk appearance

                chunkArray[currentChunk] = new Chunk(lodNode,info, hm, appearance);
                transform.appendChild(lodNode);
                root.appendChild(transform);
            }
            catch(error)
            {
                alert('Terrain::CreateNewChunk(): ' + error);
                return null;
            }
        }
    };

    //==================================================================================================================
    // Get terrain sizes (x/z).
    //==================================================================================================================
    this.getTerrainSize = function()
    {
        var size = {
            x:data.width,
            y:data.height
        };
        return size;
    };

    //==================================================================================================================
    //Returns the Minimum,Maximum and Average value of the heightfield. [min,max,avg]
    //==================================================================================================================
    this.getDEMInfo = function()
    {
        var info = {
            min:data.minMSAT,
            max:data.maxMSAT,
            avg:data.averageMSAT
        };
        return info;
    };

    //==================================================================================================================
    // Changes the transparency of all chunks.
    //==================================================================================================================
    this.setTransparency = function(value)
    {
       // materialNode.setAttribute("transparency",value);
        for(var k=0;k<this.materialNodes.length;k++)
        {
            this.materialNodes[k].setAttribute("transparency",value);
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
    };
};
EarthServerGenericClient.LODTerrain.inheritsFrom( EarthServerGenericClient.AbstractLODTerrain);