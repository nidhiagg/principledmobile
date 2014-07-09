app.Upload = {
    
    queue: [],
   
    run: function(surveyKey,filename,callback)
    {
        
        var self = this;
        
        if(!app.checkNetwork()) return false;
        
        var photoDir = app.photoDirectory.toURL();
        var photoPath = photoDir+'/'+filename;
        
        var tmpKey = surveyKey.split('_');
        var job_id = tmpKey[0];
        var type = tmpKey[1];
       
        
        var options = new FileUploadOptions();
        options.fileKey = type+"_pics_file";
        options.fileName = photoPath.substr(photoPath.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        
        options.headers = { Connection: "close" };
        options.chunkedMode = false;
        
        var params = {};
        params.ut = app.loginService.viewModel.get("token");
        params.ak = app.dbFunctions.ak;
        params.sk = surveyKey;
        options.params = params;
        
        //console.log(options);
        // debug code start
        /*
        window.resolveLocalFileSystemURI(photoPath,
            	function(entry)
           		{
               		//entry.remove();
                    alert('found '+photoPath);
                    
             	},
                function()
                { 
                	alert(photoPath+' not found');
                }
        	); 
        
        $('#sync-all-btn').text('Save all jobs');
        return false;
        // debug code end
       */
        
        var ft = new FileTransfer();
        ft.upload(photoPath, encodeURI("http://jobs.principled.uk.com/api/upload/"), callback, self.fail, options);
    },
    
    runQueue: function()
    {
        
        var self = this;
        
        if(this.queue.length > 0)
        {
            var item = this.queue[0];
            
            var left = this.queue.length;
            
            $('#sync-all-btn').text('Uploading photos... '+left  );
            
            app.Upload.run(
                item.key,
                item.filename,
                function(r) // success, delete file and run next item in a queue
            	{
                               
                    var response = JSON.parse(r.response);

                    setTimeout(function(){
                        
                        console.log("Response = " + r.response);
                    	console.log("Sent = " + r.bytesSent);
                        
                        app.Photo.trash(response.filename,response.sk,function(){
                            
                            self.queue.splice(0,1);
                        	self.runQueue();
                            
                        });
                        
                        
                    },1000);
        
                    //console.log("Code = " + r.responseCode);

           		},
            	function(r) // fail, abort uploads
                {
                    $('#sync-all-btn').text('Save all jobs');
                }
            
            );
            
            
        }
        else
        {
            //app.dbFunctions.fetchJobs(true);
            fetchData();
            $('#sync-all-btn').text('Save all jobs');
            
        }

	},
    
    win: function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    },
    
    fail: function (error) {
        alert("Upload error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
        console.log(error);
        app.Upload.queue = [];
    }
    
   
    
};