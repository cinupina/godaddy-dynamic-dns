# godaddy-dynamic-dns
This is a Node.js script that can be used as "personal dynamic DNS" for domains hosted at GoDaddy.
It detects the public IP address of the machine where this script is run on, and updates the DNS A record using GoDaddy's public API.
The update only occurs if the public IP address differs from the current DNS A record.

## How It Works
1. The script calls api.ipify.org to determine the public IP address of your request.
2. It then calls GoDaddy API to check your host's current DNS records.
3. If the IPs are different, it calls GoDaddy API to update your hosts' DNS record to match your current public IP address.

## Installation and Execution
The script has been tested using Node 6.x, though any version that supports ES6 should work. It needs to be run on a machine that is behind the public IP address you want to update your DNS record to.
1. Install Node.js
2. Clone this repository to a local directory.
3. Request _Production_ GoDaddy API Key and Secret for your account from [GoDaddy Developer Portal](https://developer.godaddy.com/keys/)
4. Create `auth.json` file in the root local repository directory, containing the following: 
    {
      "key": "[your GoDaddy API Key]",
      "secret": "[your GoDaddy API Secret]",
      "domain": "[your domain name, ex: foo.com]",
      "host": "[your host, ex: www]"
    }
5. Run `npm install` in the root local repository.
6. Execute this script via `npm start`, or `node ./src/index.js`.
7. Repeat the execution periodically, using cron job or other task schedulers.

## Notes and Disclaimer
1. Feedback, bug report, PR are welcome!
2. The script is provided as-is, I hold absolutely no responsibility for any problem with your host records using this script :)))
