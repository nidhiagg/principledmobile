(function(g) {
  // Make analytics available via the window.analytics variable
  // Start analytics by calling window.analytics.Start()
  var analytics = g.analytics = g.analytics || {};

  analytics.Start = function()
  {
    // Handy shortcuts to the analytics api
    var factory = window.plugins.EqatecAnalytics.Factory;

    factory.IsMonitorCreated(function(result) {
      if (result.IsCreated == "true")
        return;
      // Create the monitor instance using the unique product key for Principled
      var productId = "9d3d712030c3440f8155b3b9c329110a";
      var version = "1.2.3";
      var settings = factory.CreateSettings(productId, version);
      settings.LoggingInterface = factory.CreateTraceLogger();
      factory.CreateMonitorWithSettings(settings,
        function() {
          console.log("Monitor created");
          // Start the monitor
          window.plugins.EqatecAnalytics.Monitor.Start(function() {
            console.log("Monitor started");
          });
        },
        function(msg) {
          console.log("Error creating monitor: " + msg);
        });
    });
  }

  analytics.Stop = function()
  {
    var mon = window.plugins.EqatecAnalytics.Monitor;
    mon.Stop();
  }

  analytics.Monitor = function()
  {
    return window.plugins.EqatecAnalytics.Monitor;
  }    
})(window);