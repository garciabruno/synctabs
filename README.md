# synctabs.js
synctabs is a javascript library for cross-window commucation

### Installation
Include synctabs.js to your site

    <script src="synctabs.js"></script>

## Getting started
As simple as creating a new syncTab object

    synctab = new syncTab();

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
