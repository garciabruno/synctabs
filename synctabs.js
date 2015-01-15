/*!
 * synctabs.js 0.1
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 */

syncTab = function(_callbacks){
	var callbacks = {
		'master':{
			'register': [],
			'unregister': [],
		},
		'slave':{
			'register': [],
			'unregister': []
		}
	};

	var state = {
		'current': '',
		'id': null,
		'last_id': null
	};

	var keys = {
		'master_id': 'synctab_master_id',
		'slaves_ids': 'synctab_slaves_ids',
		'last_master_ts': 'synctab_master_last_ts',
		'last_id': 'synctab_last_id',
		'last_id_ts_': 'synctab_id_last_ts_'
	};

	var latency = 1000;
	var master_latency = 3000;
	var slave_latency = 3000;

	var self = this;

	this.get_key = function(key){
		if (key.lastIndexOf('last_id_ts_') == 0){
			return localStorage.getItem(key);
		}
		else{
			return localStorage.getItem(keys[key]);
		}
	};

	this.set_key = function(key, value){
		if (key.lastIndexOf('last_id_ts_') == 0){
			localStorage.setItem(key, value);
		}
		else{
			localStorage.setItem(keys[key], value);
		}
	};

	this.remove_key = function(key){
		if (key.lastIndexOf('last_id_ts_') == 0){
			localStorage.removeItem(key);
		}
		else{
			localStorage.removeItem(keys[key]);
		}
	}

	this.get_slaves = function(){
		return JSON.parse(self.get_key('slaves_ids'));
	};

	this.become_master = function(){
		var current_ts = +new Date();

		self.set_key('last_master_ts', current_ts);
		state['current'] = 'master';

		var last_id = parseInt(self.get_key('last_id'));

		if (isNaN(last_id)){
			console.debug('No one was here before me, I am becoming id 1');

			state['id'] = 1;

			self.set_key('last_id', 1);
			self.set_key('master_id', 1);
		}
		else{
			console.debug('There\'s some people in here too, I am becoming id %d', last_id + 1);

			state['id'] = last_id + 1;

			self.set_key('last_id', last_id + 1);
			self.set_key('master_id', last_id + 1);
		}
	};

	this.become_slave = function(){
		var current_ts = +new Date();
		var last_id = parseInt(self.get_key('last_id'));
		var slaves_ids = self.get_slaves();

		if (isNaN(last_id)){
			console.debug('This shouln\'t had happened. No last_id, but a master is present.');
			last_id = 0;
		}

		state['id'] = last_id + 1;
		state['current'] = 'slave';

		if (slaves_ids == null){
			console.debug('I am the first slave');

			slaves_ids = [state['id']];
		}
		else{
			console.debug('There are other slaves here, I\'ll append to them %o', slaves_ids);

			slaves_ids.push(state['id']);
		}

		self.set_key('last_id', last_id + 1);
		self.set_key('slaves_ids', JSON.stringify(slaves_ids));
		self.set_key('last_id_ts_' + state['id'], current_ts);
	};

	this.remove_slave = function(slave_id){
		var new_slaves = [];
		var slaves_ids = self.get_slaves();

		if (slaves_ids == null){
			slaves_ids = [slave_id];
		}

		for (var i = 0; i < slaves_ids.length; i++){
			if (slaves_ids[i] != slave_id){
				new_slaves.push(slaves_ids[i]);
			}
		}

		self.set_key('slaves_ids', JSON.stringify(new_slaves));
	};

	this.kick_master = function(){
		var current_ts = +new Date();

		self.remove_slave(state['id']);

		state['current'] = 'master';

		self.set_key('last_master_ts', current_ts);
		self.set_key('master_id', state['id']);
	};

	this.get_master_status = function(){
		var current_ts = +new Date();
		var master_ts = localStorage.getItem(keys['last_master_ts']);

		if (master_ts == null){
			console.debug('There\'s no master, I am the master now!');
			self.become_master();
		}
		else if ((current_ts - master_ts) > master_latency){
			console.debug('Master is not responding. I\'ll become master now');
			self.become_master();
		}
		else{
			console.debug('I am the new slave here');
			self.become_slave();
		}
	};

	this.check_slaves = function(){
		var slaves_ids = self.get_slaves();
		var current_ts = +new Date();

		if (slaves_ids.length > 0){
			for (var i = 0; i < slaves_ids.length; i++){
				var last_id_ts = self.get_key('last_id_ts_' + slaves_ids[i]);

				if ((current_ts - last_id_ts) > slave_latency){
					console.debug('slave %d is not responding, kill him.', slaves_ids[i]);
					self.remove_key('last_id_ts_' + slaves_ids[i]);
					self.remove_slave(slaves_ids[i]);
				}
			}
		}
	};

	this.loop = function(){
		var current_ts = +new Date();
		var master_ts = self.get_key('last_master_ts');

		if (state['current'] == 'master'){
			if (self.get_key('master_id') != state['id']){
				console.debug('Looks like I am no longer the master, I\'ll just be a slave');

				state['current'] = 'slave';
				return;
			}

			self.set_key('last_master_ts', current_ts);
			self.check_slaves();

			console.debug('I am the master, therefore I refreshed my status');
		}
		else if(state['current'] == 'slave'){
			self.set_key('last_id_ts_' + state['id'], current_ts);

			console.debug('I am slave id %d, therefore I refreshed my status', state['id']);

			if ((current_ts - master_ts) > master_latency){
				console.debug('Master is not responding. I\'m taking over!');
				self.kick_master(current_ts);
			}
		}
	};

	this.init = function(){
		console.log('synctabs.js init');
		self.get_master_status();

		setInterval(function(){
			self.loop();
		}, latency);
	};

	self.init();
};

synctab = new syncTab();
