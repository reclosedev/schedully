var app = angular.module("myApp", []);

app.controller("MyCtrl", function($http){
    var vm = this;
    this.appDB = window.APP_DB;
    angular.forEach(this.appDB.schedules, function(schedule){
        for (var i = 0; i < schedule.times.length; i++){
            var d = new Date();
            d.setHours(schedule.times[i][0], schedule.times[i][1], 0, 0);
            schedule.times[i] = d;
        }
    });
});
