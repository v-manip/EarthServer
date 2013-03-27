//Namespace
var EarthServerGenericClient = EarthServerGenericClient || {};

EarthServerGenericClient.AnnotationLayer = function(root,fontSize,fontColor)
{
    this.addAnnotation = function(xPos,yPos,zPos,Text)
    {
        this.rootTransform = [];

        for(var i=0;i<2;i++)
        {
            //Setup text
            var textTransform = document.createElement('transform');
            textTransform.setAttribute('scale', fontSize + " " + fontSize + " " + fontSize);
            var shape = document.createElement('shape');
            var appearance = document.createElement('appearance');
            var material = document.createElement('material');
            material.setAttribute('emissiveColor', fontColor);
            var text = document.createElement('text');
            text.setAttribute('string', Text);
            var fontStyle = document.createElement('fontStyle');
            fontStyle.setAttribute('family', 'calibri');
            fontStyle.setAttribute('style', 'bold');
            text.appendChild(fontStyle);
            appearance.appendChild(material);
            shape.appendChild(appearance);
            shape.appendChild(text);
            textTransform.appendChild(shape);

            this.rootTransform[i] = document.createElement('transform');

            textTransform.setAttribute('translation', xPos + " " + yPos + " " + zPos);
            textTransform.setAttribute('scale', (-fontSize) + " " + (-fontSize) + " " + fontSize);

            if(i===0)
            {
                textTransform.setAttribute('rotation', '0 0 1 3.14');
                this.rootTransform[i].setAttribute('rotation', '0 1 0 3.14');
            }
            else
            {
                textTransform.setAttribute('rotation', '1 0 0 -1.57');
                this.rootTransform[i].setAttribute('rotation', '0 1 0 3.14');
            }

            root.appendChild( this.rootTransform[i] );
        }



        textTransform = null;
        shape = null;
        appearance = null;
        material = null;
        text = null;
        fontStyle = null;
    };

    this.renderLayer = function( value )
    {
        this.rootTransform[0].setAttribute("render", value);
        this.rootTransform[1].setAttribute("render", value);
    };
};