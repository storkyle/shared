export const trimData = (data: any): any => {
  let result: any;
  const typeOfData = typeof data;

  switch (typeOfData) {
    case 'string':
      result = trimStr(data);
      if (!result) result = null;
      break;

    case 'object':
      if (data !== null) {
        if (Array.isArray(data)) {
          result = [];
          Object.keys(data).forEach((el: string): void => {
            result.push(trimData(data[parseInt(el)]));
          });
        } else {
          result = {};
          Object.keys(data).forEach((el) => {
            result[el] = trimData(data[el]);
          });
        }
        break;
      }
      result = data;
      break;

    default:
      result = data;
      break;
  }

  return result;
};

const trimStr = (str: string): string => {
  if (!str) return '';
  let trimmedString = str.trim();

  if (trimmedString === '') return '';

  while (trimmedString.includes('  ')) {
    trimmedString = trimmedString.replace('  ', ' ');
  }

  return trimmedString;
};
