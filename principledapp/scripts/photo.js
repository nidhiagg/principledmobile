app.Photo = {
    
    capture: function()
    {
    	navigator.camera.getPicture(app.Photo.onPhotoSuccess, app.Photo.onPhotoFail, {
            quality: 49,
            targetWidth: 1200,
  			targetHeight: 900,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true
        });
    },
    
    
    onPhotoSuccess: function(imageURI) {
        window.resolveLocalFileSystemURI(imageURI, app.Photo.onResSuccess, app.Photo.resOnError);
    },
    
    onPhotoFail: function(message) {
        console.log('Failed because: ' + message);
    },

    
    
    //Callback function when the file system uri has been resolved
    moveFile: function(entry){
  
        var d = new Date();
        var n = d.getTime();
        
        //new file name
        var newFileName = n + ".jpg";
        var myFolderApp = app.photoFolder;
        var self = this;
        
        
    
        app.fileSystem.root.getDirectory( myFolderApp,
           {create:true, exclusive: false},
           function(directory) {
               entry.moveTo(directory, newFileName,  app.Photo.successMove, app.Photo.moveError);
           },
           app.Photo.dirError);
        
    },
    
    //Callback function when the file has been moved successfully - inserting the complete path
    successMove: function(entry) {
        
        var key = app.Job.surveyKey();
        
        app.pictures.get(key,function(obj)
        {
            
            var data = {};
            var photos;
            
            if(obj !== null)
            {
                obj.value.photos.push(entry.name);
                photos = obj.value.photos;
            }
            else
            {
                photos = [entry.name];
            }
            
            
            data.type = app.currentSurveyType;
            data.photos = photos;
            
            app.pictures.save({ key: key, value: data },'showSurveyPictures()');
            
        });
        
    },
    
    
    trash: function(filename,key,callback)
    {
        
        var photoDir = app.photoDirectory.toURL();
        var photoPath = photoDir+'/'+filename;
        
        console.log('trashing filename: '+filename+' key:'+key);
       	//alert('trashing filename: '+filename+' key:'+key);
        //return false;
        
        
        app.pictures.get(key,function(obj){
            
           	var reducedItems = $.grep(obj.value.photos, function(value) {
              return value != filename;
            });
            
            
           obj.value.photos = reducedItems;
            
          
           window.resolveLocalFileSystemURI(photoPath,
            	function(entry)
           		{
               		entry.remove();
                    if(Object.size(app.currentJob) > 0) app.pictures.save({ key: key, value: obj.value },'showSurveyPictures()');
                    else app.pictures.save({ key: key, value: obj.value }, callback);
                    
             	},
                function(){ console.log('resolve for delete failed'); }
        	); 
        });
	},
    
    filenameToId: function(filename)
    {
        return filename.replace('.','_');
    },
    
    idToFilename: function(id)
    {
        return id.replace('_','.');
    },
    
    
    resOnError: function(error) {
        console.log('Resolve error '+error.code);
        console.log(error); 
    },
    
    onResSuccess: function(entry) {
        app.Photo.moveFile(entry);
    },
    
    moveError: function(error) {
        console.log('File move error '+error);
    },
    
    dirError: function(error) {
        console.log('Directory error '+error);
    },
    
    cleanupSuccess: function() {
        return false;
    },

	cleanupError: function(error) {
        console.log('Cleanup error '+error.code);
    }

}