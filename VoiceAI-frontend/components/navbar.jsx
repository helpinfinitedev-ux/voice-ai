'use client';

import Link from 'next/link';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

import { usePathname } from 'next/navigation';
import Divider from '@/assets/Divider';
import { useContext } from 'react';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import { Progress } from '@/components/ui/progress';
import { FormatDate } from '@/utils/formatDates';
import { InboxContext } from '@/context/InboxContext/InboxContext';
import useDisclosure from '@/hooks/useDisclosure';
import usePaymentModal from '@/hooks/usePaymentModal';
import { Button } from './ui/button';
import NavTabs from './custom/nav-tabs';
import PopoverHover from './custom/popover-hover';
import UpgradeMessage from './upgrade-message';
import TooltipComp from './tooltip-comp';

const Navbar = () => {
  // if (isLoaded && !isSignedIn) {
  //   return redirect('/sign-in');
  // }
  const { onOpen } = usePaymentModal();
  const { isOpen: isHoverPopoverOpen, setIsOpen: setIsHoverPopoverOpen } =
    useDisclosure();
  const { currentUser } = useContext(AgentsContext);
  const { value } = useContext(InboxContext);
  const forbiddenRoutes = [
    'sign-in',
    'sign-up',
    'edit-agent-form',
    'add-agent-form',
  ];

  const pathname = usePathname();
  const showNavbar = !forbiddenRoutes.includes(pathname.split('/')[1]);
  const showUpgradeMessage = () =>
    value >= 100 || FormatDate.getDaysLeft(currentUser?.plan?.end_date) < 0;

  return showNavbar ? (
    <div className="border-b-[1px] border-neutral-200">
      <div className="flex items-center justify-between w-[98%] md:w-[92%] pb-[12px] m-auto pt-6 px-6">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center overflow-hidden">
              <img
                src="/permian.jpg"
                alt="logo"
                className="w-[32px] h-[32px] hidden md:block rounded-full overflow-hidden"
              />
            </div>
          </Link>
          <nav className=" flex items-end gap-[6px] ml-[-10px]">
            {/* <Link className="text-gray-600 hover:text-gray-900" href="/">
              Dashboard
            </Link> */}
            <div className="hidden md:block">
              <Divider className="hidden h-9 w-9 text-gray-200 sm:ml-3 sm:block" />
            </div>

            {/* <Popover>
              <PopoverTrigger>
                <div className="hover:bg-gray-100 md:px-[6px] py-[5px] transition-all duration-300 cursor-pointer ease-in-out rounded-md flex items-center gap-[12px]">
                  <img
                    className="w-[32px] h-[32px] rounded-full"
                    src={user?.imageUrl}
                    alt=""
                  />
                  <p className="font-medium text-sm">{user?.fullName}</p>
                  <ChevronsUpDown className="text-neutral-700 w-4 h-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="center">
                <p className="border-b-[1px] border-gray-100 px-8 cursor-pointer container-effect py-[9px] text-effect text-[12.5px]">
                  My Workspaces
                </p>
                {[1, 2, 3].map((item, idx) => (
                  <div
                    key={idx}
                    className="container-effect text-[14px] px-8 py-[9px] cursor-pointer text-neutral-700 font-medium flex items-center gap-[8px]"
                  >
                    <Initials
                      name="Whatever"
                      width="28px"
                      height="28px"
                      fontSize="10px"
                    />
                    <p className="">Workspace {idx + 1}</p>
                  </div>
                ))}
                <div className="container-effect px-8 py-[9px] cursor-pointer text-neutral-700 font-medium flex items-center gap-[12px]">
                  <Icon
                    className="w-[24px] h-[24px]"
                    icon="icons8:plus"
                    style={{ color: 'rgb(52,52,52)' }}
                  />
                  <p className="text-[15px]">Add A Worksapce</p>
                </div>
              </PopoverContent>
            </Popover> */}
            {showUpgradeMessage() ? (
              <UpgradeMessage
                daysLeft={FormatDate.getDaysLeft(currentUser?.plan?.end_date)}
              />
            ) : (
              <div className=" flex min-w-[200px] flex-col gap-[2px] self-center">
                {/* <Tag>Unlimited Agents</Tag> */}
                <div className="flex w-[97%]  items-center justify-between">
                  <h2
                    className={`${
                      value < 90 ? 'text-gray-600' : 'text-red-400'
                    } font-medium text-[11px]`}
                  >
                    {currentUser?.plan.conversations} Conversations left
                  </h2>
                  <h2
                    className={`${
                      FormatDate.getDaysLeft(currentUser?.plan?.end_date) > 2
                        ? 'text-gray-600'
                        : 'text-red-400'
                    } font-medium text-[11px]`}
                  >
                    {FormatDate.getDaysLeft(currentUser?.plan?.end_date)} days
                    left
                  </h2>
                </div>
                <div className="min-w-[full]">
                  <Progress
                    color={value < 90 ? 'rgb(10,10,10)' : 'rgb(239 68 68)'}
                    value={value}
                    className={`${value >= 90 ? 'bg-red-50' : 'bg-gray-200'}`}
                  />
                </div>
              </div>
            )}
            {currentUser?.plan?.plan_name?.toLowerCase() !== 'pro' ? (
              <PopoverHover
                isOpen={isHoverPopoverOpen}
                setIsOpen={setIsHoverPopoverOpen}
                trigger={
                  <div
                    onClick={onOpen}
                    className=" py-[3px] btn-gradient btn-glow ml-4  mb-[4px]"
                  >
                    Upgrade
                  </div>
                }
                value={
                  <p className="label">
                    You are on {currentUser?.plan.plan_name} plan right now.
                    Click here to upgrade
                  </p>
                }
              />
            ) : (
              <TooltipComp
                trigger={
                  <div className="self-start mb-[6px] ml-2">
                    <button className="btn-gradient btn-glow py-[0.1rem]">
                      {currentUser?.plan.plan_name}
                    </button>
                  </div>
                }
                value={<p>Unlimited assistants with pro plan</p>}
              />
            )}
          </nav>
        </div>
        <SignedOut>
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </SignInButton>
            <Link href="/sign-in">
              <Button>Register</Button>
            </Link>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-[28px]">
            <div className="hidden md:flex items-center gap-[32px]">
              <p className="text-sm text-effect cursor-pointer">Changelog</p>
              <p className="text-sm text-effect cursor-pointer">Help</p>
            </div>
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
            {/* <Button
              variant="outline"
              onClick={() => {
                clearCookies();
                signOut();
              }}
            >
              Log Out
            </Button> */}
          </div>
        </SignedIn>
      </div>
      <div className=" w-[90%] m-auto">
        <NavTabs />
      </div>
    </div>
  ) : null;
};

export default Navbar;
