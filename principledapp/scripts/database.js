app.dbFunctions = {
    
    // nick.holmes@principled.uk.com Honey17b
    // forgandenny@gmail.com
        
    db: window.openDatabase("principled_test", "1.0", "Principled Test Database", 4194304),
    
    user: null,
    
    ak: 'jhaskjfya8s76f8as76fa9sf',
    
    init: function()
    {
        
        
        //this.db.changeVersion("1.1", "1.0"); 
        this.db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                          "users(ID INTEGER PRIMARY KEY ASC, username TEXT, token TEXT, logged_in TIMESTAMP DEFAULT (datetime('now','localtime')))", [], function(){}, app.dbFunctions.errorCB);
           
            tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                          "jobs(ID INTEGER PRIMARY KEY ASC, job_id INT(6) UNIQUE, job_data TEXT, is_sync int(1) not null)", [], function(){}, app.dbFunctions.errorCB);
           
            
        });
        
        
        app.pictures = new Lawnchair({name: 'principled_pictures',records:'pic'},function(){});
        
    },
    
    director: function()
    {
        this.init();
        this.checkUser();
    },
    
    showDebugTab: function(user)
    {
        $(document).ready(function(){
            if(user == 'forgandenny@gmail.com')
             {
                 app.loginService.viewModel.isAdminLoggedIn = true;
                 
             }
            else
            {
                app.loginService.viewModel.isAdminLoggedIn = false;
            }
        });
       
    },
    
    login: function(user,pass,callback)
    {
        var loginToken = CryptoJS.SHA512(user + CryptoJS.SHA1(pass).toString()).toString();
        var self = this;
        //self.resetDb();
        
        $.ajax({
            url: 'http://jobs.principled.uk.com/api/login/',
            type: 'POST',
            dataType: 'json',
            crossDomain: true,
            cache: false,
            headers: {"X-Requested-With": "XMLHttpRequest"},
            xhrFields: { withCredentials: true },
            data: {t: loginToken, ak: self.ak},
            success: function(response)
            {
                //console.log(response);
                if(typeof(response.ut) !== 'undefined')
                {
                    self.db.transaction(function(tx) {
                        tx.executeSql('INSERT INTO users (username, token) VALUES ("'+user+'","'+response.ut+'") ');
                    },function(err){ console.log(err) }, function(){ 
                    	// show debug tab if needed
                        self.showDebugTab(user);
                        
                    });
                    
                    callback();
                    
                    self.director();
                }
                else if(typeof(response.e) !== 'undefined')
                {
                    navigator.notification.alert('Login has failed, try again', function(){}, 'Error', 'OK')
                }
            },
            error: function(xhr)
            {
             	alert('login request failure '+xhr.responseText);
            }
        });
        
    },
    
    resetDb: function()
    {
        
        this.db.transaction(function(tx) {
            tx.executeSql('drop table users',[]);
            tx.executeSql('drop table jobs',[]);
        },function(e){console.log(e)},function(){ console.log('database reset ok') });
        
        app.pictures.nuke();
        
    },
    
    emptyDb: function()
    {
        
        this.db.transaction(function(tx) {
            tx.executeSql('delete from users',[]);
        },function(e){console.log(e)},function(){ /*console.log('empty users ok')*/ });
        
        this.db.transaction(function(tx) {
            tx.executeSql('delete from jobs',[]);
        },function(e){console.log(e)},function(){ /*console.log('empty jobs ok')*/ });
        
        //app.pictures.nuke();
        
        app.localJobs = [];
    	app.jobs = [];
    	app.currentJob = {};
        
    },
    
    rebuildJobs: function()
    {
        
        
        var self = this;
        
        this.db.transaction(function(tx) {
            tx.executeSql('delete from jobs where is_sync = ?',
                          [1],
                          function()
                          {
                              app.localJobs = [];
    						  app.jobs = [];
                              self.fetchJobs();
                              
                          },
                          function()
                          {
                              console.log('failed to delete synced jobs');
                          }
                         );
            // app.pictures.nuke();
        },function(e){ console.log('rebuild jobs transaction error'+e) }, function(){
           // transaction success
        });

    },
    
    logout: function()
    {
        var self = this;
        
        /*
        this.db.transaction(function(tx) {
            tx.executeSql('delete from users');
        });
        */
        
        var userToken = app.loginService.viewModel.get("token");
        
        $.ajax({
            url: 'http://jobs.principled.uk.com/api/logout/',
            type: 'POST',
            dataType: 'json',
            crossDomain: true,
            cache: false,
            headers: {"X-Requested-With": "XMLHttpRequest"},
            xhrFields: { withCredentials: true },
            data: {ut: userToken, ak: self.ak},
            success: function()
            {
                //console.log('logout success');
                self.emptyDb();
            },
            error: function(xhr)
            {
                console.log('logout error');
                console.log(xhr);
                self.emptyDb();
            }
            
        });
        
        
    },
    
    
    fetchJobs: function(update)
    {
       
        var self = this;
        var userToken = app.loginService.viewModel.get("token");
        
        $.ajax({
            url: 'http://jobs.principled.uk.com/api/list_jobs/ak/'+self.ak+'/ut/'+userToken,
            type: 'GET',
            dataType: 'json',
            crossDomain: true,
            cache: false,
            headers: {"X-Requested-With": "XMLHttpRequest"},
            xhrFields: { withCredentials: true },
            success: function(response)
            {
                if(typeof(response.jobs) !== 'undefined')
                {
                   
                   // add jobs to local database
                    
                    var jobsArray = response.jobs;
                    
                    
                    
                    self.db.transaction(function(tx) {
                        
                        //tx.executeSql('delete from jobs',[]);
                        
                        $(jobsArray).each(function(i,j)
                        {
                            
                            if($.inArray( parseInt(j.id), app.localJobs ) == -1)
                            { 
                                if(typeof(update) == 'undefined')
                                {
                                    tx.executeSql('INSERT INTO jobs (job_id, job_data, is_sync) VALUES (?, ?, ?) ',[j.id, JSON.stringify(j), 1], self.getJobs, app.dbFunctions.errorCB);
                                }
                                else if(update === true)
                                {
                                    tx.executeSql('UPDATE jobs SET job_data = ?, is_sync = ? WHERE job_id = ?',[JSON.stringify(j), 1, j.id], function(){}, app.dbFunctions.errorCB);
                                }
                               
                            }
                            
                        });
                        
                    });
                    
                   // read jobs from local database (to make sure it's consistent)
                   
                }
                else if(typeof(response.e) !== 'undefined')
                {
                    navigator.notification.alert('Could not get jobs', function(){}, 'Error', 'OK')
                }
            },
            error: function(xhr)
            {
             	//alert('ajax failure '+xhr.responseText);
                navigator.notification.alert('Jobs request failure '+ xhr.responseText, function(){}, 'Error', 'OK')
            }
        });
        
    },
    
    getJobs: function(tx)
    {
        
        //tx.executeSql('SELECT * FROM jobs', [], app.jobService.viewModel.showJobs, app.dbFunctions.errorCB);
       
        
        if(typeof(tx) != 'undefined') {
            // trying to get local jobs when fetching new jobs
            tx.executeSql('SELECT * FROM jobs', [], app.jobService.viewModel.showJobs, app.dbFunctions.errorCB);
        }
        else {
            // trying to get local jobs when loading application
            this.db.transaction(function(tx)
            {
                tx.executeSql('SELECT * FROM jobs', [], app.jobService.viewModel.showJobs, app.dbFunctions.errorCB);
            });
        }
        
        
    },
    
    saveJob: function(job, is_sync)
    {
        //console.log(job);
        //return false;
        
        var self = this;
        
        if(typeof(is_sync) != 'undefined' && is_sync === true)
        {
            
            this.db.transaction(function(tx) {
                tx.executeSql('UPDATE jobs SET job_data = ?, is_sync = ? WHERE job_id = ?',[JSON.stringify(job), 1, job.id], function(){ 
                	
                    if(Object.size(app.currentJob) > 0 && app.currentJob.id == job.id)
                    {
                        app.currentJob = job;
                        
                        //console.log('saving job back to local db');
                        //console.log(app.currentJob.property_survey.data);
                        
                        // bind saved survey to a form
                        
                        if(app.currentSurveyType == 'property')
                        {
                            var surveyDiv = 'property-survey-screen';
                            kendo.bind($("#"+surveyDiv), app.currentJob.property_survey);
                        }
                        else
                        {
                            var surveyDiv = 'survey-screen';
                            kendo.bind($("#"+surveyDiv), app.currentJob.surveys[app.currentSurveyType]);
                        }
                        
                        
						$('#survey-save-btn').addClass('hidden');
                        $('#survey-save-btn').html('Save');
                        
                    }
                
                }, app.dbFunctions.errorCB);
            });
        }
        else
        {
            this.db.transaction(function(tx) {
                tx.executeSql('UPDATE jobs SET job_data = ?, is_sync = ? WHERE job_id = ?',[JSON.stringify(job), 0, job.id] );
            }, app.dbFunctions.errorCB, function(){ self.syncJob(job) } );
        }

        
    },
    
    syncJob: function(job)
    {
        
        if(!app.isNetwork()) 
        {
            $('#survey-save-btn').addClass('hidden');
            $('#survey-save-btn').html('Save');
            return false;
        }
            
        
        var self = this;
        var userToken = app.loginService.viewModel.get("token");
        
       	//console.log('current job before saving');
        //console.log(app.currentJob);
        //return false;
        
        $.ajax({
            url: 'http://jobs.principled.uk.com/api/save_job/',
            type: 'POST',
            dataType: 'json',
            crossDomain: true,
            cache: false,
            headers: {"X-Requested-With": "XMLHttpRequest"},
            xhrFields: { withCredentials: true },
            data: { ut: userToken, ak: self.ak, ps: JSON.stringify(job.property_survey), s: JSON.stringify(job.surveys) },
            success: function(response)
            {
                if(typeof(response.e) == 'undefined')
                {
                    
                   if(typeof(response.saved_job) != 'undefined')
                   {
                        
                      self.saveJob(response.saved_job,true);

                   }
                }
                else
                {
                    
                    $('#survey-save-btn').addClass('hidden');
                	$('#survey-save-btn').html('Save');
                    
                    navigator.notification.alert('Job was only saved on your device',
                                         function () { }, response.e, 'OK');
                    
                }
            },
            error: function()
            {
                $('#survey-save-btn').addClass('hidden');
                $('#survey-save-btn').html('Save');
            }
            
        });
    },
    
    syncAllJobs: function(callback)
    {
        var self = this;
        
       
        
        // get all jobs that are not in sync and save them to a server
        //$('#sync-all-btn').text('Save all jobs');
        this.db.transaction(function(tx) {
                tx.executeSql('SELECT * FROM jobs WHERE is_sync = ?',[0],function(tx, results){
                
                var len = results.rows.length;
                var job = {};
                
                if(len > 0)
                {
                    for (var i=0; i<len; i++)
                    {
                        var row = results.rows.item(i);
                        var job = JSON.parse(row.job_data);
                        
                        //console.log('syncing job '+job.id);
                        
                        self.syncJob(job);
                        
                        
                       
                    }
                }
            
                
                
            }, app.dbFunctions.errorCB );
        }, app.dbFunctions.errorCB, callback );
        
        
        
    },
    
    checkUser: function()
    {	
    	//this.resetDb();
    	this.db.transaction(this.userQueryDB, this.errorCB);
    },
    
    userQueryDB: function(tx) {
        tx.executeSql('SELECT * FROM users', [], app.dbFunctions.userQuerySuccess, app.dbFunctions.errorCB);
    },
    
    userQuerySuccess: function(tx, results) {
        
        var len = results.rows.length;
        if(len > 0)
        { 
            for (var i=0; i<len; i++)
            {
            	var token = results.rows.item(i).token;
                var user = results.rows.item(i).username;
        	}
            app.dbFunctions.showDebugTab(user);
            app.loginService.viewModel.set("isLoggedIn", true);
            app.loginService.viewModel.set("token", token);
            app.application.navigate('#tabstrip-home');
            navigator.splashscreen.hide();
        }
        else
        {	
            app.loginService.viewModel.set("isLoggedIn", false);
            app.application.navigate('#tabstrip-login');
            navigator.splashscreen.hide();
        }
    },

    // Transaction error callback
    //
    errorCB: function(transaction, err) { 
        console.log("Error processing SQL: "+err.code);
        console.log(err);
    }
    
};