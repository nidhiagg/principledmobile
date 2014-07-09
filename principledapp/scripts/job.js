(function (global) {
    var map,
        geocoder,
        JobViewModel,
        app = global.app = global.app || {};
    
    app.localJobs = [];
    app.jobs = [];
    app.currentJob = {};
    app.config = {};
    app.config.status = {
        "1":"quotation",
        "2":"active",
        "3":"live",
        "4":"closed",
        "5":"installed",
        "6":"exited",
        "7":"cancelled",
        "8":"on hold"
    };
    
    
    toRad = function(value)
    {
        return value * Math.PI / 180;
    }
    
    compareDistance = function(a, b){
   		return a.distance - b.distance;
	}
    
    app.Job = {
        
        surveyKey: function()
        {
            return app.currentJob.id+'_'+app.currentSurveyType;
        }
        
    }

    JobViewModel = kendo.data.ObservableObject.extend({
        _lastMarker: null,
        _isLoading: false,
        address: "",
        
        fetchJobs: function() {
           if(app.checkNetwork('Cannot reload jobs'))
           {
               app.dbFunctions.rebuildJobs();
               //app.dbFunctions.fetchJobs();
               
           }
            
        },
        
        getJobs: function() {
            app.dbFunctions.getJobs();
        },
        
        showJobs: function(tx, results)
        {
        	
           
            
            var len = results.rows.length;
        	var jobs = [];
  			var showReload = true;
            
            if(len > 0)
            {
                for (var i=0; i<len; i++)
        		{
        			var row = results.rows.item(i);
                    var job_data = JSON.parse(row.job_data);
                    job_data.is_sync = row.is_sync;
                    if(typeof(job_data.property_survey.data) == 'undefined' || (typeof(job_data.property_survey.data) == 'object' && typeof(job_data.property_survey.data.id) == 'undefined'))
                    {
                        job_data.next_survey = 'property';
                    }
                    else if(typeof(job_data.surveys.preuse) == 'undefined')
                    {
                        job_data.next_survey = 'pre-use';
                    }
                    else if(typeof(job_data.surveys.stockfill) == 'undefined')
                    {
                        job_data.next_survey = 'stock fill';
                    }
                    else if(typeof(job_data.surveys.exit) == 'undefined')
                    {
                        job_data.next_survey = 'exit';
                    }
                    else
                    {
                        job_data.next_survey = 'all done';
                    }
                    jobs.push(job_data);
                    if($.inArray( row.job_id, app.localJobs ) == -1)
                    {
                        app.localJobs.push(row.job_id);
                    }
                    // if at least one job is unsynced, do not show reload button
                    if(row.is_sync == 0) showReload = false;
                    
                }
            }
            
            if(showReload == false)
            {
                $('#reload-button').addClass('hidden');
            }
            else
            {
                 $('#reload-button').removeClass('hidden');
            }
            
            
        	var jobsObj = new kendo.data.DataSource({
            	data: jobs
            });
            
            app.jobs = jobs;
                        
            $("#jobsList").data("kendoMobileListView").setDataSource(jobsObj);
            
            showJobsList();
            app.application.navigate('#tabstrip-home');
            
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    
                    var my_location = {};
                    my_location.lat = position.coords.latitude;
                    my_location.lon = position.coords.longitude;
                    
                    $(jobs).each(function(i,j)
                    {
                        //console.log(j);
                        var job_location = {};
                    	job_location.lat = j.lat;
                    	job_location.lon = j.long;
                        var distance = app.jobService.viewModel.getJobDistance(my_location,job_location);
                        $('#distance_'+j.id).text(distance+' mi');
                        $('#distance_'+j.id).data('distance',distance);
                        if(distance < 1) $('#distance_'+j.id).css({ "background-color": "green", "color": "white", "padding": "2px 7px", "border-radius": "5px" });
                    });
                    
                    
                    // sort jobs by distance
                    
                    var arr = [];
                    
                    // loop through each list item and get the metadata
                    $('#jobsList li').each(function () {  
                        var distance = $(this).find('a span.job-distance').data('distance');
                        var meta = { distance:distance };
                        meta.elem = $(this);
                        arr.push(meta);
                    });
                    arr.sort(compareDistance);
                    
                    //Foreach item append it to the container. The first i arr will then end up in the top
                    $.each(arr, function(index, item){
                        item.elem.appendTo(item.elem.parent());
                    });
                                        
                    
                },
                function (error) {
                    //default map coordinates                    
                    //navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
                    //    function () { }, "Location failed", 'OK');
                },
                {
                    timeout: 30000,
                    enableHighAccuracy: true
                }
            );
            
            
    	},
        
        getJobDistance: function(my_location,job_location)
        {
            var lat1 = my_location.lat;
            var lon1 = my_location.lon;
            var lat2 = job_location.lat;
            var lon2 = job_location.lon; 
            
            var R = 6371; // km
             
            var dLat = toRad(lat2-lat1);
            var dLon = toRad(lon2-lon1);
            var lat1 = toRad(lat1);
            var lat2 = toRad(lat2);
            
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            var d = R * c * 0.62137; // also convert km to miles
            
            return Math.round((d + 0.00001) * 100) / 100;
        },
        
        syncCurrentJob: function()
        {
            app.dbFunctions.saveJob(app.currentJob);
        },
        
        syncAll: function()
        {
            
            
            if($('#sync-all-btn').text() == 'Saving...') return false;
            if(!app.checkNetwork('Cannot upload jobs')) return false;
            
            $('#sync-all-btn').text('Saving...');
            
            
            // save all jobs...
            app.dbFunctions.syncAllJobs(function() // callback after syncing all jobs
            { 
                
                // ... and then upload all photos
                $('#sync-all-btn').text('Uploading photos...');
                
                 app.pictures.all(function(obj)
                 {
                                      
                     $(obj).each(function(i,row){
                         
                         var surveyKey = row.key;
                         
                         $(row.value.photos).each(function(i2, filename){
                             
                             app.Upload.queue.push({key: surveyKey, filename: filename });
                             
                         });
                         
                     });
                     
                     app.Upload.runQueue();
                                      
                  });
                
                
            });
        },
        
       
    });

    app.jobService = {
        viewModel: new JobViewModel()
    };
}
)(window);