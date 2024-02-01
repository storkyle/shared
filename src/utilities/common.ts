export function getValidArray<T>(array?: T[]): T[] {
  if (array === undefined) {
    return [];
  }
  return Array.isArray(array) ? array : [];
}

export function isEmptyArray<T>(array?: T[]): boolean {
  return getValidArray(array).length === 0;
}

export function pickBy(obj: any, keys: string[]): any {
  if (obj == null) {
    return {};
  }
  const result: any = {};

  keys.forEach((el) => {
    result[el] = obj[el];
  });
  return result;
}

export function trimKeys(object: { [key: string]: any }, keys: string[]) {
  const result = { ...object };
  keys.forEach((el) => {
    delete result[el];
  });
  return result;
}

export function checkOverlapTime(range1: [Date, Date], range2: [Date, Date]): boolean {
  const [start1, end1] = range1;
  const [start2, end2] = range2;

  return start1 < end2 && start2 < end1;
}
