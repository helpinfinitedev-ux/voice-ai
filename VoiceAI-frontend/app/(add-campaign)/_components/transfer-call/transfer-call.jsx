import React, { useContext } from 'react';
import { InboundContext } from '@/context/InboundContext/InboundContext';
import { AddCampaignContext } from '@/context/AddCampaignContext/AddCampaignContext';
import PhoneInput from 'react-phone-input-2';
import Textarea from '@/components/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import TrashIcon from '@/assets/TrashIcon';

const defaultTransferToObject = {
  name: '',
  phone: '',
  scenario: '',
};
const TransferCall = () => {
  const { transferTo, setTransferTo } = useContext(AddCampaignContext);
  const setPhone = (index, value) => {
    const updatedTransferTo = transferTo.map((item, i) => {
      if (i === index) {
        return { ...item, phone: value };
      }
      return item;
    });
    setTransferTo(updatedTransferTo);
  };

  const setName = (index, value) => {
    const updatedTransferTo = transferTo.map((item, i) => {
      if (i === index) {
        const newName = item.name.startsWith('transfer_')
          ? value
          : `transfer_${value}`;
        return { ...item, name: newName };
      }
      return item;
    });
    setTransferTo(updatedTransferTo);
  };

  const setScenario = (index, value) => {
    const updatedTransferTo = transferTo.map((item, i) => {
      if (i === index) {
        return { ...item, scenario: value };
      }
      return item;
    });
    setTransferTo(updatedTransferTo);
  };
  const handleAddScenario = () => {
    setTransferTo([...transferTo, defaultTransferToObject]);
  };
  const handleDeleteScenario = (idx) => {
    transferTo.splice(idx, 1);
    setTransferTo([...transferTo]);
  };
  console.log(transferTo);
  return (
    <div className="mt-3">
      {' '}
      <div className="flex flex-col gap-8">
        {transferTo.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="label-container">
                <div className="flex items-end justify-between">
                  <label className="label">
                    Phone number to which the call will be transferred*
                  </label>
                  {transferTo.length > 1 && (
                    <Button
                      onClick={() => handleDeleteScenario(idx)}
                      variant="ghost"
                      className="hover:text-red-400 transition-all duration-200 ease-in h-[fit-content] pr-1 py-0 text-[12.5px] cursor-pointer"
                    >
                      Delete Scenario
                    </Button>
                  )}
                </div>
                <PhoneInput
                  value={item.phone}
                  onChange={(e) => setPhone(idx, e)}
                  placeholder="Enter phone number to transfer the call to"
                  className="!w-full"
                />
              </div>
              <div className="label-container">
                <label className="label">Scenario Name*</label>
                <Input
                  value={item.name}
                  onChange={(e) => setName(idx, e.target.value)}
                  placeholder="Give a unique name to the transfer call scenario"
                />
              </div>
              <div className="">
                <div className="label-container">
                  <h1 className="label">
                    In what scenarios will the call be transferred and to who
                  </h1>
                  <Textarea
                    value={item.scenario}
                    onChange={(e) => setScenario(idx, e.target.value)}
                    showLimit={false}
                    placeholder="In what scenarios will the call be transferred and to who"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleAddScenario}
          variant="ghost"
          className="ml-auto flex gap-2 font-medium text-[13px] items-center"
        >
          <Icon icon="fluent:add-32-regular" /> Add More Transfer Scenarios
        </Button>
      </div>
    </div>
  );
};

export default TransferCall;
