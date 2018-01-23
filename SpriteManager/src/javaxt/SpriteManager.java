package javaxt;
import com.steadystate.css.parser.CSSOMParser;
import javaxt.http.servlet.*;
import org.w3c.css.sac.InputSource;
import org.w3c.dom.css.CSSRule;
import org.w3c.dom.css.CSSRuleList;
import org.w3c.dom.css.CSSStyleDeclaration;
import org.w3c.dom.css.CSSStyleRule;
import org.w3c.dom.css.CSSStyleSheet;


public class SpriteManager extends HttpServlet {
    
    
    private javaxt.io.Directory web;
    private String[] welcomeFiles = new String[]{"index.html", "index.htm", "default.htm"};
    
    
  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public SpriteManager(){
        java.io.File jarFile = new javaxt.io.Jar(SpriteManager.class).getFile();
        if (jarFile.getParentFile().getName().equals("dist")){
            web = new javaxt.io.Directory(jarFile.getParentFile().getParentFile() + javaxt.io.Directory.PathSeparator + "web");
        }        
        else{
            web = new javaxt.io.Directory(jarFile.getParentFile() + javaxt.io.Directory.PathSeparator + "web");
        }
    }
    
    
  //**************************************************************************
  //** Main
  //**************************************************************************
  /** Entry point for the application 
   */
    public static void main(String[] arr) { 
        java.util.HashMap<String, String> args = parseArgs(arr);
        try {
            
          //Start server
            int port = args.containsKey("-p") ? Integer.parseInt(args.get("-p")) : 9080;
            int numThreads = 50;
            javaxt.http.Server server = new javaxt.http.Server(port, numThreads, new SpriteManager());
            server.start();
            
            
          //Open browser
            if (java.awt.Desktop.isDesktopSupported()){
                String url = "http://localhost:" + port + "/";
                java.awt.Desktop.getDesktop().browse(new java.net.URI(url));        
            }
            
        }
        catch (Exception e) {
            System.out.println("Server could not start because of an " + e.getClass());
            System.exit(1);
        }
    }
    
    
  //**************************************************************************
  //** processRequest
  //**************************************************************************
  /** Used to process http get and post requests. 
   */
    public void processRequest(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, java.io.IOException {   
        
        
      //Extract path from the url
        javaxt.utils.URL url = new javaxt.utils.URL(request.getURL());
        String path = url.getPath();
        if (path==null || path.length()==1) path = "";
        else path = path.substring(1);  

        
        
      //Send response
        if (request.getMethod().equals("POST")){
            
          //Get service name 
            String service = path.toLowerCase();
            if (service.contains("/")) service = service.substring(0, service.indexOf("/"));            

            
          //Process service request
            if (service.equals("upload")){
                generateSprite(request, response);
            }
            else if (service.equals("import")){
                importSprite(request, response);
            }
        }
        else{
            
          //Send file
            getFile(path, response);
        }
    }
    
        
  //**************************************************************************
  //** getFile
  //**************************************************************************
  /** Used to retrieve a local file and return it to the client. The file path
   *  is derived from the requested url.
   */
    private void getFile(String path, HttpServletResponse response)
        throws java.io.IOException{

        
        
      //Construct a list of possible file paths
        java.util.ArrayList<String> files = new java.util.ArrayList<>();
        files.add(web + path);
        if (path.length()>0 && !path.endsWith("/")) path+="/";
        for (String welcomeFile : welcomeFiles){
            files.add(web + path + welcomeFile);
        }

        
      //Loop through all the possible file combinations
        for (String str : files){

          //Ensure that the path doesn't have any illegal directives
            str = str.replace("\\", "/");
            if (str.contains("..") || str.contains("/.")){
                continue;
            }



          //Send file if it exists
            java.io.File file = new java.io.File(str);
            if (file.exists() && file.isFile() && !file.isHidden()){
                
                response.write(file, javaxt.io.File.getContentType(file.getName()), true);
                return;
            }
        }
        
        
      //If we're still here, return an error
        response.setStatus(404);

    }

    
  //**************************************************************************
  //** generateSprite
  //**************************************************************************
    private void generateSprite(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, java.io.IOException {
        
        
        Integer width = null;
        Integer height = null;
        Integer rows = null;
        Integer columns = null;
        java.util.TreeMap<String, javaxt.io.Image> images = new java.util.TreeMap<>();
        
        java.util.Iterator<FormInput> it = request.getFormInputs();
        while (it.hasNext()){
            FormInput input = it.next();
            String name = input.getName();
            FormValue value = input.getValue();
            if (input.isFile()){
                images.put(name, new javaxt.io.Image(value.getInputStream()));
            }
            else{
                if (name.equalsIgnoreCase("tileSize")){ 
                    String tileSize = value.toString().toLowerCase().trim();
                    int idx = tileSize.indexOf("x");
                    if (idx==-1){
                        width = value.toInteger();
                        height = value.toInteger();
                    }
                    else{
                        width = Integer.parseInt(tileSize.substring(0, idx));
                        height = Integer.parseInt(tileSize.substring(idx+1));
                    }
                }
                else if (name.equalsIgnoreCase("rows")) rows = value.toInteger();
                else if (name.equalsIgnoreCase("columns")) columns = value.toInteger();
            }
        }
        
        
        if (width==null || height==null){ 
            response.sendError(500, "Invalid tile size");
            return;
        }
        
        int numImages = images.size();
        if (numImages==1){ 
            response.sendError(500, "More than 1 image is required");
            return;
        }
        
        
        javaxt.io.Image sprite;
        StringBuffer css = new StringBuffer();
        java.util.Iterator<String> i2 = images.keySet().iterator();
        int padding = 2;
        
        
        
      //Generate CSS
        while (i2.hasNext()){
            String imageName = i2.next();
            css.append("." + imageName);
            if (i2.hasNext()){
                css.append(", ");
            }
            else{
                css.append(" {\r\n");
                css.append("    background: transparent url('');\r\n");
                css.append("    background-repeat: no-repeat;\r\n");
                css.append("    width: " + width + "px;\r\n");
                css.append("    height: " + height + "px;\r\n");
                css.append("}\r\n");
            }
        }
        i2 = images.keySet().iterator();
        
        
        
      //Calculate number of rows and columns as needed
        if (rows==null || columns==null){
        
            if (numImages<9){ //Horizontally align images

                rows = 1;
                columns = numImages;
                
                /*
                sprite = new javaxt.io.Image((tileSize+(padding*2))*numImages, tileSize+(padding*2));


                int xOffset = padding;
                int yOffset = padding;
                while (i2.hasNext()){
                    String imageName = i2.next();
                    javaxt.io.Image image = images.get(imageName);
                    addImage(image, imageName, xOffset, yOffset, tileSize, sprite, css);
                    xOffset += ((tileSize) + (padding*2));
                }
                */

            }
            else{ 

                //https://stackoverflow.com/a/4107092/777443
                rows = (int)Math.sqrt(numImages);
                columns = (int)Math.ceil(numImages / (float)rows);

            }
        }


      //Create sprite
        sprite = new javaxt.io.Image((width+(padding*2))*columns, (height+(padding*2))*rows);

        
      //Add images to the sprite
        int yOffset = padding;
        for (int i=0; i<rows; i++){

            int xOffset = padding;
            for (int j=0; j<columns; j++){
                if (i2.hasNext()){
                    String imageName = i2.next();
                    javaxt.io.Image image = images.get(imageName);


                    addImage(image, imageName, xOffset, yOffset, width, height, sprite, css);
                    xOffset += ((width) + (padding*2));
                }
            }

            yOffset += ((height) + (padding*2));
        }
        
        
        
      //Generate JSON response
        StringBuffer str = new StringBuffer("{");
        
        str.append("\"image\": \"");
        String outputFormat = "image/png";
        str.append("data:" + outputFormat + ";base64,"); str.append(javaxt.utils.Base64.encodeBytes(sprite.getByteArray(outputFormat)).replace("\n","\\n"));
        str.append("\",");
        
        str.append("\"css\": \"");
        str.append(css.toString().replace("\r\n","\\n"));
        str.append("\",");
        
        
        str.append("\"rows\": ");
        str.append(rows);
        str.append(",");

        str.append("\"columns\": ");
        str.append(columns);
    
        
        str.append("}");
        
        
      //Send response
        response.setContentType("application/json");            
        response.write(str.toString());
    }
    
    
    
  //**************************************************************************
  //** addImage
  //**************************************************************************
    private void addImage(javaxt.io.Image image, String imageName, int xOffset, int yOffset, int width, int height, javaxt.io.Image sprite, StringBuffer css){
        
        if (image.getWidth()==width && image.getHeight()==height){
            sprite.addImage(image, xOffset, yOffset, false);
        }
        else{

          //TODO: Center the image
            sprite.addImage(image, xOffset, yOffset, false);
        }

        css.append("." + imageName + " {\r\n");
        css.append("    background-position: "  + (-xOffset) + "px " + (-yOffset) + "px;\r\n");
        //css.append("    background: transparent url(###PATH_TO_IMAGE###) " + xOffset + "px " + (-yOffset) + "px;\r\n");
        //css.append("    width: " + tileSize + "px;\r\n");
        //css.append("    height: " + tileSize + "px;\r\n");
        css.append("}\r\n");
        
    }
    
    
    
  //**************************************************************************
  //** importSprite
  //**************************************************************************
    private void importSprite(HttpServletRequest request, HttpServletResponse response)
    throws ServletException, java.io.IOException {
        
        
      //Get sprite image and CSS from the form inputs
        javaxt.io.Image sprite = null;
        String css = null;
        java.util.Iterator<FormInput> it = request.getFormInputs();
        while (it.hasNext()){
            FormInput input = it.next();
            String name = input.getName();
            FormValue value = input.getValue();
            if (input.isFile()){
                sprite = new javaxt.io.Image(value.getInputStream());
            }
            else{
                if (name.equalsIgnoreCase("css")) css = value.toString();
            }
        }
        if (css==null){
            response.sendError(500, "CSS is required");
            return;
        }
        if (sprite==null){
            response.sendError(500, "Sprite is required");
            return;
        }   
        

        
        
      //Parse CSS
        java.util.HashMap<String, java.util.HashMap<String, String>> icons = new 
        java.util.HashMap<String, java.util.HashMap<String, String>>();
        InputSource source = new InputSource(new java.io.StringReader(css));
        CSSOMParser parser = new CSSOMParser();
        CSSStyleSheet stylesheet = parser.parseStyleSheet(source, null, null);
        CSSRuleList ruleList = stylesheet.getCssRules();
        if (ruleList.getLength()==0){ 
            response.sendError(500, "Failed to parse CSS");
            return;
        }
        for (int i=0; i<ruleList.getLength(); i++) {
            CSSRule rule = ruleList.item(i);
            if (rule instanceof CSSStyleRule){

                CSSStyleRule styleRule = (CSSStyleRule) rule;
                for (String tag : styleRule.getSelectorText().split(",")){
                    tag = tag.trim();

                    CSSStyleDeclaration styleDeclaration = styleRule.getStyle();
                    for (int j = 0; j < styleDeclaration.getLength(); j++) {
                        String property = styleDeclaration.item(j);
                        String value = styleDeclaration.getPropertyCSSValue(property).getCssText();


                        java.util.HashMap<String, String> props = icons.get(tag);
                        if (props==null){
                            props = new java.util.HashMap<String, String>();
                            icons.put(tag, props);
                        }

                        if (property.equalsIgnoreCase("background")){
                            java.util.HashMap<String, String> background = parseBackground(value);
                            java.util.Iterator<String> i2 = background.keySet().iterator();
                            while (i2.hasNext()){
                                String key = i2.next();
                                String val = background.get(key);
                                props.put(key, val);
                            }
                        }
                        else{
                            props.put(property, value);
                        }
                    }

                }
            }
        }





      //Extract individual images from the sprite
        java.util.TreeMap<String, javaxt.io.Image> images = new java.util.TreeMap<>();
        java.util.Iterator<String> iconIterator = icons.keySet().iterator();
        while (iconIterator.hasNext()){
            String iconName = iconIterator.next();
            java.util.HashMap<String, String> props = icons.get(iconName);

            Integer width = null;
            Integer height = null;
            Integer xOffset = null;
            Integer yOffset = null;

            String backgroundPosition = props.get("background-position");
            if (backgroundPosition!=null){
                String[] arr = backgroundPosition.trim().split(" ");
                xOffset = Integer.parseInt(arr[0].replace("px", ""));
                yOffset = Integer.parseInt(arr[1].replace("px", ""));
            }

            String w = props.get("width");
            if (w!=null) width = Integer.parseInt(w.replace("px", ""));

            String h = props.get("height");
            if (h!=null) height = Integer.parseInt(h.replace("px", ""));

            if (width!=null && height!=null && xOffset!=null && yOffset!=null){
                javaxt.io.Image icon = sprite.copyRect(-xOffset, -yOffset, width, height);

                if (iconName.startsWith("*.")){
                    iconName = iconName.substring(2);
                }
                else if (iconName.startsWith("*#")){
                    iconName = iconName.substring(2);
                }
                else if (iconName.startsWith(".")){
                    iconName = iconName.substring(1);
                }
                else{
                    //?
                }                    

                //icon.saveAs("/temp/sprites/" + iconName + ".png");
                images.put(iconName, icon);


            }
        }



      //Generate JSON output
        String outputFormat = "image/png";
        StringBuffer str = new StringBuffer("[");
        java.util.Iterator<String> imageIterator = images.keySet().iterator();
        while (imageIterator.hasNext()){

            String iconName = imageIterator.next();
            javaxt.io.Image image = images.get(iconName);

            
            str.append("{");
            str.append("\"name\": \"" + iconName + "\",");
            str.append("\"width\": " + image.getWidth() + ",");  
            str.append("\"height\": " + image.getHeight()+ ",");
            str.append("\"data\": \"");
            str.append("data:" + outputFormat + ";base64,"); 
            str.append(javaxt.utils.Base64.encodeBytes(image.getByteArray(outputFormat)).replace("\n","\\n"));
            str.append("\"");
            str.append("}");
            
            if (imageIterator.hasNext()) str.append(","); 
        }
        str.append("]");
        
        
            
      //Send response
        response.setContentType("application/json");            
        response.write(str.toString());            
    }    
    
    
  //**************************************************************************
  //** parseBackground
  //**************************************************************************
  /** Converts command line inputs into key/value pairs. */
    private static java.util.HashMap<String, String> parseBackground(String str){
        
        java.util.HashMap<String, String> props = new java.util.HashMap<String, String>();
        
        String[] arr = str.split(" ");
        for (int i=0; i<arr.length; i++){
            String prop = arr[i].trim();
            if (prop.length()==0) continue;
            
            if (prop.toLowerCase().startsWith("url")){
                props.put("background-image", prop);
            }
            
            if (prop.toLowerCase().endsWith("px") && !props.containsKey("background-position")){
                
                String x = prop;
                i++;
                prop = arr[i].trim();
                String y = prop;
                int idx = y.indexOf("/");
                if (idx>-1){
                    y = y.substring(0, idx).trim();
                }
                
                props.put("background-position", x + " " + y);
            }
        }

        return props;
    }
    
    
  //**************************************************************************
  //** parseArgs
  //**************************************************************************
  /** Converts command line inputs into key/value pairs. */

    private static java.util.HashMap<String, String> parseArgs(String[] args){
        java.util.HashMap<String, String> map = new java.util.HashMap<String, String>();
        for (int i=0; i<args.length; i++){
            String key = args[i];
            if (key.startsWith("-")){
                if (i<args.length-1){
                    String nextArg = args[i+1];
                    if (nextArg.startsWith("-")){
                        map.put(key, null);
                    }
                    else{
                        i++;
                        map.put(key, nextArg);
                    }
                }
                else{
                    map.put(key, null);
                }
            }
        }
        return map;
    }
    
    
}