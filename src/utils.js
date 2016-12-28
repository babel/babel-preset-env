export const _extends = Object.assign || function (target) {
  for (let i = 1; i < arguments.length; i++) {
    const source = arguments[i];
    for (let key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

export const desemverify = (version) => {
  return parseFloat(version);
};

export const semverify = (version) => {
  const isInt = version % 1 === 0;
  const stringified = version.toString();
  const strEnd = isInt ? '.0.0' : '.0';
  return stringified + strEnd;
};

