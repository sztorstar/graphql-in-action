export const randomString = async (bytesSize = 32) => {
  let crypto;
  try {
    crypto = await import('crypto');
  } catch (err) {
    console.log('crypto support is disabled!');
  }
  
  const buf = crypto.randomBytes(bytesSize);
  console.log('lllllll');

  return buf.toString('hex');
}

export const extractPrefixedColumns = ({
  prefixedObject,
  prefix
}) => {
  const prefixRexp = new RegExp(`^${prefix}_(.*)`);
  return Object.entries(prefixedObject).reduce(
    (acc, [key,value]) => {
      const match = key.match(prefixRexp);
      if(match){
        acc[match[1]] = value;
      }
      return acc;
    }
  ,{})
}