/*======================================================================================================================
 EarthServer Project
 2012 Fraunhofer IGD

 File:           Chunk.js
 Last change:    06.08.2012

 Description:

 ======================================================================================================================*/
function Chunk(parentNode,chunkInfo, hf,imageURL)
{
    "use strict";

    //private:
    var imageCNT = 0;
    var imageMap = {};

    var lodRange1 = 5000;
    var lodRange2 = 10000;
    var info = chunkInfo;

    var geometry = {
        transform:null,
        lodNode:null,
        lodMaterial: new Array()
    };

    //==================================================================================================================
    //Creates and inserts X3D inline node (terrain chunk) into DOM.
    //==================================================================================================================
    function setupChunk()
    {

        try
        {
            var elevationGrid, imageTexture, shape, appearance,imageTransform, shf;

            geometry.transform = document.createElement('Transform');
            geometry.transform.setAttribute("translation", info.xpos + " 0 " + info.ypos);
            geometry.transform.setAttribute("scale", "1.0 1.0 1.0");

            //LOD
            geometry.lodNode = document.createElement('LOD');
            geometry.lodNode.setAttribute("Range", lodRange1 + ',' + lodRange2);
            geometry.lodNode.setAttribute("id", 'lod' + info.ID);

            //We build a LOD with 3 children. [Full Resolution, 1/2 Resolution, 1/4 Resolution]
            for(var i=0; i<3; i++)
            {
                //All none full resolutions needs to be one element bigger to keep the desired length
                var add = 0;
                if(i !== 0)
                {
                    add = 1;
                }

                //Set up: Shape-> Apperance -> ImageTexture +  Texturtransform
                shape = document.createElement('Shape');
                shape.setAttribute("id",chunkInfo.modelIndex+"_shape_"+chunkInfo.ID+"_"+i);

                //Build the ElavationsGrid
                //shrink the heightfield to the correct size for this detail level
                shf = shrinkHeightMap(hf, info.width, info.height,Math.pow(2,i));

                elevationGrid = document.createElement('ElevationGrid');
                elevationGrid.setAttribute("id", chunkInfo.modelIndex+"hm"+ info.ID+"_"+i);
                elevationGrid.setAttribute("solid", "false");
                elevationGrid.setAttribute("xSpacing", String(Math.pow(2,i)));//To keep the same size with fewer elements increase the space of one element
                elevationGrid.setAttribute("zSpacing", String(Math.pow(2,i)));
                elevationGrid.setAttribute("xDimension", parseInt(info.width/Math.pow(2,i))+add);//fewer elements in every step
                elevationGrid.setAttribute("zDimension", parseInt(info.height/Math.pow(2,i))+add);
                elevationGrid.setAttribute("height", shf );
                elevationGrid.appendChild(calcTexCoords(info.xpos, info.ypos, info.width, info.height, info.hmWidth, info.hmHeight,Math.pow(2,i)));


                //Set texture
                appearance = document.createElement('Appearance');
                appearance.setAttribute('sortType', 'transparent');

                imageTexture = getImageNode(imageURL);//Imagenode DEF/USE
                imageTransform = document.createElement('TextureTransform');
                imageTransform.setAttribute("scale", "1,-1");

                var material = document.createElement('material');
                material.setAttribute('specularColor', '0.0 0.0 0.0');
                material.setAttribute('diffuseColor', '0.8 0.8 0.8');
                material.setAttribute('transparency', info.transparency);
                geometry.lodMaterial[geometry.lodMaterial.length] = material;
                appearance.appendChild(material);

                //Append in DOM
                appearance.appendChild(imageTexture);
                appearance.appendChild(imageTransform);
                shape.appendChild(appearance);
                shape.appendChild(elevationGrid);

                geometry.lodNode.appendChild(shape);

                //set null stuff
                shf = null;
                shape = null;
                appearance = null;
                imageTexture = null;
                imageTransform = null;
                elevationGrid = null;
            }

            geometry.transform.appendChild(geometry.lodNode);
            parentNode.appendChild(geometry.transform);
            hf = null;
        }
        catch(error)
        {
            alert('Chunk::setupChunk(): ' + error);
        }

        console.timeEnd("terrain_"+chunkInfo.modelIndex+"_"+chunkInfo.ID);
    }

    //public:
    //==================================================================================================================
    // Returns a array with some information about this chunk.
    //==================================================================================================================
    this.getInfo = function()
    {
        return info;
    };

    //==================================================================================================================
    //Returns a imageTexture when called first. Then references to the first one.
    //The function accepts either a url to load or a canvas.
    //==================================================================================================================
    function getImageNode(image)
    {
        try
        {
            if(Object.prototype.toString.call(image) === '[object HTMLCanvasElement]')
            {
                x3dom.debug.logInfo("Canvas");

                if(imageMap["Canvas"] === undefined)//Not in map
                {
                    image.setAttribute("id","EarthServerGenericClient_Canvas"+info.modelIndex);
                    var texture = document.createElement('Texture');
                    texture.setAttribute('hideChildren', 'true');
                    texture.setAttribute("repeatS",'true');
                    texture.setAttribute("repeatT",'true');

                    texture.appendChild(image);
                    texture.setAttribute("def", "EarthServerGenericClient_Image"+info.modelIndex);
                    texture.setAttribute("id", "EarthServerGenericClient_Image"+info.modelIndex);
                    imageMap["Canvas"] = "EarthServerGenericClient_Image"+info.modelIndex;
                    imageCNT++;
                }
                else
                {
                    texture = document.createElement('Texture');
                    texture.setAttribute("use", imageMap["Canvas"]);
                }
                x3dom.debug.logInfo('Texture: ' + texture);
                return texture;
            }
            else
            {
                var imageTexture = document.createElement('ImageTexture');
                    imageTexture.setAttribute("use","EarthServerGenericClient_Image"+info.modelIndex);

                x3dom.debug.logInfo('ImageTexture: ' + imageTexture);
                return imageTexture;
            }
        }
        catch(error)
        {
            alert('Chunk::getImageNode(): ' + error);
            return document.createElement('Texture');
        }
    }

    //==================================================================================================================
    //Shrinks the heightfield with the given factor
    //==================================================================================================================
    function shrinkHeightMap(heightfield, sizex, sizey, shrinkfactor)
    {
        var smallGrid, smallx, smally, val,i,k,l, o,div;

        x3dom.debug.logInfo('ShrinkHeightMap: ' +sizex+'/'+sizey+'/'+shrinkfactor);

        smallx = parseInt(sizex/shrinkfactor);
        smally = parseInt(sizey/shrinkfactor);
        //IF shrinked the heightfield needs one more element than the desired length (63 elements for a length of 62)
        if( shrinkfactor !== 1)
        {
            smallx++;
            smally++;

            smallGrid = "";
            div=shrinkfactor*shrinkfactor;

            for(i=0; i<smally; i++)
            {
                for(k=0; k<smallx; k++)
                {
                    val = 0;
                    for(l=0; l<shrinkfactor; l++)
                    {
                        for(o=0; o<shrinkfactor; o++)
                        {
                            var x = (k*shrinkfactor)+l;
                            var y = (i*shrinkfactor)+o;
                            if(x >= sizex) x = sizex -1;
                            if(y >= sizey) y = sizey -1;
                            var tmp = heightfield[y][x];
                            val = val + parseFloat(tmp);
                        }
                    }
                    val = parseFloat(val/div);
                    smallGrid = smallGrid + val+ " ";
                }
            }
        }
        else
        {
            smallGrid = "";

            for(i=0; i<smally; i++)
            {
                for(k=0; k<smallx; k++)
                {
                    if( heightfield[i] === undefined)
                    {
                        alert("X: " + i + " should be " + sizex)  ;
                    }

                    if(  heightfield[i][k] === undefined )
                    {
                        alert("Y: " + i + "/" + k + " should be " + sizex + "/" + sizey);
                    }
                    val = parseFloat( heightfield[i][k]);
                    smallGrid = smallGrid + val+ " ";
                }
            }
        }
        return smallGrid;
    }

    //==================================================================================================================
    //Calcs the TextureCoordinats for the given part of the heightmap
    //==================================================================================================================
    function calcTexCoords(xpos,ypos,sizex,sizey,hmWidth, hmHeight, shrinkfactor)
    {
        x3dom.debug.logInfo('pos: ' + xpos + ',' + ypos + ' size: ' + sizex + ',' + sizey + ' hm: ' + hmWidth + ',' +hmHeight + ' shrinkfactor: ' + shrinkfactor);
        var tc, tcnode,i,k, offsetx, offsety, partx, party, tmpx, tmpy,smallx,smally;
        offsetx = xpos/hmWidth;
        offsety = ypos/hmHeight;
        partx   = parseFloat( (sizex/hmWidth)*(1/sizex)*shrinkfactor );
        party   = parseFloat( (sizey/hmHeight)*(1/sizey)*shrinkfactor );
        smallx = parseInt(sizex/shrinkfactor);
        smally = parseInt(sizey/shrinkfactor);

        if( shrinkfactor !== 1)
        {
            smallx++;
            smally++;
        }

        tc = "";
        //Create Node
        tcnode = document.createElement("TextureCoordinate");

        //File string
        for (i = 0; i < smally; i++)
        {
            for (k = 0; k < smallx; k++)
            {
                tmpx = offsetx + (k*partx);
                tmpy = offsety + (i*party);

                tc = tc + tmpx + " " + tmpy + " ";
            }
        }

        tcnode.setAttribute("point", tc);

        return tcnode;
    }

    this.setTransparency = function(value)
    {
        if(value>1.0)
        {
            value = 1.0;
        }
        else if(value<0)
        {
            value = 0;
        }

        for(var i=0; i<geometry.lodMaterial.length; i++)
        {
            geometry.lodMaterial[i].setAttribute('transparency', value);
        }
    };

    //==================================================================================================================
    //
    //==================================================================================================================
    this.destructor = function()
    {
        //delete info
        //delete geometry
    };

    setupChunk();
}