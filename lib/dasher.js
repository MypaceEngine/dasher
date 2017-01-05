var url = require('url')
var dashButton = require('node-dash-button');
var request = require('request')
var wol = require('wake_on_lan')

function doLog(message) {
  console.log('[' + (new Date().toISOString()) + '] ' + message);
}

function DasherButton(button) {
  var options = {headers: button.headers, body: button.body, json: button.json, formData: button.formData}

  var debug = button.debug || false;
  this.dashButton = dashButton(button.address, button.interface, button.timeout, button.protocol)
  var buttonList = {};
  
  this.dashButton.on("detected", function() {
    if(!buttonList.hasOwnProperty(button.address)){
        buttonList[button.address] = 1;
    } else {
        buttonList[button.address]++;
    }
    doLog(button.name + " pressed. Count: " +  buttonList[button.address]);    
    if (debug){
      doLog("Debug mode, skipping request.");
      console.log(button);
    } else {
      if ( button.method == "EXEC" ) {
         execRequest(button.url)
      }
      else {
         if(button.method == "WOL"){
             doWol(button.targetMac)
         }
         else {
             doRequest(button.url, button.method, options)
         }
      }
    }
  })

  doLog(button.name + " added.")
}

function doWol(address) {
  wol.wake(address, function(error) {
    if (error) {
      doLog("there was an error");
      console.log(error);
    } else {
      console.log('Sent magic packet to ' +  address);
    }
  });
}

exec = require('child_process').exec;
function execRequest(scriptPath) {
    console.log("EXEC: " + scriptPath);
    exec(scriptPath,
        function (error, stdout, stderr) {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          if (error !== null) {
            console.log('exec error: ' + error);
          }
    });
}

function doRequest(requestUrl, method, options, callback) {
  options = options || {}
  options.query = options.query || {}
  options.json = options.json || false
  options.headers = options.headers || {}

  var reqOpts = {
    url: url.parse(requestUrl),
    method: method || 'GET',
    qs: options.query,
    body: options.body,
    json: options.json,
    headers: options.headers,
    formData: options.formData
  }

  request(reqOpts, function onResponse(error, response, body) {
    if (error) {
      doLog("there was an error");
    }
    if (response) {
      if (response.statusCode === 401) {
        doLog("Not authenticated");
        doLog(error);
      }
      if (response.statusCode < 200 || response.statusCode > 299) {
        doLog("Unsuccessful status code");
        doLog(error);
      }
    } else {
      doLog("Response undefined");
    }
    



    if (callback) {
      callback(error, response, body)
    }
  })
}

module.exports = DasherButton
