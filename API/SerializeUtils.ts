export function buildEscapedJSON(content: any, indent?: number) {
  function filterPrivate(key: string, value: any) {
    if (key.startsWith('__')) {
      // console.log('ignoring', key);
      return undefined;
    } else { return value; }

  }
  return JSON.stringify(content, filterPrivate, indent);
}

export function buildEscapedObject(content: any, indent?: number) {
  return JSON.parse(buildEscapedJSON(content));
}

