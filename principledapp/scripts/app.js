(function (global) {
   
    var app = global.app = global.app || {};
    
    app.photoFolder = 'PrincipledPhotos';
    
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };
    
    app.enableStatusOverlay = function()
    {
        if(typeof(StatusBar) != 'undefined') {
            StatusBar.overlaysWebView(true);
            StatusBar.backgroundColorByHexString("#000000");
            StatusBar.styleLightContent();
        }
    }
    
    app.disableStatusOverlay = function()
    {
        if(typeof(StatusBar) != 'undefined')
        {
            StatusBar.overlaysWebView(false);
            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#f4f4f4");
        }
            
    }

    document.addEventListener("deviceready", function () {
        
        //analytics.Start();
        
        app.application = new kendo.mobile.Application(document.body, { layout: "splash-layout", skin: "flat", useNativeScrolling: false, statusBarStyle: "black-translucent" });
        
        app.dbFunctions.director();
        
        //document.addEventListener("resign", function(){  analytics.Stop(); }, false);
    	//document.addEventListener("pause", function(){  analytics.Stop(); }, false);
    	//document.addEventListener("resume", function(){  analytics.Start(); }, false);
        
        
        //console.log('device ready');
        //if( ! app.loginService.viewModel.isLoggedIn('app.js')) app.application.navigate('#tabstrip-login');
        //else app.application.navigate('#tabstrip-home');
        
		
        
        if(typeof(window.requestFileSystem ) == 'function')
        {
           
            //navigator.webkitPersistentStorage.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
            //  window.requestFileSystem(PERSISTENT, grantedBytes, onFSSuccess, onFSFail);
            //}, function(e) {
            //  console.log('Error', e.code);
            // });
            
            //alert('requestFileSystem');
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onFSFail);
            
            
            
            
        }
        else if(typeof(window.webkitRequestFileSystem ) == 'function')
        {
            
            
            //alert('webkitRequestFileSystem');
            window.webkitRequestFileSystem(PERSISTENT, 1024*1024, onFSSuccess, onFSFail);
        }
 		
 		
        
        
        
    }, false);
    
    function onFSSuccess(fileSystem) {
      app.fileSystem = fileSystem;
        
        app.fileSystem.root.getDirectory( app.photoFolder,
           {create:true, exclusive: false},
           function(directory) {
               app.photoDirectory = directory;
           },
           app.Photo.dirError);
        
    }
    
    function onFSFail(e){ console.log('FS fail '+e.code); }
   
    
   
    
    
    
    app.checkNetwork = function(title)
    {
        var networkState = navigator.network.connection.type;
        if(typeof(title) == 'undefined') title = 'No connection';
        if(!app.isNetwork())
        {
            navigator.notification.alert("Please connect to Wifi, 3G or 4G.",
                                         function () { }, title, 'OK');
            return false;
        }
        
        return true;
    }
    
     app.isNetwork = function()
    {
        var networkState = navigator.network.connection.type;
        if(typeof(title) == 'undefined') title = 'Cannot update jobs';
        if(networkState != Connection.WIFI && networkState != Connection.CELL && networkState != Connection.CELL_3G && networkState != Connection.CELL_4G && networkState != Connection.UNKNOWN)
        {
            return false;
        }
        
        return true;
    }
    
    app.sync = function(target,source)
    {
        $(target).each(function(i,p){
            target[p] = source[p];
        });
        
        return target;
    }


})(window);