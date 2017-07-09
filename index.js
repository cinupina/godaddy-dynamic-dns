

var GoDaddyDynamicDNS = require('./src/GoDaddyDynamicDNS.js');
module.exports = GoDaddyDynamicDNS;

(function(){
	const path = require('path');
	const fs = require('fs');
	if(process.argv && process.argv.length > 2){
		
		// https://github.com/scottcorgan/file-exists
		function fullPath (filepath, options = {}) {const root = options.root;return (root) ? path.join(root, filepath) : filepath;}
		function fileExistsSync (filepath = '', options = {}) {
			try {
				return fs.statSync(fullPath(filepath, options)).isFile();
			} catch (e) {
				return false;
			}
		}
		
		let run = false,
			filePath = '',
			testing = false;
			
		process.argv.forEach((val, index) => {
			if(/^(?:-r|--run)/i.test(val)) {
				run = true;
				if(process.argv.length > index && /\.json$/.test(process.argv[index + 1])){
					filePath = process.argv[index + 1];
				}
			}
			if(/^(?:-t|--test)$/i.test(val)) testing = true; // Does not 
		});
		
		if(run){
			let settings = null;
			if(filePath && fileExistsSync(filePath)){
				settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				console.log('GoDaddy config loaded: "' + path.join(process.cwd(), filePath) + '"');
			} else {
				try {
					settings = require('../auth.json');
					console.log('GoDaddy config loaded: "' + path.join(module.parent ? module.parent.filename : module.filename, '..', '../auth.json') + '"');
				} catch(e) {
					settings = require('./auth.json');
					console.log('GoDaddy config loaded: "' + path.join(module.parent ? module.parent.filename : module.filename, '..', 'auth.json') + '"');
				}
			}
			
			var myGoDaddyDynamicDNS = new GoDaddyDynamicDNS(settings, testing);
			
			myGoDaddyDynamicDNS.run();
		}
	}
})();

return GoDaddyDynamicDNS;