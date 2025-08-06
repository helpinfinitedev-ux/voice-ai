'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from '@/components/ui/table';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import Modal from '@/components/modal';
import useDisclosure from '@/hooks/useDisclosure';
import Loader from '@/components/loader';
import axios from 'axios';
import { useContext, useState, useEffect } from 'react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { FormatDate, getTimeString } from '@/utils/formatDates';
import { baseUrl } from '@/utils/config';
import UsersListDrawer from '../users-list-drawer/users-list-drawer';
import { getAgentName } from './index';

const Campaigns = () => {
  const {
    isOpen: isDrawerOpen,
    onClose: onDrawerClose,
    onOpen: onDrawerOpen,
    setIsOpen: setIsDrawerOpen,
  } = useDisclosure();
  const { agents, user, isLoading } = useContext(AgentsContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [agentDeleteLoading, setAgentDeleteLoading] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState();

  const fetchCampaigns = (user) => {
    axios
      .get(`${baseUrl}/users/${user?.id}/campaigns`)
      .then((res) => {
        setCampaigns(res.data);
        setCampaignsLoading(false);
      })
      .catch((err) => console.log(err));
  };
  const onDelete = async (agent) => {
    setAgentDeleteLoading(agent.agent_id);
    try {
      await axios.delete(`${baseUrl}/${user?.id}/agents/${agent.agent_id}`);
      // await fetchAgents(user);
    } catch (error) {
      console.error(error);
    } finally {
      setAgentDeleteLoading(null);
      onClose();
    }
  };
  useEffect(() => {
    if (user && agents.length > 0) {
      fetchCampaigns(user);
    }
  }, [user, agents]);
  const prompt =
    'Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll Michael Sroll ';
  return (
    <div>
      <Table className="w-[90%] m-auto my-[32px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Campaign</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Prompt</TableHead>
            <TableHead>Begin</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Schedule</TableHead>

            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns?.map((item, idx) => (
            <TableRow onMouseLeave={() => setIsPopoverOpen(null)}>
              <TableCell className="font-medium w-[5%]">{idx + 1}.</TableCell>
              <TableCell>{getAgentName(agents, item.agent_id)}</TableCell>
              <TableCell>
                {' '}
                <Popover open={isPopoverOpen === idx}>
                  <PopoverTrigger className="border-none outline-none">
                    <p
                      className="text-left"
                      onMouseEnter={() => setIsPopoverOpen(idx)}
                    >
                      {item.prompt.substring(0, 120)}
                      {item.prompt.length > 120 && '...'}
                    </p>
                  </PopoverTrigger>
                  <PopoverContent onMouseLeave={() => setIsPopoverOpen(null)}>
                    <p className="text-[14px]">{item.prompt}</p>
                  </PopoverContent>
                </Popover>
              </TableCell>

              <TableCell>{item.begin_message_template}</TableCell>

              <TableCell>{item.duration}m</TableCell>
              <TableCell className="w-[20%]">
                {FormatDate.getDateInDDMMYYYY(item.start_time)} -{' '}
                {FormatDate.getTimeInAMPM(item.start_time)}
              </TableCell>

              <TableCell className="flex items-center gap-[18px]">
                <Button onClick={onOpen} size="sm">
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setCurrentCampaign(item);
                    onDrawerOpen();
                  }}
                >
                  View Leads
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col gap-[36px]">
          <p className="text-[20px] font-semibold">
            Are you sure you want to delete
          </p>
          {agentDeleteLoading ? (
            <div className="flex justify-end">
              <Loader width="24px" height="24px" />
            </div>
          ) : (
            <div className="flex justify-end gap-[12px]">
              <Button onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button onClick={() => onDelete(currentCampaign)}>Delete</Button>
            </div>
          )}
        </div>
      </Modal>
      <UsersListDrawer
        onOpen={onDrawerOpen}
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        setIsOpen={setIsDrawerOpen}
        currentCampaign={currentCampaign}
      />
    </div>
  );
};
export default Campaigns;
