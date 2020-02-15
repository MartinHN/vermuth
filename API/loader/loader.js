const { getOptions } = require('loader-utils');
const validateOptions = require( 'schema-utils');
const rmIfDef = require('./ifdef')

const schema = {
  type: 'object',
  properties: {
    defines: {
      anyOf: [
      { type: "array" },
      { type: "object" },
      { type: "string" },
      ]
    }
  }
  
};


module.exports = function(source) {
  const loptions = getOptions(this) || {defines:{}};
  validateOptions(schema, loptions, 'if preprocessor Loader');
  let defines = loptions.defines
  if(Array.isArray(defines)){
    obj = {}
    defines.map(e=>obj[e]=true)
    defines = obj;
  }
  else if(typeof defines==="string"){
    defines = {[defines]:true}
  }

  return rmIfDef(source,defines)
}