import dayjs from 'dayjs';

export const formatDate = (date: string | Date) => {
  return dayjs(date).toISOString();
};

export const formatNullableDate = (date: Date | null): string | null => {
  if (date === null) {
    return null;
  }

  return date?.toISOString();
};
