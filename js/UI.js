var EarthServerGenericClient = EarthServerGenericClient || {};

EarthServerGenericClient.appendXYZASlider = function(element, moduleNumber){
    //X-Axis
    var XDiv = document.createElement("div");
    XDiv.setAttribute("id","EarthServerGenericClient_SliderCell_XDiv_" + moduleNumber );
    XDiv.innerHTML ="X Translation:";
    element.appendChild(XDiv);
    var XSlider = new Rj.widget.HorizontalSlider("#EarthServerGenericClient_SliderCell_XDiv_" + moduleNumber, -EarthServerGenericClient_MainScene.cubeSizeX, EarthServerGenericClient_MainScene.cubeSizeX);
    XSlider.addListener("hSliderListener", "valuechanged", function(value){
        EarthServerGenericClient_MainScene.updateOffset(0,value);
    });
    var startValue = EarthServerGenericClient_MainScene.models[moduleNumber].xOffset * EarthServerGenericClient_MainScene.cubeSizeX;
    XSlider.$value = startValue;
    XSlider.$instantChange = true;

    //Y-Axis
    var YDiv = document.createElement("div");
    YDiv.setAttribute("id","EarthServerGenericClient_SliderCell_YDiv_" + moduleNumber );
    YDiv.innerHTML = "Y Translation:";
    element.appendChild(YDiv);
    var YSlider = new Rj.widget.HorizontalSlider("#EarthServerGenericClient_SliderCell_YDiv_" + moduleNumber, -EarthServerGenericClient_MainScene.cubeSizeY, EarthServerGenericClient_MainScene.cubeSizeY);
    YSlider.addListener("hSliderListener", "valuechanged", function(value){
        EarthServerGenericClient_MainScene.updateOffset(1,value);
    });
    startValue = EarthServerGenericClient_MainScene.models[moduleNumber].yOffset * EarthServerGenericClient_MainScene.cubeSizeY;
    YSlider.$value = startValue;
    YSlider.$instantChange = true;

    //Z-Axis
    var ZDiv = document.createElement("div");
    ZDiv.setAttribute("id","EarthServerGenericClient_SliderCell_ZDiv_" + moduleNumber );
    ZDiv.innerHTML = "Z Translation:";
    element.appendChild(ZDiv);
    var ZSlider = new Rj.widget.HorizontalSlider("#EarthServerGenericClient_SliderCell_ZDiv_" + moduleNumber, -EarthServerGenericClient_MainScene.cubeSizeZ, EarthServerGenericClient_MainScene.cubeSizeZ);
    ZSlider.addListener("hSliderListener", "valuechanged", function(value){
        EarthServerGenericClient_MainScene.updateOffset(2,value);
    });
    startValue = EarthServerGenericClient_MainScene.models[moduleNumber].zOffset * EarthServerGenericClient_MainScene.cubeSizeZ;
    ZSlider.$value = startValue;
    ZSlider.$instantChange = true;

    //AlphaChannel
    var ADiv = document.createElement("div");
    ADiv.setAttribute("id","EarthServerGenericClient_SliderCell_ADiv_" + moduleNumber );
    ADiv.innerHTML = "Transparency:";
    element.appendChild(ADiv);
    var ASlider = new Rj.widget.HorizontalSlider("#EarthServerGenericClient_SliderCell_ADiv_" + moduleNumber, 0, 100);
    ASlider.addListener("hSliderListener", "valuechanged", function(value){
        value = parseFloat(value/100);
        EarthServerGenericClient_MainScene.updateTransparency(value);
    });
    startValue = EarthServerGenericClient_MainScene.models[moduleNumber].transparency*100;
    ASlider.$value = startValue;
    ASlider.$instantChange = true;

};

EarthServerGenericClient.appendElevationSlider = function(element,moduleNumber){
    var Div = document.createElement("div");
    Div.setAttribute("id","EarthServerGenericClient_SPECIFICCell_Div_" + moduleNumber );
    Div.innerHTML = "Elevation:";
    element.appendChild(Div);
    var ElavationSlider = new Rj.widget.HorizontalSlider("#EarthServerGenericClient_SPECIFICCell_Div_" + moduleNumber, 0,100);
    ElavationSlider.addListener("hSliderListener", "valuechanged", function(value){
        EarthServerGenericClient_MainScene.updateElevation(value);
    });
    ElavationSlider.$value = 10;
    ElavationSlider.$instantChange = true;

};