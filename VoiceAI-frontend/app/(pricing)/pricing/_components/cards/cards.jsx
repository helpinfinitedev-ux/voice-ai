'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { initializePaddle } from '@paddle/paddle-js';
import { AgentsContext } from '@/context/AgentsContext/AgentsContext';
import axios from 'axios';
import { Icon } from '@iconify/react';
import usePaymentModal from '@/hooks/usePaymentModal';
import { FormatSring } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import {
  paddleClientToken,
  paddleEnvironment,
  paddleSuccessURL,
} from '@/utils/config';

const plansArray = [
  {
    variant: 'outline',

    purpose: 'Hobby',
    bestValue: false,
    icon: (
      <Icon
        className="w-8 h-8"
        icon="mynaui:lightning"
        style={{ color: 'grey' }}
      />
    ),
  },
  {
    variant: 'default',
    purpose: 'Businesses',
    bestValue: true,
    icon: (
      <Icon
        className="w-7 h-7"
        icon="ion:diamond-outline"
        style={{ color: 'grey' }}
      />
    ),
  },
];
const Cards = () => {
  const { currentUser } = useContext(AgentsContext);
  const [priceLoading, setPriceLoading] = useState(true);
  const [prices, setPrices] = useState(null);
  const { onClose } = usePaymentModal();
  const { user } = useContext(AgentsContext);
  const [paddle, setPaddle] = useState();
  const [plans, setPlans] = useState(plansArray);
  useEffect(() => {
    initializePaddle({
      environment: `${paddleEnvironment}`,
      token: `${paddleClientToken}`,
      eventCallback: (data) => {
        if (data.name === 'checkout.completed') {
          window.location.reload();
        }
      },
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      const res = await axios.get('/api/products');
      console.log(res);
      setPriceLoading(false);
      setPrices(res.data.data.data.prices);
    };

    fetchPrices();
  }, []);

  // Callback to open a checkout
  const openCheckout = (
    priceId,
    { conversations, amount, plan_name, agent }
  ) => {
    onClose();
    const res = paddle?.Checkout.open({
      items: [{ priceId, quantity: null }],
      customData: {
        userId: user?.id,
        conversations,
        amount,
        agent,
        plan_name,
      },
    });
  };
  const openCancelModal = () => {
    paddle.Retain.demo({ feature: 'cancellationFlow' });
  };
  // const proPriceId = 'pri_01hsck1meeka8vnt88nvsn0z0t';
  // const basicPriceId = 'pri_01hsck004342ywwy6xdkdchztc';

  useEffect(() => {
    if (prices) {
      const filteredPrices = prices.filter((item) => item.name !== 'free');
      const arr = filteredPrices.reverse().map((item, idx) => ({
        ...plansArray[idx],
        title: item.name,
        id: item.id,
        conversations: item.custom_data.conversations,
        agents: item.custom_data.agents,
        amount: +item.unit_price.amount / 100,
      }));

      setPlans([...arr]);
    }
  }, [prices]);

  return (
    <div className="overflow-hidden rounded-b-[20px] bg-modalBody flex w-[fit-content] justify-center px-8 py-8 gap-6">
      {priceLoading &&
        [1, 2].map(() => (
          <Skeleton className="h-[415px] rounded-[20px] min-w-[350px]" />
        ))}
      {!priceLoading &&
        plans.map((item) => (
          <div className="relative border-gray-200 border-[1px] min-w-[350px] py-8 bg-white  flex flex-col gap-6 rounded-[20px]">
            <div className="px-6 flex flex-col gap-4  ">
              <div className="flex flex-col gap-[2px]">
                <div className="flex flex-col gap-3">
                  <div className="w-11 h-11 p-4 rounded-full shadow-1 flex items-center justify-center">
                    <div onClick={openCancelModal}>{item.icon}</div>
                  </div>
                  <h1 className="text-2xl pl-1 font-medium">{item.title}</h1>
                </div>
                <p className="text-gray-500 pl-1 text-[13px]">
                  For {item.purpose}
                </p>
              </div>
              <div className="flex flex-col gap-0">
                <div className="flex items-end gap-[1.5px]">
                  <h2 className="text-[1.9rem] leading-tight m-0 p-0 text-gray-700">
                    ${item.amount}
                  </h2>
                  <p className="mb-[4px] text-[1.05rem] text-gray-500">
                    /month
                  </p>
                </div>
                <p className="text-gray-500 pl-1 text-[13px]">Billed Monthly</p>
              </div>
            </div>

            <hr />
            <div className="px-6 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <img src="/agent-icon.png" className="w-4 h-4" alt="" />
                <p className="text-[14px] text-gray-600 pt-[1.5px]">
                  {FormatSring.capitalizeFirstLetter(`${item.agents}`)}{' '}
                  {+item.agents > 1 ||
                  item.agents?.toString().toLowerCase() === 'infinite'
                    ? 'Assistants'
                    : 'Assistant'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="bi:headphones" style={{ color: 'grey' }} />
                <p className="text-[14px] text-gray-600 pt-[1.5px]">
                  {' '}
                  {item.conversations}{' '}
                  {+item.conversations > 1 ? 'Conversations' : 'Conversation'}
                </p>
              </div>
            </div>
            {item.title !== 'Free' && (
              <div className="px-6">
                {currentUser?.plan?.plan_name === item.title ? (
                  <Button className="w-full rounded-[20px]" variant="outline">
                    You have already bought {item.title} plan
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      openCheckout(item.id, {
                        conversations: item.conversations,
                        amount: item.amount,
                        plan_name: item.title,
                        agent: item.agents,
                      })
                    }
                    variant={item.variant}
                    className="w-full rounded-[20px]"
                  >
                    Get Started With {item.title} Plan
                  </Button>
                )}
              </div>
            )}
            {item.bestValue && (
              <div className="absolute -top-3 left-[50%] text-[14px] translate-x-[-50%]">
                <div className="py-1 px-4 rounded-[20px] bg-gray-800">
                  <p className="text-white">Best Value</p>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};
export default Cards;
