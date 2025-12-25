// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';
process.env.HZERO_PATH = 'https://prd.hzero.org';
process.env.HZERO_AUTOMA_CLIEN_ID = 'HZERO_AUTOMA_CLIEN_ID';
process.env.HZERO_AUTOMA_CLIEN_KEY = 'HZERO_AUTOMA_CLIEN_KEY';
process.env.HZERO_INTERFACE_CODE = 'WEB_RPA_PLUGIN_INTERFACE';
process.env.HZERO_INTERFACE_LIST = 'huip-base.bsrpa-workflow.interfacelist';
process.env.HZERO_INTERFACE_CONFIG = 'huip-base.bsrpa-workflow.interfaceconfig';


const webpack = require('webpack');
const config = require('../webpack.config');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

webpack(config, function (err) {
  if (err) throw err;
});
