(function (global) {
    var LoginViewModel,
        app = global.app = global.app || {};

    LoginViewModel = kendo.data.ObservableObject.extend({
        isLoggedIn: false,
        isAdminLoggedIn: false,
        username: "",
        password: "",
        
        isLoggedIn: function() {
            return this.get("isLoggedIn");
        },

        onLogin: function () {
            var that = this,
                username = that.get("username").trim().toLowerCase(),
                password = that.get("password").trim();

            if (username === "" || password === "") {
                navigator.notification.alert("Both fields are required!",
                    function () { }, "Login failed", 'OK');

                return;
            }
            
            app.dbFunctions.login(username,password,function(){
                that.clearForm();
            });
            
            return true;
        },

        onLogout: function () {
            var that = this;
			app.dbFunctions.logout();
            that.set("isLoggedIn", false);
            that.set("isAdminLoggedIn", false);
            app.application.navigate('#tabstrip-login');
            //analytics.Stop();
        },

        clearForm: function () {
            var that = this;

            that.set("username", "");
            that.set("password", "");
        }
    });

    app.loginService = {
        viewModel: new LoginViewModel()
    };
    
    
})(window);

