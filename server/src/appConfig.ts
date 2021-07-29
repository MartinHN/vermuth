const path = require('path');
const yargs = require('yargs');
const argsToParse = yargs.help().alias('help', 'h');
const validArgs = {};
let argv: any = undefined;

envOrCliArg('PORT', 3005, 'OSCPort to listen to');
envOrCliArg('module', '', 'loads script file dynamically');
envOrCliArg('CUSTOM_PI_DRIVERS', true)
envOrCliArg('LOG_MSG', false);
envOrCliArg('RESSOURCE_FOLDER', path.resolve(__dirname, '../../ressources'))
envOrCliArg('PUBLIC_FOLDER', path.resolve(__dirname, '../dist/server/public'))
// const publicDir = debugMode ? path.join(__dirname, '../dist/server/public') :
// path.join(__dirname, '../public');



export function parseCliCommands() {
  argv = argsToParse.argv;
}

function getParserForType(type: string, nameInfo: string|undefined) {
  if (type === 'float') {
    return parseFloat
  }
  if ((type === 'number') || (type === 'int')) {
    return parseInt
  }
  if (type === 'boolean') {
    return (a: any) => {
      return !!a
    }
  }

  if (type !== 'string') {
    console.error('unknown type', type, nameInfo);
  }
  return (a: any) => {
    return a
  };
}

function envOrCliArg(
    name: string, defaultValue: any = undefined, description = '',
    type: string|undefined = undefined) {
  const guessedType = type || typeof (defaultValue)
  argsToParse.option(name, {
    alias: name[0],
    description,
    type: guessedType,
  })
  validArgs[name] = {defaultValue, type: guessedType};
}



export function getConfig(name: string) {
  if (!Object.keys(validArgs).includes(name)) {
    console.error('config error', name, 'unknown')
    return undefined;
  }
  const a = validArgs[name];
  let res: any = undefined
  if (process.env[name] !== undefined) {
    res = process.env[name]
  }
  else if (argv[name] !== undefined) {
    res = argv[name];
  }
  else {
    res = a.defaultValue;
  }
  if (res !== undefined) {
    return getParserForType(a.type, name)(res);
  }
}
