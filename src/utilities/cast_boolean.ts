export const castBoolean = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return !!value;
};
