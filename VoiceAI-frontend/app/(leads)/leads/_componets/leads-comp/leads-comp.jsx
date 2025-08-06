'use client';

import React, { useContext, useState } from 'react';

import { LeadsContext } from '@/context/LeadsContext/LeadsContext';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import TableComp from '../table/table';

const LeadsComp = () => {
  const { allLeads } = useContext(LeadsContext);
  const [inputString, setInputString] = useState('');
  return (
    <div>
      <div className="flex w-[90%] mx-auto justify-between items-center py-8">
        <div>
          <h1 className=" font-normal text-gray-600 text-2xl">Leads</h1>
        </div>
        {allLeads?.length > 0 && (
          <div className="relative w-[300px]">
            <Input
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Search leads by phone number"
              className="py-[20px] w-full rounded-[10px] border-gray-300 border-[1px]"
            />
            <div className="absolute top-[53%] translate-y-[-50%] right-[14px]">
              <Icon icon="uil:search" style={{ color: 'grey' }} />
            </div>
          </div>
        )}
      </div>
      <hr />
      {/* <Table className="w-[90%] m-auto my-[32px]">
      <TableHeader className="border-none">
        <TableRow className="border-none bg-gray-50">
          <TableHead className="w-[200px]">Campaign</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Prompt</TableHead>
          <TableHead>Begin</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Schedule</TableHead>

          <TableHead>Delete</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className=" mt-2 rounded-[20px] !overflow-hidden">
        {Array.from({ length: 20 }, (_, idx) => (
          <TableRow
            key={idx}
            className="bg-gray-200 !overflow-hidden rounded-[20px]"
          >
            <TableCell className="font-medium w-[5%]">{idx + 1}.</TableCell>
            <TableCell />
            <TableCell />
            <TableCell>Sample</TableCell>
            <TableCell>sample</TableCell>
            <TableCell className="w-[20%]">sample</TableCell>
            <TableCell className="flex items-center gap-[18px]">
              <Button size="sm">Delete</Button>
              <Button>View Leads</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table> */}
      <TableComp inputString={inputString} />
    </div>
  );
};

export default LeadsComp;
