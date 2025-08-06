import React, { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { timeZones } from '.';

const TimeZones = ({
  value,
  type,
  handleFormFieldChange,
  timezone,
  setTimezone,
}) => (
  // useEffect(() => {
  //   const selectItems = document.querySelectorAll('SelectItem');

  //   selectItems.forEach((item) => {
  //     item.value = item.innerText;
  //   });
  // }, []);
  // console.log(timezone);
  <Select
    onValueChange={(value) => {
      if (type !== 'inbound') {
        handleFormFieldChange({
          target: {
            name: 'timezone',
            value,
          },
        });
      }

      setTimezone(value);
    }}
    id="timezone"
    name="timezone"
    className="custom-Select"
    value={timezone}
  >
    <SelectTrigger className="w-[100%]">
      <SelectValue placeholder="Select a Timezone" />
    </SelectTrigger>
    <SelectContent>
      {timeZones.map((item) => (
        <SelectItem value={item}>{item}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);
export default TimeZones;
