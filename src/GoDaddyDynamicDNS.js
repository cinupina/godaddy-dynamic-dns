
module.exports = (function(){

	const async = require('async');
	const request = require('request');
	const querystring = require('querystring');
	const moment = require('moment');
	const util = require('util');
	const config = require('../config.json');
	
	function getPublicIp(callback) {
		request({
			method: 'GET',
			uri: config.ipify,
			json: true
		}, (err, res, body) => {
			if (err) {
				return void callback(err);
			}

			if (res.statusCode !== 200) {
				return void callback(new Error('Failed to retrieve this machine\'s public IP address. ' + res.statusCode));
			}

			if (!body || !body.ip) {
				return void callback(new Error(`Unexpected response from ${config.ipify}: ${util.inspect(body)}`));
			}

			callback(null, body.ip);
		});
	}
	
	function GoDaddyDynamicDNS(settings, testing){
		this.settings = settings || require('../auth.json');
		this.testing = !!testing;
		this.lastCheck = null;
		this.lastUpdate = null;

		this.getDnsRecords = (domain, hosts, callback) => {
			async.map(hosts, function (host, callback) {
				const path = `/v1/domains/${domain}/records/A/${host}`;
				requestApi('GET', path, null, true, (err, response) => {
					if (err){
						return callback(err);
					}
					callback(null, {host, response})
				})
			}, function(err, results){
				callback(null, results);
			});
		}

		this.updateDnsRecords = (domain, host, data, callback) => {
			const path = `/v1/domains/${domain}/records/A/${host}`;
			this.lastUpdate = moment();
			if(this.testing) callback(false, 'testing');
			else requestApi('PUT', path, data, false, callback);
		}

		this.check = (domain, host, ipOverride, callback) => {
			if(typeof ipOverride === "function"){
				callback = ipOverride;
				ipOverride = undefined;
			}
			this.lastCheck = moment();
			getPublicIp((err1, ip) => {
				if(ipOverride){
					if(err1) console.log(`${now()} Target IP: ${ipOverride}`);
					else console.log(`${now()} Public IP: ${ip} -- Target IP: ${ipOverride}`);
					ip = ipOverride;
				} else {
					if (err1) {
						console.log(err1);
						return callback(false);
					}
					console.log(`${now()} Public IP: ${ip}`);
				}
				
				

				this.getDnsRecords(domain, host, (err2, records) => {

					if (err2) {
						console.log(err2, records);
						return callback(false);
					}

					if (!records || !records.length) {
						console.log(`There are no DNS records found for ${hostname}`);
						return callback(false);
					}

					records.forEach( (record) => {

						let hostname = `${record.host}.${domain}`;
						console.log(`${now()} Checking ${hostname}...`);

						const host = record.host;
						const response = record.response[0];

						if (response.type !== 'A') {
							console.log(`Unexpected Type record ${response.type} returned for ${hostname}`);
							return callback(false);
						}

						if (!host.includes(response.name)) {
							console.log(`Unexpected Name record ${response.name} returned for ${hostname}`);
							return callback(false);
						}

						if (response.data === ip) {
							console.log(`${now()} The current target IP address matches GoDaddy DNS record: ${ip}, no update needed.`);
							return callback(true);
						}

						console.log(`${now()} The current target IP address ${ip} does not match GoDaddy DNS record: ${response.data}.`);
						const data = [{ data: ip, ttl: 86400 }];
						this.updateDnsRecords(domain, host, data, (err3, res) => {
							if (err3) {
								console.log(err3);
								return callback(false);
							}

							this.getDnsRecords(domain, host, (err4, records2) => {
								if (err4) {
									console.log(err4);
									return callback(false);
								}
								console.log(`${now()} Successfully updated DNS records to: `, JSON.stringify(records2, null, '\t'));
								return callback(true);
							})
						})
					});
				});
			});
		}

		function requestApi(method, path, data, isJson, callback) {
			let options = {
				method: method,
				uri: config.godaddy + path,
				headers: {
					'Authorization': `sso-key ${settings.key}:${settings.secret}`
				},
				body: data || undefined,
				json: true
			};
			
			request(options, (err, res, body) => {
				if (err) {
					return void callback(err);
				}

				if (res.statusCode !== 200) {
					console.dir(body);
					console.dir(data);
					return void callback(new Error(`Request Failed.\n` +
						`Status Code: ${res.statusCode}`));
				}

				callback(null, body);
			});
		}

		function now() {
			return `[${moment().format()}]`;
		}
		
		this.run = (ip, callback) => {
			if(typeof ip === "function"){
				callback = ip;
				ip = undefined;
			}
			ip = ip || settings.ip;
			this.check(settings.domain, settings.host, ip, (success) => {
				console.log(`${now()} result: ` + (success ? 'success' : 'failure'));
				if(typeof callback === "function") callback(success);
			});
		}
	
	}
	
	return GoDaddyDynamicDNS;

})();