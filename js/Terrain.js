//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

/**
 * @class Abstract base class for terrains.
 * @constructor
 */
EarthServerGenericClient.AbstractTerrain = function()
{
    var AppearanceDefined = [];

    /**
     * Creates a html canvas element out of the texture and removes the alpha values.
     * @param texture - Texture to draw. Can be everything which can be rendered into a canvas.
     * @param index - Index of the model using this canvas. Used to give the canvas a unique ID.
     * @returns {HTMLElement} - The canvas element.
     */
    this.createCanvas = function(texture,index)
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

    /**
     * Calc the needed numbers of chunks for the terrain for a specific chunksize.
     * @param width - Width of the entire terrain
     * @param height - Height if the entire terrain
     * @param chunkSize - The size of one chunk
     * @returns {{}} - Returns a object with: numChunksX,numChunksY and numChunksX
     */
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

    /**
     * Returns a height map part from the given height map specified in the info parameter.
     * @param info - Which part of the heightmap should be returned.
     * @param hm - The heightmap from which the parts is extracted.
     * @returns {*}
     */
    this.getHeightMap = function(info,hm)
    {
        try
        {
            var heightmapPart = new Array(info.chunkHeight);
            for(var i=0; i<info.chunkHeight; i++)
            {
                heightmapPart[i] = new Array(info.chunkWidth);
                for(var j=0; j<info.chunkWidth; j++)
                {
                    heightmapPart[i][j] = hm[info.xpos+j][info.ypos+i];
                }
            }
            return heightmapPart;
        }
        catch(error)
        {
            alert('AbstractTerrain::getHeightMap(): ' + error);
            return null;
        }
    };

    /**
     * Sets the transparency in all materials of this terrain.
     * @param value - Transparency value.
     */
    this.setTransparency = function(value)
    {
        if( this.materialNodes === undefined)
        {
            console.log("AbstractTerrain::setTransparency: No MaterialNodes defined in this instance.")
        }
        else
        {
            for(var k=0;k<this.materialNodes.length;k++)
            {
                this.materialNodes[k].setAttribute("transparency",value);
            }
        }
    };

    /**
     * This function handles the creation and usage of the appearances. It can be called for every shape or LOD that should use a canvasTexture.
     * It returns the amount of appearances specified. For every name only one appearance exits, every other uses it.
     * @param AppearanceName - Name of the appearance. If this name is not registered it is created, else the new appearance use the one with this name.
     * @param AppearanceCount - Number of appearance to be created. Use 3 for LODs for example.
     * @param modelIndex - Index of the model using this appearance.
     * @param canvasTexture - CanvasTexture to be used in the appearance.
     * @param transparency - Transparency of the appearance.
     * @returns {*} - Array of appearances.
     */
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
            alert('AbstractTerrain::getAppearances(): ' + error);
            return null;
        }
    }

};

/**
 * @class This terrain should receive multiple insertLevel calls. It removes the old version
 * and replace it with the new data. It can be used for progressive loading.
 * Example: WCPSDemAlpha with progressive loading using the progressiveWCPSLoader.
 * @augments EarthServerGenericClient.AbstractTerrain
 * @param index - Index of the model using this terrain.
 * @constructor
 */
