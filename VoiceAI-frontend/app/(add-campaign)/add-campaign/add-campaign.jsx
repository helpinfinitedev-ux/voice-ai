'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import FileIcon from '@/assets/FileIcon';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import {
  AddCampaignContext,
  defaultTransferTo,
} from '@/context/AddCampaignContext/AddCampaignContext';
import Loader from '@/components/loader';
import { Validations } from '@/utils/validations';
import useDisclosure from '@/hooks/useDisclosure';
import { FormatDate } from '@/utils/formatDates';
import { voices } from '@/app/(add-agent-form)/add-agent-form/_components';
import { getEditAgentVariables } from '@/app/(dashboard)/_components/zapier-test-modal';
import { EditCampaignContext } from '@/context/EditCampaignContext/EditCampaignContext';
import FileErrorModal from './_components/file-error-modal/file-error-modal';
import {
  getOptionsValidation,
  getUsers,
  phoneCombinations,
  selectOptions,
  zapierVariables,
} from './index';
import AddSchedule from '../_components/add-schedule/add-schedule';
import AddPrompt from '../_components/add-prompt/add-prompt';
import StepButtons from './step-buttons/step-buttons';

const allowedExtensions = ['csv'];

const AddCampaign = ({
  type,
  currentAgent,
  onCongratsModalOpen,
  setCreatedAgent,
  onModalClose,
  onEditCongratsModalOpen,
  onEditCongratsModalClose,
  setUpdatedAgent,
  isEditCampaignModalOpen,
  onEditCampaignModalClose,
}) => {
  const {
    parsedData,
    setParsedData,
    setUsers,
    step,
    users,
    nextStep,
    prevStep,
    data,
    setData,
    setVariables,
    selectedOptions,
    setSelectedOptions,
    requiredError,
    file,
    setFile,
    setRequiredError,
    addCampaignLoading,
    setName,
    setStep,
    setPrompt,
    setBeginMessage,
    zapier,
    setFormData,
    formData,
    setZapier,
    selectedButtons,
    setSelectedButtons,
    voice,
    setSelectedVoice,
    phoneNumberChecked,
    setPhoneNumberChecked,
    setTransferTo,
  } = useContext(AddCampaignContext);
  const { editCampaignModalLoading } = useContext(EditCampaignContext);
  const fileInputRef = useRef(null);
  const [originalFile, setOriginalFile] = useState(null);
  const {
    isOpen: isFileErrorOpen,
    onOpen: onFileErrorOpen,
    onClose: onFileErrorClose,
  } = useDisclosure();
  const handleFileChange = (e) => {
    if (e.target.files.length) {
      const inputFile = e.target.files[0];

      const fileExtension = inputFile?.type.split('/')[1];
      if (!allowedExtensions.includes(fileExtension)) {
        return;
      }

      setFile(inputFile);
    }
  };
  const handleParse = () => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async ({ target }) => {
      const csv = Papa.parse(target.result, {
        header: true,
      });
      const parsedData = csv?.data;
      const removeUnnecessaryObjects = parsedData.filter((obj) => {
        if (JSON.stringify(obj) === '{}') {
          return false;
        }
        for (const key in obj) {
          if (obj[key].trim() === '') {
            return false;
          }
        }

        return true;
      });
      setOriginalFile([...parsedData]);
      setParsedData([...removeUnnecessaryObjects]);

      const rows = Object.keys(parsedData[0]);

      const columns = Object.values(parsedData[0]);
      const res = rows.reduce((acc, e, i) => [...acc, [[e], columns[i]]], []);
      setData([...res]);
      setZapier(false);
    };
    reader.readAsText(file);
  };
  const optionsValidations = getOptionsValidation(selectedOptions);
  const validateSaveFields = () => optionsValidations;
  const checkRequiredFields = () => {
    for (const key in selectedOptions) {
      if (selectedOptions[key] === 'Phone Number') return false;
    }
    return true;
  };
  const getValidatedUsers = () => {
    const usersArray = getUsers(selectedOptions, parsedData);
    const validatedData = usersArray.filter((item) => {
      for (const key in item) {
        if (key.toLowerCase() === 'phone_number') {
          if (Validations.validatePhoneNumber(item[key])) return true;
        }
      }
      return false;
    });
    return validatedData;
  };
  const handleSaveFields = () => {
    if (checkRequiredFields()) {
      setRequiredError({ phoneNumber: 'Phone Number Is Required' });

      return;
    }
    if (validateSaveFields()) return;

    setUsers(getValidatedUsers());
    setVariables(
      Object.entries(selectedOptions)
        .map(([key, value]) => {
          if (selectedOptions[key] !== '') {
            return {
              title: value,
              variable: value.toLowerCase().split(' ').join('_'),
            };
          }
        })
        .filter((variable) => variable !== undefined),
    );

    // nextStep();
  };
  const handleAddThroughZapier = () => {
    setVariables(
      Object.entries(zapierVariables)
        .map(([key, value]) => {
          if (selectedOptions[key] !== '') {
            return {
              title: key,
              variable: value.toLowerCase().split(' ').join('_'),
            };
          }
        })
        .filter((variable) => variable !== undefined),
    );
    setZapier(true);
    nextStep();
  };
  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset the value of the file input
    }
  };
  useEffect(() => {
    if (data?.length > 0) {
      const obj = {};
      data.forEach((item) => {
        const option = selectOptions.find(
          (element) => element.title.toLowerCase() === item[0][0].toLowerCase(),
        );
        obj[item[0][0]] = option ? option.title : '';
      });
      setSelectedOptions({ ...obj });
    }
  }, [data]);
  useEffect(() => {
    file && handleParse();
  }, [file]);
  useEffect(() => {
    if (type === 'edit' && currentAgent) {
      console.log('currentAgent', currentAgent);
      console.log('currentAgent', currentAgent.type === 'outbound-zapier');
      setStep(2);
      setSelectedButtons(
        voices.findIndex((item) => item.id === currentAgent?.voice_id),
      );
      setSelectedVoice(voices[selectedButtons]);
      setName(currentAgent?.name);
      setPrompt(currentAgent?.prompt);
      setBeginMessage(currentAgent?.begin_message);
      setZapier(currentAgent?.type === 'outbound-zapier');
      setVariables(() => getEditAgentVariables(currentAgent));
      setFormData({
        ...formData,
        start_time: currentAgent?.start_time,

        duration: currentAgent?.duration,
        campaign_start_date: currentAgent?.campaign_start_date,
        timezone: currentAgent?.timezone,
      });
      setTransferTo(
        currentAgent?.transfer_events?.length > 0
          ? currentAgent?.transfer_events.map((item) => ({
              name: item.name,
              scenario: item.scenario,
              phone: item.phone_number,
            }))
          : defaultTransferTo,
      );
      setPhoneNumberChecked(currentAgent?.transfer_events?.length > 0);
    } else {
      setSelectedButtons(0);
      setSelectedVoice('');
    }
  }, [currentAgent]);

  if (editCampaignModalLoading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  return (
    <>
      <div className="border-b-[1px] lg:border-b-[0px] border-gray-200">
        <div className="h-[60vh] hide-scrollbar bg-slate-container overflow-scroll">
          <div className="flex w-full  mx-auto items-center flex-col gap-[32px] py-[24px]">
            <div className="flex flex-col gap-[16px] w-[90%] mx-auto ">
              {!file && step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="w-full flex flex-col gap-[16px] text-gray-700 items-center text-[22px] font-semibold">
                    Upload CSV File
                    <label
                      htmlFor="csvInput"
                      className="font-bold w-full mx-auto cursor-pointer border-dashed border-[1px] justify-center flex items-center gap-[16px] p-[12px] rounded-[12px] border-gray-700  text-[32px]"
                    >
                      <div className="flex flex-col gap-[8px] items-center">
                        <img
                          src="/fileupload.png"
                          alt=""
                          className="w-12 h-12"
                        />
                        <p className="text-gray-700 font-medium underline text-[14px]">
                          Click To Upload
                        </p>
                      </div>
                    </label>
                  </div>
                  {type !== 'edit' && (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-[1px] w-[47%] bg-gray-400" />
                      <p className="text-gray-600 text-[13px]">or</p>
                      <div className="h-[1px] w-[47%] bg-gray-400" />
                    </div>
                  )}
                  {type !== 'edit' && (
                    <div className="w-full">
                      <Button
                        onClick={() => {
                          handleAddThroughZapier();
                        }}
                        className="w-full"
                      >
                        Make a call based on a zapier trigger
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                id="csvInput"
                name="file"
                type="File"
              />
              {file && (
                <div className="flex gap-[8px] items-center justify-center">
                  <p className="text-center font-semibold text-[18px]">
                    {file?.name}
                  </p>
                  <label
                    htmlFor="csvInput"
                    className="text-[13px] underline cursor-pointer font-medium"
                  >
                    <p>Click To Change</p>
                  </label>
                </div>
              )}
              {file && step === 1 && (
                <div className="flex justify-between items-center">
                  <div className="flex flex-col text-red-500 font-bold text-[16px]">
                    {checkRequiredFields() && requiredError.phoneNumber && (
                      <p>{requiredError.phoneNumber}</p>
                    )}
                    {optionsValidations ? (
                      <p className="font-bold text-red-400 text-[16px] ">
                        {optionsValidations}
                      </p>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )}
              {file && step === 1 && (
                <div className="py-[32px] pl-2 w-full flex flex-col gap-[16px]">
                  {data.map((e, i) => (
                    <div
                      key={i}
                      className="min-w-[50%] py-[12px] border-b-[1px] border-b-neutral-200 flex justify-between items-center"
                    >
                      <div className="text-gray-700 font-medium text-[18px]">
                        {e[0]}
                      </div>
                      <div className="flex items-center gap-[12px]">
                        {selectedOptions[e[0][0]] !== 'Custom Field' &&
                          (selectedOptions[e[0][0]] === '' ||
                            selectOptions.some(
                              (element) =>
                                element.title === selectedOptions[e[0][0]],
                            )) && (
                            <Select
                              value={selectedOptions[e[0][0]]}
                              onValueChange={(value) =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [e[0][0]]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a Field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {selectOptions.map((item, idx) => (
                                    <SelectItem key={idx} value={item.title}>
                                      {item.title}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        {selectedOptions[e[0][0]] === 'Custom Field' ||
                        (!selectOptions.some(
                          (element) =>
                            element.title === selectedOptions[e[0][0]],
                        ) &&
                          selectedOptions[e[0][0]] !== '') ? (
                          <Input
                            onChange={(event) =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [e[0][0]]: event.target.value,
                              }))
                            }
                            placeholder="Enter Custom Field"
                            type="text"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && <AddPrompt />}
              {step === 3 && (
                <AddSchedule
                  onCongratsModalOpen={onCongratsModalOpen}
                  setCreatedAgent={setCreatedAgent}
                  onModalClose={onModalClose}
                  prevStep={prevStep}
                />
              )}
            </div>
          </div>
        </div>
        <div className="py-[24px] flex justify-center gap-[12px] flex-row-reverse">
          {addCampaignLoading ? (
            <Button variant="w-full outline">
              <Loader width="24px" height="24px" />
            </Button>
          ) : (
            <StepButtons
              setUpdatedAgent={setUpdatedAgent}
              onEditCongratsModalClose={onEditCongratsModalClose}
              onEditCongratsModalOpen={onEditCongratsModalOpen}
              handleSaveFields={handleSaveFields}
              type={type}
              setCreatedAgent={setCreatedAgent}
              onModalClose={onModalClose}
              onCongratsModalOpen={onCongratsModalOpen}
              originalFile={parsedData}
              parsedFile={getValidatedUsers()}
              onFileErrorOpen={onFileErrorOpen}
              currentAgent={currentAgent}
              onEditCampaignModalClose={onEditCampaignModalClose}
            />
          )}
        </div>
      </div>
      <FileErrorModal
        nextStep={nextStep}
        isOpen={isFileErrorOpen}
        originalFile={parsedData}
        parsedFile={getValidatedUsers()}
        onClose={onFileErrorClose}
        onClick={() => {
          onFileErrorClose();
          handleSaveFields();
          nextStep();
        }}
        onCancelClick={() => {
          onFileErrorClose();
          handleReset();
          setFile('');
        }}
      />
    </>
  );
};

export default AddCampaign;
