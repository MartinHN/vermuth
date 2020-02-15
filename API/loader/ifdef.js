

module.exports = function(source,defines,doLog){
  // process code
  let ifCondition = undefined
  
  let i = -1;
  let isDumping = false;
  const res = []
  for(let l of source.split('\n')){
    i++;
    const nonTrimmed=l
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
        res.push(nonTrimmed)
      }
      else{
        res.push("//"+nonTrimmed); // keep blank line to preserve line numbers
        if(doLog){console.log("removing ",l)}
      }
    }

    

  }

  if(ifCondition!==undefined){throw 'not found closing endif ';}

  
  return res.join('\n') || "";
}