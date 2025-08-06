import React, { useContext, useEffect, useState } from 'react';
import Modal from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { baseUrl } from '@/utils/config';
import { HTTPService } from '@/utils/http';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import { Icon } from '@iconify/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  capitalizeWords,
  excludedKeys,
  extractVariablesToObject,
} from './index';
import { zapierVariables } from '../../../(add-campaign)/add-campaign';

const ZapierTestModal = ({ isOpen, onClose, onOpen, agent, user }) => {
  const { session } = useContext(AgentsContext);
  const [formData, setFormData] = useState({});
  const [phoneNumber, setPhoneNumber] = useState('');

  const checkPhoneNumber = () => {
    if (`${phoneNumber}`.toString() < 11) {
      toast.error('Enter a valid phone number');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkPhoneNumber() === false) {
      toast.dismiss();
      return;
    }
    onClose();
    try {
      const body = {
        agent_id: agent?.agent_id,
        ...formData,
        to_number: phoneNumber.toString(),
      };
      const id = toast.loading(`Making call to ${phoneNumber}`);
      const res = await axios.post(
        `${baseUrl}/make-phone-call`,
        body,
        HTTPService.setHeaders({ user, session })
      );
      toast.success('Call made successfully');
      toast.dismiss();
    } catch (error) {
      toast.error('There was an error making the call');
      console.log(error);
    }
  };
  const handleFormFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (agent && agent.leads) {
      const { type, prompt, begin_message } = agent;

      const variableObj = extractVariablesToObject(begin_message, prompt);
      setFormData(variableObj);
    }
  }, [agent]);

  return (
    <div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex relative flex-col min-w-screen lg:min-w-[430px] outline-none">
          <div className="relative flex items-center gap-2 px-[30px] py-[20px] outline-none">
            <img src="/logo.png" className="w-6 h-6" alt="" />
            <h2 className="text-[14px] text-gray-700 font-medium">
              Make a test call with outbound/zapier assistant
            </h2>
            <div
              onClick={onClose}
              className="absolute cursor-pointer transition-all duration-300 ease-in top-[50%] translate-y-[-50%] hover:bg-slate-100 right-[15px] p-[3px] rounded-full "
            >
              <Icon
                icon="system-uicons:cross"
                style={{ color: 'rgb(25,25,25)' }}
              />
            </div>
          </div>
          <hr />
          <ScrollArea className="max-h-[60vh]">
            <form className=" flex flex-col bg-modalBody gap-4 px-[30px] py-[20px] rounded-b-[20px] min-w-[380px]">
              {Object.keys(formData).map(
                (key) =>
                  !excludedKeys.includes(key) && (
                    <div key={key} className="label-container">
                      <label className="label">{capitalizeWords(key)}*</label>
                      <Input
                        type="text"
                        name={key}
                        value={formData[key]}
                        onChange={handleFormFieldChange}
                        required
                        placeholder={`Enter ${capitalizeWords(key)}`}
                      />
                    </div>
                  )
              )}

              <div className="label-container">
                <label className="label">Phone Number*</label>
                <PhoneInput
                  inputProps={{ name: 'to_number' }}
                  onChange={(v) => setPhoneNumber(v)}
                  required
                  placeholder="Phone number of person you want to call"
                />
              </div>
            </form>
          </ScrollArea>
          <hr />
          <div className="px-[30px] py-[20px] bg-white rounded-[20px] flex justify-center items-center">
            <Button
              className="w-full"
              disabled={!phoneNumber}
              type="submit"
              onClick={handleSubmit}
            >
              Test Call
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ZapierTestModal;
