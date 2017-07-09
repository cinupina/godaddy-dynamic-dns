

var GoDaddyDynamicDNS = require('./src/GoDaddyDynamicDNS.js');
module.exports = GoDaddyDynamicDNS;

(function(){
	const path = require('path');
	const fs = require('fs');
	if(require.main === module || (process.argv && process.argv.length > 2)){
		
		// https://github.com/scottcorgan/file-exists
		function fullPath (filepath, options = {}) {const root = options.root;return (root) ? path.join(root, filepath) : filepath;}
		function fileExistsSync (filepath = '', options = {}) {
			try {
				return fs.statSync(fullPath(filepath, options)).isFile();
			} catch (e) {
				return false;
			}
		}
		
		let run = require.main === module,
			filePath = '',
			testing = false;
		
		if(process.argv.length > 2 && /\.json$/.test(process.argv[2])){
			filePath = process.argv[2];
			run = true;
		}
		
		process.argv.forEach((val, index) => {
			if(/^(?:-t|--test)$/i.test(val)) testing = true; // Does not 
		});
		
		if(run){
			let settings = null;
			let completePath = filePath && (path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath));
			if(completePath && fileExistsSync(completePath)){
				settings = JSON.parse(fs.readFileSync(completePath, 'utf8'));
				console.log('GoDaddy config loaded: "' + completePath + '"');
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