EarthServerGenericClient.ProgressiveTerrain = function(index)
{
    var chunkInfo;
    var chunkSize = 256;
    var canvasTexture;
    var currentData = 0;
    this.materialNodes = [];

    /**
     * Insert one data level into the scene. The old elevation grids will be removed and new ones build.
     * @param root - Dom Element to append the terrain to.
     * @param data - Received Data of the Server request.
     * @returns {null}
     */
    this.insertLevel = function(root,data)
    {
        canvasTexture = this.createCanvas(data.texture,index);
        chunkInfo     = this.calcNumberOfChunks(data.width,data.height,chunkSize);

        //Remove all childs
        while (root.firstChild)
        {
            root.removeChild(root.firstChild);
        }

        for(var currentChunk=0; currentChunk< chunkInfo.numChunks; currentChunk++)
        {
            try
            {
                var info = {
                    xpos:parseInt(currentChunk%chunkInfo.numChunksX)*(chunkSize-1),
                    ypos:parseInt(currentChunk/chunkInfo.numChunksX)*(chunkSize-1),
                    chunkWidth:0,
                    chunkHeight:0,
                    terrainWidth: data.width,
                    terrainHeight: data.height,
                    ID: currentChunk,
                    modelIndex: index
                };

                if( currentChunk%chunkInfo.numChunksX === (chunkInfo.numChunksX-1) )
                {   info.chunkWidth = data.width - parseInt((chunkInfo.numChunksX-1)*chunkSize);   }
                else
                {   info.chunkWidth = chunkSize;   }

                if( currentChunk >= chunkInfo.numChunks - chunkInfo.numChunksX)
                {   info.chunkHeight = data.height - parseInt((chunkInfo.numChunksY-1)*chunkSize); }
                else
                {   info.chunkHeight = chunkSize  }


                var transform = document.createElement('Transform');
                transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
                transform.setAttribute("scale", "1.0 1.0 1.0");

                var hm = this.getHeightMap(info,data.heightmap);           //create height map
                var appearance = this.getAppearances("TerrainApp_"+index+"_"+currentData,1,index,canvasTexture,data.transparency);

                new ElevationGrid(transform,info, hm, appearance);

                root.appendChild(transform);

            }
            catch(error)
            {
                alert('Terrain::CreateNewChunk(): ' + error);
            }
            currentData++;
        }
    };
};
EarthServerGenericClient.ProgressiveTerrain.inheritsFrom( EarthServerGenericClient.AbstractTerrain);


/**
 * @class This terrain build up a LOD with 3 levels of the received data.
 * @param root - Dom Element to append the terrain to.
 * @param data - Received Data of the Server request.
 * @param index - Index of the model that uses this terrain.
 * @augments EarthServerGenericClient.AbstractTerrain
 * @constructor
 */
EarthServerGenericClient.LODTerrain = function(root, data,index)
{
    var lodRange1       = 2000;
    var lodRange2       = 10000;

    var canvasTexture   = this.createCanvas( data.texture,index);
    var chunkInfo       = this.calcNumberOfChunks(data.width,data.height,252);

    var chunkArray      = [chunkInfo.numChunks];
    this.materialNodes = [];

    /**
     * Builds the terrain and appends into the scene.
     * @returns {null}
     */
    this.createTerrain= function()
    {

        for(var currentChunk=0; currentChunk< chunkInfo.numChunks;currentChunk++)
        {
            try
            {
                var info = {
                    xpos:parseInt(currentChunk%chunkInfo.numChunksX)*252,
                    ypos:parseInt(currentChunk/chunkInfo.numChunksX)*252,
                    chunkWidth:0,
                    chunkHeight:0,
                    terrainWidth: data.width,
                    terrainHeight: data.height,
                    ID:currentChunk,
                    modelIndex: index
                };


                if( currentChunk%chunkInfo.numChunksX === (chunkInfo.numChunksX-1) )
                {   info.chunkWidth = data.width - parseInt((chunkInfo.numChunksX-1)*252);   }
                else
                {   info.chunkWidth = 253;   }

                if( currentChunk >= chunkInfo.numChunks - chunkInfo.numChunksX)
                {   info.chunkHeight = data.height - parseInt((chunkInfo.numChunksY-1)*252); }
                else
                {   info.chunkHeight = 253;  }

                var transform = document.createElement('Transform');
                transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
                transform.setAttribute("scale", "1.0 1.0 1.0");

                var lodNode = document.createElement('LOD');
                lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
                lodNode.setAttribute("id", 'lod' + info.ID);

                var hm = this.getHeightMap(info,data.heightmap);           //create height map
                var appearance = this.getAppearances("TerrainApp_"+index,3,index,canvasTexture,data.transparency);      //create chunk appearance

                chunkArray[currentChunk] = new ElevationGrid(lodNode,info, hm, appearance);
                transform.appendChild(lodNode);
                root.appendChild(transform);
            }
            catch(error)
            {
                alert('Terrain::CreateNewChunk(): ' + error);
            }
        }
    };

    this.destructor = function()
    {
        for(var i=0; i<chunkInfo.numChunks; i++)
        {
            chunkArray[i].destructor();
        }
        chunkArray = {};
    };
};
EarthServerGenericClient.LODTerrain.inheritsFrom( EarthServerGenericClient.AbstractTerrain);