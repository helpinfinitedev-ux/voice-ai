import { FormatDate } from '@/utils/formatDates';

export const TableUtils = {
  getDateContactedAndLastAdded: (data) => {
    const { minStartTime, maxStartTime } = data.reduce(
      (acc, obj) => {
        if (
          acc.minStartTime === undefined ||
          obj.dateAdded < acc.minStartTime
        ) {
          acc.minStartTime = obj.dateAdded;
        }
        if (
          acc.maxStartTime === undefined ||
          obj.start_timestamp > acc.maxStartTime
        ) {
          acc.maxStartTime = obj.start_timestamp;
        }
        return acc;
      },
      { minStartTime: undefined, maxStartTime: undefined },
    );
    return {
      dateAdded: FormatDate.getDateInDDMMYYYY(minStartTime),
      dateLastContacted: FormatDate.getDateInDDMMYYYY(maxStartTime),
    };
  },
};
