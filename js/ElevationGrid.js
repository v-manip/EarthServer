/*======================================================================================================================
 EarthServer Project
 2012 Fraunhofer IGD

 File:           Chunk.js
 Last change:    06.08.2012

 Description:

 ======================================================================================================================*/
function Chunk(parentNode,info, hf,appearances)
{
    "use strict";


    //==================================================================================================================
    //Creates and inserts X3D inline node (terrain chunk) into DOM.
    //==================================================================================================================
    function setupChunk()
    {

        try
        {
            var elevationGrid, shape, shf;

            //We build a LOD with 3 children. [Full Resolution, 1/2 Resolution, 1/4 Resolution]
            for(var i=0; i<appearances.length; i++)
            {
                //All none full resolutions needs to be one element bigger to keep the desired length
                var add = 0;
                if(i !== 0)
                { add = 1;  }

                //Set up: Shape-> Apperance -> ImageTexture +  Texturtransform
                shape = document.createElement('Shape');
                shape.setAttribute("id",info.modelIndex+"_shape_"+info.ID+"_"+i);

                //Build the ElavationsGrid
                //shrink the heightfield to the correct size for this detail level
                shf = shrinkHeightMap(hf, info.width, info.height,Math.pow(2,i));

                elevationGrid = document.createElement('ElevationGrid');
                elevationGrid.setAttribute("id", info.modelIndex+"hm"+ info.ID+"_"+i);
                elevationGrid.setAttribute("solid", "false");
                elevationGrid.setAttribute("xSpacing", String(Math.pow(2,i)));//To keep the same size with fewer elements increase the space of one element
                elevationGrid.setAttribute("zSpacing", String(Math.pow(2,i)));
                elevationGrid.setAttribute("xDimension", parseInt(info.width/Math.pow(2,i))+add);//fewer elements in every step
                elevationGrid.setAttribute("zDimension", parseInt(info.height/Math.pow(2,i))+add);
                elevationGrid.setAttribute("height", shf );
                elevationGrid.appendChild(calcTexCoords(info.xpos, info.ypos, info.width, info.height, info.hmWidth, info.hmHeight,Math.pow(2,i)));

                shape.appendChild(appearances[i]);
                shape.appendChild(elevationGrid);

                parentNode.appendChild(shape);

                //set null stuff
                shf = null;
                shape = null;
                elevationGrid = null;
            }
            hf = null;
        }
        catch(error)
        {
            alert('Chunk::setupChunk(): ' + error);
        }

        console.timeEnd("terrain_"+info.modelIndex+"_"+info.ID);
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
    //Shrinks the heightfield with the given factor
    //==================================================================================================================
    function shrinkHeightMap(heightfield, sizex, sizey, shrinkfactor)
    {
        var smallGrid, smallx, smally, val,i,k,l,o,div;

        x3dom.debug.logInfo('ShrinkHeightMap: ' +sizex+'/'+sizey+'/'+shrinkfactor);

        smallGrid = [];
        smallx = parseInt(sizex/shrinkfactor);
        smally = parseInt(sizey/shrinkfactor);
        //IF shrinked the heightfield needs one more element than the desired length (63 elements for a length of 62)
        if( shrinkfactor !== 1)
        {
            smallx++;
            smally++;
            div=shrinkfactor*shrinkfactor;

            for(i=0; i<smally; i++)
            {
                var i_sf = (i*shrinkfactor);

                for(k=0; k<smallx; k++)
                {
                    var k_sf = (k*shrinkfactor);
                    val = 0;
                    for(l=0; l<shrinkfactor; l++)
                    {
                        for(o=0; o<shrinkfactor; o++)
                        {
                            var x = k_sf + l;
                            var y = i_sf + o;
                            if(x >= sizex) x = sizex -1;
                            if(y >= sizey) y = sizey -1;
                            var tmp = heightfield[y][x];
                            val = val + parseFloat(tmp);
                        }
                    }
                    val = val/div;
                    //smallGrid = smallGrid + val+ " ";
                    smallGrid.push(val+ " ");
                }
            }
        }
        else
        {
            for(i=0; i<smally; i++)
            {
                for(k=0; k<smallx; k++)
                {
                    val = parseFloat( heightfield[i][k]);
                    //smallGrid = smallGrid + val+ " ";
                    smallGrid.push(val+" ");
                }
            }
        }
        return smallGrid.join(" ");
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

        var buffer = [];
        //Create Node
        tcnode = document.createElement("TextureCoordinate");

        //File string
        for (i = 0; i < smally; i++)
        {
            for (k = 0; k < smallx; k++)
            {
                tmpx = offsetx + (k*partx);
                tmpy = offsety + (i*party);

                buffer.push(tmpx + " ");
                buffer.push(tmpy + " ");
            }
        }
        tc = buffer.join("");

        tcnode.setAttribute("point", tc);

        return tcnode;
    }

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