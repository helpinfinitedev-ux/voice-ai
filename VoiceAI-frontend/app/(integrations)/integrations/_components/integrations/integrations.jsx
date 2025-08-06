'use client';

import React, { useContext, useEffect, useState } from 'react';
import PageHeading from '@/components/custom/page-heading';
import { Button } from '@/components/ui/button';
import Loader from '@/components/loader';
import { Icon } from '@iconify/react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import axios from 'axios';
import { baseUrl, calendlyUrl } from '@/utils/config';
import TooltipComp from '@/components/tooltip-comp';
import { HTTPService } from '@/utils/http';
import RemoveCalendly from '../remove-calendly/remove-calendly';

const Integrations = () => {
  const [copied, setCopied] = useState(false);
  const { user, reloadUser, session } = useContext(AgentsContext);
  const [calendlyIntegrationLoading, setCalendlyIntegrationLoading] =
    useState(false);
  const [generateKeyLoading, setGenerateKeyLoading] = useState(false);
  const [generateKey, setGenerateKey] = useState('');

  const fetchAPIKey = async () => {
    try {
      setGenerateKeyLoading(true);
      const user_id = user?.id;
      const res = await axios.get(
        `${baseUrl}/users/${user_id}/api-key`,
        HTTPService.setHeaders({ user, session })
      );
      setGenerateKey(res.data.api_key);
    } catch (error) {
      console.log(error);
    } finally {
      setGenerateKeyLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      setGenerateKeyLoading(true);
      const res = await axios.post(
        `${baseUrl}/users/${user?.id}/api-key`,
        {},
        HTTPService.setHeaders({ user, session })
      );
      setGenerateKey(res.data.api_key);
    } catch (error) {
      console.log(error);
    } finally {
      setGenerateKeyLoading(false);
    }
  };
  const onCopy = () => {
    navigator.clipboard.writeText(generateKey);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (user) {
      fetchAPIKey();
    }
  }, [user]);

  return (
    <div>
      <PageHeading heading="Integrations" />
      <div className="bg-gray-50 w-full h-[calc(100vh-230px)] overflow-auto">
        <div className="flex flex-col w-[90%] mx-auto mt-6">
          <div className="flex items-start gap-3">
            <div className="relative w-[1px] min-h-[200px] bg-gray-500">
              <div className="bg-gray-500 rounded-full absolute top-0 left-[50%] translate-x-[-50%] w-[8px] h-[8px]" />
            </div>
            <div className="w-[100%] px-4 mx-auto flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-[1px]">
                  <h1 className="text-[20px] text-gray-800 font-medium">
                    {generateKey ? 'Zapier' : 'Add Zapier'}
                  </h1>
                  {generateKey ? (
                    <p className="text-gray-600 font-normal text-[13px]">
                      Zapier <span className="font-semibold">API Key</span> has
                      been generated
                    </p>
                  ) : (
                    <p className="text-gray-600 font-normal text-[13px]">
                      To integrate zapier, generate the zapier{' '}
                      <span className="font-semibold">API Key</span>
                    </p>
                  )}
                </div>
              </div>
              {generateKeyLoading ? (
                <Loader width="24px" height="24px" />
              ) : generateKey ? (
                <div className="mr-[-15px] w-[fit-content] border-gray-300 border-[1px] gap-4 flex items-center  h-8 px-4 py-1 bg-white rounded-lg text-gray-500 font-normal text-[11px]">
                  <p>{generateKey}</p>
                  {copied ? (
                    <div className="p-[6px]">
                      <Icon
                        icon="ic:baseline-check"
                        className="w-[14px] h-[14px] cursor-pointer"
                        style={{ color: '#636363' }}
                      />
                    </div>
                  ) : (
                    <TooltipComp
                      trigger={
                        <div className="transition duration-200 ease-in hover:bg-gray-200 rounded-sm p-[6px]">
                          {' '}
                          <Icon
                            onClick={onCopy}
                            icon="oui:copy-clipboard"
                            className="w-[14px] h-[14px] cursor-pointer"
                            style={{ color: '#636363' }}
                          />
                        </div>
                      }
                      value={<p className="text-[12px]">Copy To Clipboard</p>}
                    />
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleGenerateKey}
                  className="text-sm max-w-[140px]"
                  size="sm"
                >
                  Generate API Key
                </Button>
              )}
            </div>
          </div>
          <div className="gap-3 flex items-start">
            <div className="relative w-[1px] h-[200px] bg-gray-500">
              <div className="bg-gray-500 rounded-full absolute top-0 left-[50%] translate-x-[-50%] w-[8px] h-[8px]" />
              <div className="bg-gray-500 rounded-full absolute bottom-0 left-[50%] translate-x-[-50%] w-[8px] h-[8px]" />
            </div>
            <div className="w-[100%] px-4 mx-auto flex flex-col gap-8">
              {user?.publicMetadata.calendlyIntegrated ? (
                <RemoveCalendly />
              ) : (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col gap-[1px]">
                    <h1 className="text-[20px] text-gray-800 font-medium">
                      Add Calendly
                    </h1>
                    <p className="text-gray-600 font-normal text-[13px]">
                      To integrate calendly, click on the button below
                    </p>
                  </div>
                  {calendlyIntegrationLoading ? (
                    <Loader width="24px" height="24px" />
                  ) : (
                    <Button
                      onClick={() => {
                        setCalendlyIntegrationLoading(true);
                        window.open(`${calendlyUrl}`, '_blank');
                        setTimeout(() => {
                          reloadUser().then(() => {
                            setCalendlyIntegrationLoading(false);
                          });
                        }, 10000);
                      }}
                      className="text-sm max-w-[140px]"
                      size="sm"
                    >
                      Add Calendly
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
