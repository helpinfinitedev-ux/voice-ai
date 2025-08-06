'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useMemo, useState } from 'react';
import { InboxContext } from '@/context/InboxContext/InboxContext';
import { Badge } from '../ui/badge';

export default function NavTabs() {
  const { unread } = useContext(InboxContext);

  const pathname = usePathname();

  const tabs = [
    { name: 'Assistants', href: '/' },
    { name: 'Leads', href: '/leads' },
    { name: 'Inbox', href: '/inbox', unread },
    { name: 'Integrations', href: '/integrations' },
  ];

  return (
    <div className="hide-scrollbar mb-[-3px] flex h-12 items-center justify-start space-x-2 overflow-x-auto">
      {tabs.map(({ name, href }) => (
        <Link key={href} href={href} className="relative">
          <div className="m-1 flex items-center gap-[8px] rounded-md px-3 py-2 relative transition-all duration-75 hover:bg-gray-100 active:bg-gray-200">
            <p className="text-sm text-gray-600 hover:text-black">{name}</p>
            {name === 'Inbox' && unread > 0 && (
              <div className=" flex justify-center items-center text-[11px] text-white  bg-red-500 w-[fit-content] min-w-[18px] min-h-[18px] pl-[2px] pr-[3px] rounded-full">
                {unread > 0 && (
                  <p className="">{unread > 99 ? `${99}+` : unread}</p>
                )}
              </div>
            )}
          </div>
          {(pathname === href ||
            (href.endsWith('/settings') && pathname?.startsWith(href))) && (
            <motion.div
              layoutId="indicator"
              transition={{
                duration: 0.1,
              }}
              className="absolute bottom-0 w-full px-1.5"
            >
              <div className="h-0.5 bg-black" />
            </motion.div>
          )}
        </Link>
      ))}
    </div>
  );
}
