'use client';

import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';

const UsersListDrawer = ({
  currentCampaign,
  setIsOpen,
  isOpen,
  onClose,
  onOpen,
}) => (
  <Drawer
    direction="right"
    open={isOpen}
    onOpenChange={setIsOpen}
    onClose={onClose}
    className="rounded-l-lg"
  >
    <DrawerContent className="h-screen rounded-l-md top-0 right-0 left-auto mt-0 min-w-[450px]">
      <ScrollArea className="h-screen">
        <DrawerHeader>
          <DrawerTitle className="text-[36px] font-semibold flex justify-between items-center">
            Leads
          </DrawerTitle>
        </DrawerHeader>
        <div>
          {currentCampaign?.leads.map((item, idx) => (
            <div
              className={`p-[16px] ${
                idx % 2 === 1 ? 'bg-neutral-100' : 'bg-white'
              } flex justify-between items-center`}
            >
              <p>Phone Number</p>
              <p>{item.phone_number}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DrawerContent>
  </Drawer>
);
export default UsersListDrawer;
