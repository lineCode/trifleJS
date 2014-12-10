
var fs = require("fs");
var server = require('webserver').create();
var page = require('webpage').create();
var refdir = "../../test/unit/ref/";
var textfile = refdir + "fs.txt";
var workingDirectory = fs.workingDirectory;
var helloWorldListener = function(request, response) { response.write("Hello World"); response.close(); }
var helloWorld2Listener = function(request, response) { response.write("Hello World2"); response.close(); }
var infoListener = function(request, response) { response.write(JSON.stringify({success: true, httpVersion: request.httpVersion, method: request.method, url: request.url, headers: request.headers, post: request.post, postRaw: request.postRaw})); response.close(); }

assert.suite('WEBSERVER MODULE', function() {

	// --------------------------------------------
	assert.section('Instantiation');
	// --------------------------------------------

	assert(!!server, 'server can be instantiated using require()');
	assert(typeof server === 'object', 'server is an object');

	// --------------------------------------------
	assert.section('Properties & methods');
	// --------------------------------------------

	assert(typeof server.listen === 'function', 'server.listen() is a function');
	assert(typeof server.close === 'function', 'server.close() is a function');
	assert(typeof server.port === 'string', 'server.port is a string');
	assert(server.port === '', 'server.port is an empty string to beging with')

	// --------------------------------------------
	assert.section('Listening for connections');
	// --------------------------------------------

	var ready, requestInfo;

	var isListening = server.listen(8080, helloWorldListener);

	assert(isListening === true, 'server.listen() returns true when listening');
	assert(server.port === '8080', 'server.port returns the correct port')

	ready = false;

	page.open('http://localhost:8080', function(status) {
		ready = true;
	});
	
	assert.waitFor(ready);
	
	assert(page.plainText === "Hello World", 'server responded with "Hello World" on 8080');

	// Try again on same port

	isListening = server.listen(8080, helloWorld2Listener);

	assert(isListening === true, 'server.listen() return true when listening on same port');
	assert(server.port === '8080', 'server.port returns the correct port')
	
	ready = false;

	page.open('http://localhost:8080', function(status) {
		ready = true;
	});
	
	assert.waitFor(ready);
	
	assert(page.plainText === "Hello World2", 'server responded with "Hello World2" on 8080 (binding is replaced)');

	isListening = server.listen(8081, infoListener);

	assert(isListening === true, 'server.listen() return true when listening on a different port');
	assert(server.port === '8081', 'server.port returns the correct port')

	ready = false;

	page.open('http://localhost:8081/testurl?k=v', function(status) {
		ready = true;
	});
	
	assert.waitFor(ready);
	
	requestInfo = JSON.parse(page.plainText);
	
	assert(requestInfo.success === true, 'request was a success');
	assert(requestInfo.httpVersion === '1.1', 'request httpVersion was 1.1');
	assert(requestInfo.method === 'GET', 'request method was correct (GET)');
	assert(typeof(requestInfo.headers) === 'object', 'request has some headers');
	assert(requestInfo.headers.Host === 'localhost:8081', 'request has correct Origin header');
	assert(requestInfo.url === '/testurl?k=v', 'request url was correct (/testurl?k=v)');

	// --------------------------------------------
	assert.section('POST Request');
	// --------------------------------------------

	ready = false;

	page.open('http://localhost:8081/', 'POST', function(status) {
		ready = true;
	});
	
	assert.waitFor(ready);
	
	requestInfo = JSON.parse(page.plainText);
	
	assert(requestInfo.method === 'POST', 'request method was correct (POST)');
	assert(typeof(requestInfo.headers) === 'object', 'request has some headers');
	assert(requestInfo.post === '', 'request body was empty (no data was posted)');
	assert(requestInfo.postRaw === '', 'request raw post was empty (no data was posted)');

	ready = false;

	page.customHeaders = {
		'Content-Type': 'application/x-www-form-urlencoded'
	};

	page.open('http://localhost:8081/', 'POST', 'user=username&pass=password&price=$15&location=o\'rileys bar&perc=10%', function(status) {
		ready = true;
	});
	
	assert.waitFor(ready);
	
	requestInfo = JSON.parse(page.plainText);
	
	assert(requestInfo.method === 'POST', 'request method was correct (POST)');
	assert(typeof(requestInfo.headers) === 'object', 'request has some headers');
	assert(requestInfo.headers['Content-Type'] === 'application/x-www-form-urlencoded', 'Content-Type header set to application/x-www-form-urlencoded');
	assert(typeof(requestInfo.post) === 'object', 'request body is an object with some data');
	assert(requestInfo.post.user === 'username', 'request body contains username');
	assert(requestInfo.post.pass === 'password', 'request body contains password');
	assert(requestInfo.post.price === '$15', 'request body contains price ($15)');
	assert(requestInfo.post.location === 'o\'rileys bar', 'request body contains location (including special chars)');
	assert(requestInfo.post.perc === '10%', 'request body contains perc (including percentage sign)');
	assert(requestInfo.postRaw === 'user=username&pass=password&price=$15&location=o\'rileys bar&perc=10%', 'request raw post contains the data sent');

});

// TEARDOWN
server.close()
