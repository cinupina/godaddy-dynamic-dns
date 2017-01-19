const async = require('async');
const request = require('request');
const querystring = require('querystring');
const moment = require('moment');
const util = require('util');
const config = require('../config.json');
const auth = require('../auth.json');

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

function getDnsRecords(domain, hosts, callback) {
  async.map(hosts, function (host, callback) {
    const path = `/v1/domains/${domain}/records/A/${host}`;
    requestApi('GET', path, null, true, (err, response) => callback(null, {host, response}));
  }, function(err, results){
    callback(null, results);
  });
}

function updateDnsRecords(domain, host, data, callback) {
  const path = `/v1/domains/${domain}/records/A/${host}`;
  requestApi('PUT', path, data, false, callback);
}

function check(domain, host) {

  getPublicIp((err1, ip) => {
    if (err1) {
      console.log(err1);
      return;
    }

    getDnsRecords(domain, host, (err2, records) => {

      if (err2) {
        console.log(err2);
        return;
      }

      if (!records || !records.length) {
        return void console.log(`There are no DNS records found for ${hostname}`);
      }

      records.forEach( function(record) {

        let hostname = `${record.host}.${domain}`;

        console.log(`${now()} Checking ${hostname}...`);

        const response = record.response[0];
        const host = record.host;

        if (response.type !== 'A') {
          return void console.log(`Unexpected Type record ${response.type} returned for ${hostname}`);
        }

        if (!host.includes(response.name)) {
          return void console.log(`Unexpected Name record ${response.name} returned for ${hostname}`);
        }

        if (response.data === ip) {
          return void console.log(`${now()} The current public IP address matches GoDaddy DNS record: ${ip}, no update needed.`);
        }

        console.log(`${now()} The current public IP address ${ip} does not match GoDaddy DNS record: ${response.data}.`);
        const data = [{ data: ip, ttl: 86400 }];
        updateDnsRecords(domain, host, data, (err3, res) => {
          if (err3) {
            return void console.log(err3);
          }

          getDnsRecords(domain, host, (err4, records2) => {
            if (err4) {
              return void console.log(err4);
            }
            console.log(`${now()} Successfully updated DNS records to: ${util.inspect(records2)}`);
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
      'Authorization': `sso-key ${auth.key}:${auth.secret}`
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

check(auth.domain, auth.host);
