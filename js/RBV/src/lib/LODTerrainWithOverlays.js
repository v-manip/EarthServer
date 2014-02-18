RBV.Visualization = RBV.Visualization || {};

/**
 * @class This terrain builds up a LOD with 3 levels of the received data.
 * @param root - Dom Element to append the terrain to.
 * @param data - Received Data of the Server request.
 * @param index - Index of the model that uses this terrain.
 * @param noDataValue - Array with the RGB values to be considered as no data available and shall be drawn transparent.
 * @param noDemValue - The single value in the DEM that should be considered as NODATA
 * @augments EarthServerGenericClient.AbstractTerrain
 * @constructor
 */
RBV.Visualization.LODTerrainWithOverlays = function(root, data,index,noDataValue,noDemValue)
{
    this.materialNodes = [];//Stores the IDs of the materials to change the transparency.
    this.data = data;
    this.index = index;
    this.noData = noDataValue;
    this.noDemValue = noDemValue;

    /**
     * Distance to change between full and 1/2 resolution.
     * @type {number}
     */
    var lodRange1       = 5000;
    /**
     * Distance to change between 1/2 and 1/4 resolution.
     * @type {number}
     */
    var lodRange2       = 17000;

    /**
     * The canvas that holds the received image.
     * @type {HTMLElement}
     */
    this.canvasTexture   = this.createCanvas( data.texture,index,noDataValue,data.removeAlphaChannel);

    /**
     * Size of one chunk. Chunks at the borders can be smaller.
     * We want to build 3 chunks for the LOD with different resolution but the same size on the screen.
     * With 121 values the length of the most detailed chunk is 120.
     * The second chunk has 61 values and the length of 60. With a scale of 2 it's back to the size of 120.
     * The third chunk has 31 values and the length if 30. With a scale of 4 it's also back to the size 120.
     * @type {number}
     */
    var chunkSize = 121;
    /**
     * General information about the number of chunks needed to build the terrain.
     * @type {number}
     */
    var chunkInfo       = this.calcNumberOfChunks(data.width,data.height,chunkSize);

    /**
     * Counter for the insertion of chunks.
     * @type {number}
     */
    var currentChunk    = 0;

    /**
     * Builds the terrain and appends it into the scene.
     */
    this.createTerrain= function()
    {
        for(currentChunk=0; currentChunk< chunkInfo.numChunks;currentChunk++)
        {
            EarthServerGenericClient.MainScene.enterCallbackForNextFrame( this.index );
        }
        currentChunk=0;
        //chunkInfo = null;

        EarthServerGenericClient.MainScene.reportProgress(index);
    };

    /**
     * The Scene Manager calls this function after a few frames since the last insertion of a chunk.
     */
    this.nextFrame = function()
    {
        try
        {
            //Build all necessary information and values to create a chunk
            var info = this.createChunkInfo(this.index,chunkSize,chunkInfo,currentChunk,data.width,data.height);
            var hm = this.getHeightMap(info);
            var appearance = this.getAppearances("TerrainApp_"+index,3,index,this.canvasTexture,
                data.transparency,this.data.specularColor,this.data.diffuseColor);

            var transform = document.createElement('Transform');
            transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
            transform.setAttribute("scale", "1.0 1.0 1.0");

            var lodNode = document.createElement('LOD');
            lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
            lodNode.setAttribute("id", 'lod' + info.ID);

            if( this.noData !== undefined || this.noDemValue != undefined)
            {   new GapGrid(lodNode,info, hm, appearance,this.noDemValue); }
            else
            {   new ElevationGrid(lodNode,info, hm, appearance);  }

            transform.appendChild(lodNode);
            root.appendChild(transform);

            currentChunk++;
            //Delete vars avoid circular references
            info = null;
            hm = null;
            appearance = null;
            transform = null;
            lodNode = null;
        }
        catch(error)
        {
            alert('Terrain::CreateNewChunk(): ' + error);
        }
    };
};
RBV.Visualization.LODTerrainWithOverlays.inheritsFrom( EarthServerGenericClient.AbstractTerrain);
