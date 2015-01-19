# synctabs.js
synctabs is a script to syncronize tabs within the same domain through work queues using browser's localstorage.

### Installation
Include synctabs.js to your site

    <script src="synctabs.js"></script>

## Initialization
A syncTab object needs to be created:
syncTab object takes as parameter an array with three elements: "master", "slave" and "global".

"master" stores a function in an array with one element called "register", this is called when a master is registered.
"slave" stores two functions in an array with two elements: "register" and "unregister". Their are called upon registration and unregistration.
"global" stores an unlimited amount of functions in an arrays.



    synctab = new syncTab({
        'master': {
            'register': function(){
                console.log('master register');
            }
        },
        'slave':{
            'register': function(){
                console.log('slave register');
            },
            'unregister': function(){
                console.log('slave unregister');
            }
        },
        'global': {
            'message': function(msg){
                console.log(msg);
            },
            'get_ts': function(){
                console.log(+new Date());
            }
        }
    });

    
## How it works

When a new tab is created, a "master" or a "slave" will be created.
If the "master" tab is killed and other tabs remain open, then one of the tabs will take the "master" status.
If a "slave" tab is killed, the master will unregister it from the queue.

## Usage
Registering functions at run-time

    synctab = new syncTab();
    synctab.register_function('message', function(msg){ console.log(msg)} );

Adding a function call to the queue

    synctab.add('message', 'Hello everyone!');
    
Adding constraints to a function call.

    synctab.add('message', 'Hello slaves, I am your master!', {'master': false, 'slaves': true});
    

## Examples

Opening only one websocket connection on master tab, and then communcating data recieved to slaves

    synctab = new syncTab({
        'master': {
            'register': function(){
                console.log('Master registered');
                socket = new WebSocket('ws://echo.websocket.org');
                
                socket.onopen = function(){
                    console.log('Connected');
                }
                
                socket.onmessage = function(response){
                    echo_to_slaves(response.data);
                }
            }
        },
        'slave':{
            'register': function(){
                console.log('Slave registered');
                }
            },
            'global':{
                'message': function(msg){
                    console.log(msg);
                }
            }
        });
        
        function echo_to_server(message){
            if (typeof socket == 'object'){
                socket.send(message);
            }
        }
        
        function echo_to_slaves(message){
            console.log('Sending to slaves:' + message);
            synctab.add('message', message, {'master': false, 'slaves': true});
        }
