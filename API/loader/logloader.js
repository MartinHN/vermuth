const { getOptions } = require('loader-utils');
const validateOptions = require( 'schema-utils');

const schema = {
  type: 'object',
  properties: {
    suffix: {
      anyOf: [
      { type: "string" },
      ]
    }
  }
  
};

module.exports = function(source) {
  const loptions = getOptions(this) || {suffix:""};
  console.log(loptions.suffix+">>>", this.resourcePath);
  // console.log(source)
  return source;
}