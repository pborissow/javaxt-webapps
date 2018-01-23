if(!javaxt) var javaxt={};
if(!javaxt.dhtml) javaxt.dhtml={};

//******************************************************************************
//**  SpriteManager
//******************************************************************************
/**
 *   Used to create sprites using the drag-and-drop feature in HTML5. 
 *   Inspired by the following tutorial:
 *   https://www.html5rocks.com/en/tutorials/file/dndfiles/
 *
 ******************************************************************************/

javaxt.dhtml.SpriteManager = function(parent, config) {
    this.className = "javaxt.dhtml.SpriteManager";
    
    var me = this;
    var groups = {};
    var mask, popup;
    var body = document.getElementsByTagName("body")[0];
    
    var defaultConfig = {
        
        sizes : [16,32,64,128,256],
        
        style: {
            
            thumbnail: {
                width: "64px",
                height: "64px",
                border: "1px solid #cecece",
                margin: "0px"
            },
            
            label: {
                width: "64px",
                border: "0px",
                color: "#757575",
                fontSize: "12px"
            },
            
            sprite: {
                border: "1px solid #cecece",
                textAlign: "center",
                height: "150px",
                marginBottom: "5px"
            },
            
            textarea: {
                border: "1px solid #cecece",
                fontFamily: "consolas",
                fontSize: "9pt",
                color: "#353535"
            },
            
            input: {
                border: "1px solid #cecece"
            },
            
            refeshButton: {
                width: "16px",
                height: "16px",
                backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANS"+
                "UhEUgAAABAAAAAQCAYAAAAf8/9hAAACrUlEQVQ4jX2SW0jTcRzFf9VDBdGDUC"+
                "SZkY0ebJRkZom3aHmdiSP/JSr8y2tesqnTCVpzM7JpzomZOnUXV7lNN5tW1MK"+
                "8jdSclpFJZLIQp2CQRW/G6aE2nagHzuP5/Djn+yOEEFLQk431TFYpTBFYzJKf"+
                "kRBCtpD1VNCTDdPPLrz4YUDv72dOgFgte39+b+Zsy0zdH0rDlnFaQ103hHQut"+
                "KJ78ZETIPd1xi/9ghqmJQN0NiXi9NHDsdrgXY5gjCpkb8rT+Hc6mxzauRZ0f9"+
                "c4ATia8D7dvAr6BSU65uVQWuuRaOBUOgAXNSGipukatNtaUPG+dHntBlEqlnu"+
                "c/kJjzWQ52mYb0D4vh3CkcJnd6n+cRD7098gyXbG2zcnQOC3BZT37gb3O2ooJ"+
                "ndHimsk7UMxIobLWIVIdLCHBMm++eEIAuVUKXn/mUrg6wPPfcmTbejvFG6LNz"+
                "TPVUH2rRcITjoUENfuYJB+FaJiuANURObrhmf6LpfBNFU/cguxrJbJfJVnJeb"+
                "mfWTxRDOmUEDHakOHNwoQQ4iHeFyEa46P2cxmu9yTbyKk6pkpoyUfZeC6uvUx"+
                "c9Kk74rEZILDJK0c0VoCqTzdBd8VOEWa1e0Jef9py3iCNkrc5YCl9G9eGaCO1"+
                "8ql0oaOi8XyUTxQh6vFZDWEIXHZTHWEj/KFU8AbSwe1LRrDiRAWjhmxfDbBDi"+
                "oYywR9KQeFgBpiSg5GEEEJO3j+UxBtIh935g6mIUAeYD1ftYdgB9V+qQBspZP"+
                "fGoXgkCyzl6d6VSwnI1sAmL23hmzQHpGQ41/EqbaRQauGi1MJFqokD2kiBec/"+
                "lgFNPxl0Xt6Bm74ECcxrKP/BBGykcrXYNtQMEYzdQauGCZ76K5OeXpmgjBSIg"+
                "O5wgblVkp1+D523aSOGYdP+5tRus57933pN06NLxYAAAAABJRU5ErkJggg==')"
            }
        }
    };


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class. */
    
    var init = function(){
        
        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;
        
        
      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;
        
        
      //Watch for drag and drop events
        parent.addEventListener('dragover', onDragOver, false);
        parent.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();

            var files = e.dataTransfer.files;
            for (var i=0; i<files.length; i++) {
                var file = files[i];

                if (!file.type.match('image.*')) continue;     

                var reader = new FileReader();
                reader.onload = (function(f) {
                    return function(e) {

                        createThumbnail(f, e.target.result);

                    };
                })(file);
                reader.readAsDataURL(file);


                /*
                output.push('<li><strong>', escape(file.name), '</strong> (', file.type || 'n/a', ') - ',
                          file.size, ' bytes, last modified: ',
                          file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a',
                          '</li>');
                          */
            }


        }, false);        
        
        
        
        
      //Create groups used to hold images of different sizes
        var sizes = config.sizes;
        for (var i=0; i<sizes.length; i++){
            var size = sizes[i];
            createImageGroup(size, size);
        }
    };


    var createImageGroup = function(width, height){
        
        var size = width + "x" + height;
        if (groups[size]) return;
        
        var outerDiv = document.createElement('div');
        outerDiv.style.display = "none";
        outerDiv.style.visibility = "hidden";

        var h2 = document.createElement('h2');
        h2.innerHTML = size;
        h2.style.cursor = "pointer";
        h2.onclick = function(){
            var size = this.innerHTML;
            var images = groups[size].images;
            createSprite(images, size);
        };
        outerDiv.appendChild(h2);

        var innerDiv = document.createElement('div');
        outerDiv.appendChild(innerDiv);


        parent.appendChild(outerDiv);
        groups[size] = {
            outerDiv: outerDiv,
            innerDiv: innerDiv,
            images: []
        };
    };

    
  //**************************************************************************
  //** createSprite
  //**************************************************************************
  /** Used to create a sprite from an array of images and a given image size.
   */
    var createSprite = function(images, size){

      //Show mask
        if (mask) mask.show();
        else{
            mask = createMask(body);
            mask.show();
        }


      //Create form data
        var formData = new FormData();
        formData.set("tilesize", size);
        formData.set("total", images.length);


      //Add images
        for (var i=0; i<images.length; i++){
            var image = images[i];
            var name = image.title;
            var type = image.file.type;
            var data = image.src;
            
            data = data.substring(("data:" + type + ";base64,").length);
            var blob = base64ToBlob(data, type);
            
            formData.append(name, blob);
        }
      
      //Upload form data
        upload(formData);
    };
    
    var upload = function(formData){
        var request = new XMLHttpRequest();
        request.open('POST', '/upload/', true);
        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status===200){

                    var sprite = JSON.parse(request.responseText);
                    
                    if (!popup) popup = createWindow(body);
                    popup.setTitle("Download Sprite");
                    popup.setImage(sprite.image);
                    popup.setCSS(sprite.css);
                    
                    formData.set("rows", sprite.rows);
                    formData.set("columns", sprite.columns);
                    popup.update(formData);
                    
                    popup.show();
                }
                else{
                    alert("Error!");
                    if (mask) mask.hide();
                }
            }
        };
        
        request.send(formData);
    };
    

  //**************************************************************************
  //** importSprite
  //**************************************************************************
  /** Public method used to initiate the import process. 
   */
    this.importSprite = function(){
        
        if (mask) mask.show();
        else{
            mask = createMask(body);
            mask.show();
        }
        
        if (!popup) popup = createWindow(body);
        popup.setTitle("Import Sprite");
        popup.setImage(null);
        popup.setCSS(null);
        popup.show();
    };
    
    
  //**************************************************************************
  //** importSprite
  //**************************************************************************
  /** Used to process form inputs from the import dialog. If successful, the
   *  server will split the sprite into multiple images. This function will 
   *  render the images on the main page and close the import dialog.
   */
    var importSprite = function(formData){
        
        var request = new XMLHttpRequest();
        request.open('POST', '/import/', true);
        request.onreadystatechange = function(){
            if (request.readyState === 4) {
                if (request.status===200){

                    var arr = JSON.parse(request.responseText);
                    for (var i=0; i<arr.length; i++) {
                        var icon = arr[i];
                        var name = icon.name;
                        var width = icon.width;
                        var height = icon.height;
                        createImageGroup(width, height);
                        
                            
                      //Convert Base64 image to a file. Credit:
                      //https://stackoverflow.com/a/16972036/
                        var img_b64 = icon.data;
                        var png = img_b64.split(',')[1];

                        var file = new Blob([window.atob(png)],  {type: 'image/png', encoding: 'utf-8'});
                        file.name = name;


                      //Read the file and create thumbnail. Note that we're 
                      //using an anonymous function because we are in a loop
                      //and the FielReader.onload() event is asynchronous.
                        (function(f) {

                            var reader = new FileReader();
                            reader.onload = function(e) {
                                var v = e.target.result.split(',')[1]; // encoding is messed up here, so we fix it
                                v = atob(v);
                                var good_b64 = btoa(decodeURIComponent(escape(v)));
                                var src = "data:image/png;base64," + good_b64;
                                createThumbnail(f, src);
                            };
                            reader.readAsDataURL(f);  

                        })(file);
                        
                    }
                    
                    
                    popup.close();
                }
                else{
                    alert("Error!");
                    mask.hide();
                    
                }
            }
        };
        
        request.send(formData);
    };
    
    
    
  //**************************************************************************
  //** createWindow
  //**************************************************************************
    var createWindow = function(parent){

        var tbody = createTable();
        var table = tbody.parentNode;


      //Image row
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var col1 = document.createElement("td");
        tr.appendChild(col1);
        var div = document.createElement("div");
        setStyle(div, "sprite");
        div.style.overflow = "hidden";
        col1.appendChild(div);
        col1 = div;
        
      //CSS row
        tr = document.createElement('tr');
        tbody.appendChild(tr);
        var col2 = document.createElement("td");
        col2.style.width = "100%";
        col2.style.height = "100%";
        tr.appendChild(col2);


      //Footer row
        tr = document.createElement('tr');
        tbody.appendChild(tr);
        var col3 = document.createElement("td");
        col3.style.width = "100%";
        tr.appendChild(col3);
        var inputs = createFooter(col3);
        var rows = inputs["rows"];
        var columns = inputs["columns"];
        var refresh = inputs["refresh"];
        
        
      //Import button (hidden)
        tr = document.createElement('tr');
        tbody.appendChild(tr);
        var col4 = document.createElement("td");
        col4.style.width = "100%";
        col4.style.textAlign = "right";
        col4.style.paddingTop = "3px";
        col4.style.display = "none";
        col4.style.visibility = "hidden";
        tr.appendChild(col4);
        var importButton = document.createElement("input");
        importButton.type = "button";
        importButton.className = "form-button"; //TODO: Key off config
        importButton.value = "Import";
        col4.appendChild(importButton);        
        
        
        
      //Create window
        var window = new javaxt.dhtml.Window(parent, {
            //width: 450,
            height: 600,
            body: table
        });

        
      //Create custom function to setImage
        window.setImage = function(image, file){
            col1.innerHTML = "";
            if (image){
                var img = document.createElement('img');
                img.src = image;
                img.file = file;
                col1.appendChild(img);
            }
            else{
                
                
              //Importer
                var div = document.createElement('div');
                div.style.width = "100%";
                div.style.height = "100%";
                div.innerHTML = "Drop sprite here";
                col1.appendChild(div);
                div.addEventListener('dragover', onDragOver, false);
                div.addEventListener('drop', function(e) {
                    e.stopPropagation();
                    e.preventDefault();

                    var files = e.dataTransfer.files;
                    var file = files[0];

                    if (file.type.match('image.*')){  

                        var reader = new FileReader();
                        reader.onload = (function(f) {
                            return function(e) {
                                var src = e.target.result;
                                window.setImage(src, f);
                            };
                        })(file);
                        reader.readAsDataURL(file);
                        
                    }
                    
                }, false); 

            }
        };
        
        
      //Create custom function to setCSS
        window.setCSS = function(css){
            col2.innerHTML = "";
            var txt = document.createElement('textarea');
            setStyle(txt, "textarea");
            txt.style.width = "99%";
            txt.style.height = "99%";
            txt.style.resize = "none";
            
            if (css){ //Render the CSS
                txt.value = css;
                col3.style.display = "";
                col3.style.visibility = "";
                col4.style.display = "none";
                col4.style.visibility = "hidden";
            }
            else{
                
              //If CSS is null then we are importing a sprite
                txt.value = "";
                col3.style.display = "none";
                col3.style.visibility = "hidden";
                col4.style.display = "";
                col4.style.visibility = "";

                importButton.onclick = function(){
                    var formData = new FormData();
                    formData.append("css", txt.value);
                    
                    var image = col1.childNodes[0];
                    var type = image.file.type;
                    var data = image.src;

                    data = data.substring(("data:" + type + ";base64,").length);
                    var blob = base64ToBlob(data, type);

                    formData.append("sprite", blob);                    
                    
                    importSprite(formData);
                };
            }
            col2.appendChild(txt);
        };
        
        
      //Create custom function. Called when the sprite is generated
        window.update = function(formData){
            rows.value = formData.get("rows");
            columns.value = formData.get("columns");
            var total = formData.get("total");
            
            var _upload = function(){
                formData.set("rows", parseInt(rows.value));
                formData.set("columns", parseInt(columns.value));
                upload(formData);                
            };
            
            rows.onchange = function(){
                var val = parseInt(this.value);
                columns.value = Math.ceil(total/val);
                _upload(formData);
            };
            rows.onkeyup=function(e){
                this.onchange();
            };
            
            columns.onchange = function(){
                var val = parseInt(this.value);
                rows.value = Math.ceil(total/val);
                _upload(formData);
            };            
            columns.onkeyup=function(e){
                this.onchange();
            };
            
            refresh.onclick = _upload;
        };
        

        
        window.onClose = function(){
            if (mask) mask.hide();
        };
        
        return window;
    };
    
    
    
  //**************************************************************************
  //** createFooter
  //**************************************************************************
    var createFooter = function(parent){
        
        var tbody = createTable();
        var table = tbody.parentNode;
        parent.appendChild(table);

        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        
        var td, input;
        
      //Create column label
        td = document.createElement("td");
        td.innerHTML = "Columns";
        tr.appendChild(td);
      
      
      //Create column input
        td = document.createElement("td");
        input = document.createElement("input");
        input.type = "text";
        input.name = "columns";
        var colInput = input;
        setStyle(input, "input");
        td.appendChild(input);
        tr.appendChild(td);        
        
        
      //Create row label  
        td = document.createElement("td");
        td.innerHTML = "Rows";
        tr.appendChild(td);


      //Create row input
        td = document.createElement("td");
        input = document.createElement("input");
        input.type = "text";
        input.name = "rows";
        var rowInput = input;
        setStyle(input, "input");
        td.appendChild(input);
        tr.appendChild(td);
        
        
      //Create refresh button
        td = document.createElement("td");
        var div = document.createElement("div");
        setStyle(div, "refeshButton");
        td.appendChild(div);
        tr.appendChild(td);

        
        return {
            rows: rowInput,
            columns: colInput,
            refresh: div
        };
    };
    
    
    
  //**************************************************************************
  //** createMask
  //**************************************************************************
  /** Creates the main panel for the calendar app
   */
    var createMask = function(parent){
        var mask = document.createElement('div');
        mask.style.width = "100%";
        mask.style.height = "100%";
        mask.style.position = "absolute";
        mask.style.top = 0;
        mask.style.left = 0;
        mask.style.background = "rgba(9, 57, 88, 0.65)";
        mask.style.zIndex = 1;
        mask.style.visibility = "hidden";
        parent.appendChild(mask);
        
        
        mask.show = function(){
            mask.style.visibility = "visible";
        };
        
        mask.hide = function(){
            mask.style.visibility = "hidden";
        };
                
        
        return mask;
    };
    
    
  //**************************************************************************
  //** createThumbnail
  //**************************************************************************
  /** Used to create a single thumnail image/tile for a given image. The image
   *  will be inserted into an image group based that corresponds to its
   *  dimensions.
   */
    var createThumbnail = function(file, src){


      //Check whether we have already rendered the image
        for (var size in groups){
            if (groups.hasOwnProperty(size)){
                var images = groups[size].images;
                for (var i=0; i<images.length; i++){
                    if (images[i].src===src) return;
                }
            }
        }
        

      //Create outer div
        var outerDiv = document.createElement('div');        
        outerDiv.style.position = "relative";
        outerDiv.style.display = "inline-block";
        outerDiv.style.margin = "10px";
        parent.appendChild(outerDiv);
        

      //Create overflow divs for the image
        var div = document.createElement('div');
        setStyle(div, "thumbnail");
        div.style.position = "relative";
        //div.style.display = "inline-block";
        outerDiv.appendChild(div);
        
        var innerDiv = document.createElement('div');
        innerDiv.style.width = "100%";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.overflow = "hidden";
        div.appendChild(innerDiv);
        

      //Create table for the thumbnail image (for vertical alignment)
        var tbody = createTable();
        var table = tbody.parentNode;
        table.appendChild(tbody);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        td.style.textAlign = "center";
        tr.appendChild(td);
        innerDiv.appendChild(table);
        
        
      //Insert image
        var img = document.createElement('img');
        img.onload = function() {
            
            var w = this.offsetWidth;
            var h = this.offsetHeight;
            

          //Find group with the exact width and height
            var group;
            for (var size in groups){
                if (groups.hasOwnProperty(size)){
                    if (size == (w+"x"+h)){
                        group = groups[size];
                        break;
                    }
                }
            }
            
            
          //Find group that we can fit into
            if (!group){
                
                var m = Math.max(w,h);
                var s = 0;
                
                var sizes = config.sizes;
                for (var i=0; i<sizes.length; i++){

                    var a = i===0 ? 0 : sizes[i-1];
                    var b = sizes[i];

                    if (m>a && m<=b){
                        s = b;
                        break;
                    }

                }
                
                if (s>0){
                    group = groups[s+"x"+s];
                }
            }
            
            
            if (!group){
                //TODO: Create group?
                alert("Image too big?");
            }

            
          //Remove thumbnail from its current/temporary location 
          //and insert it into the correct section
            var div = this.div;
            var parent = div.parentNode;
            parent.removeChild(div);
            
            var outerDiv = group.outerDiv;
            outerDiv.style.display = '';
            outerDiv.style.visibility = '';
            var innerDiv = group.innerDiv;
            innerDiv.appendChild(div);
            group.images.push(this);
            
        };
        img.div = outerDiv;
        img.file = file;
        td.appendChild(img);
        img.src = src; 
        
        
      //Create file name/input 
        var div = document.createElement('div');
        outerDiv.appendChild(div);
        var fileName = file.name;
        var idx = fileName.lastIndexOf(".");
        if (idx>0){ //i.e. not an image from imported sprite
            fileName = fileName.substring(0, fileName.lastIndexOf("."));
            fileName += "Icon";
        }
        
        var input = document.createElement('input');
        input.type = "text";
        input.name = "name";
        input.value = img.title = fileName;
        setStyle(input, "label");
        div.appendChild(input);
        
        
        input.onchange = (function(image) {
            return function(e) {
                image.title = this.value.replace(/^\s*/, "").replace(/\s*$/, ""); //trim
            };
        })(img);
        
    };

    
    
  //**************************************************************************
  //** base64ToBlob
  //**************************************************************************
    var base64ToBlob = function(base64, mime) {
        
        mime = mime || '';
        var sliceSize = 1024;
        var byteChars = window.atob(base64);
        var byteArrays = [];

        for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
            var slice = byteChars.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, {type: mime});
    };



  //**************************************************************************
  //** onDragOver
  //**************************************************************************
  /** Called when the client drags a file over the parent.
   */
    var onDragOver = function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    };
    
    
    
  //**************************************************************************
  //** createTable
  //**************************************************************************
    var createTable = function(){
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.cellPadding = 0;
        table.style.width = "100%";
        table.style.height = "100%";
        table.style.borderCollapse = "collapse";
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        return tbody;
    };


  //**************************************************************************
  //** setStyle
  //**************************************************************************
  /** Used to set the style for a given element. Styles are defined via a CSS 
   *  class name or inline using the config.style definitions. 
   */
    var setStyle = function(el, style){
        
        style = config.style[style];
        if (style===null) return;
        
        
        el.style = '';
        el.removeAttribute("style");
        
        
        if (typeof style === 'string' || style instanceof String){
            el.className = style;
        }
        else{    
            for (var key in style){
                var val = style[key];
                if (key==="content"){
                    el.innerHTML = val;
                }
                else{
                    el.style[key] = val;
                    if (key==="transform"){
                        el.style["-webkit-" +key] = val;
                    }
                }
            }
        }
    };



  //**************************************************************************
  //** merge
  //**************************************************************************
  /** Used to merge properties from one json object into another. Credit:
   *  https://github.com/stevenleadbeater/JSONT/blob/master/JSONT.js
   */
    var merge = function(settings, defaults) {
        for (var p in defaults) {
            if ( defaults.hasOwnProperty(p) && typeof settings[p] !== "undefined" ) {
                if (p!=0) //<--Added this as a bug fix
                merge(settings[p], defaults[p]);
            }
            else {
                settings[p] = defaults[p];
            }
        }
    };

    
    init();
};