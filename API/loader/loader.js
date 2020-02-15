const { getOptions } = require('loader-utils');
const validateOptions = require( 'schema-utils');

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


  // process code
  let ifCondition = undefined
  
  let i = -1;
  let isDumping = false;
  const res = []
  for(let l of source.split('\n')){
    i++;
    l=l.trimStart()
    
    const isIf = l.startsWith("// #if")// || l.startsWith("//#elif")
    if(isIf){
      let name = l.substr(6).trim();
      // let name = l.substr(l.startsWith("// #if")?5:7).trim();
      let testVal = true;
      if( name.startsWith("!")){
        testVal = false;
        name = name.substr(1).trim();
      }
      ifCondition = defines[name] !==undefined && testVal===!!defines[name]
      isDumping = !ifCondition
      res.push(l); // keep  line to preserve line numbers
    }
    else if(l.startsWith("// #else")){
      if(ifCondition===undefined){throw 'unmatched else at line '+i;}
      ifCondition = !ifCondition
      isDumping = !ifCondition;
      res.push(l); // keep  line to preserve line numbers
    }
    else if(l.startsWith("// #endif")){
      if(ifCondition===undefined){throw 'unmatched endif at line '+i;}
      isDumping = false
      ifCondition = undefined
      res.push(l); // keep  line to preserve line numbers
      
    }
    else{
      if(!isDumping){
        res.push(l)
      }
      else{
        res.push(""); // keep blank line to preserve line numbers
        console.log("removing ",l)
      }
    }

    

  }

  if(ifCondition!==undefined){throw 'not found closing endif ';}

  
  return res.join('\n') || "";
}