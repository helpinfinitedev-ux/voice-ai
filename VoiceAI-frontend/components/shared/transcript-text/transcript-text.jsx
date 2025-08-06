import React from 'react';

const TranscriptText = ({ item, idx }) => (
  <div
    className={`py-[8px] px-6 flex gap-[8px] items-start ${
      idx % 2 === 1 ? 'bg-gray-100' : 'bg-white'
    }   ${idx % 2 === 1 ? 'text-gray-700' : 'text-gray-500'}  `}
  >
    <div className="mt-[0px]  min-w-[70px] ">
      {idx % 2 === 0 ? (
        <div className="mt-[1.5px]">
          {/* <Initials
    Icon={
      <Icon
        icon="fluent:arrow-up-right-16-regular"
        style={{ color: 'white' }}
      />
    }
    width="24px"
    height="24px"
  /> */}
          <p className="text-gray-500 font-medium">Assistant</p>
        </div>
      ) : (
        <div className="">
          {/* <Icon
    icon="mingcute:user-4-line"
    width="26"
    height="26"
    style={{ color: 'rgb(31 41 55)' }}
  /> */}
          <p className="text-gray-700 font-medium">User</p>
        </div>
      )}
    </div>
    <p
      className={`${
        idx % 2 === 1 ? 'text-gray-800' : 'text-gray-500'
      } ${idx % 2 === 1 ? 'font-medium' : 'font-medium'}
${idx % 2 === 1 ? 'text-[16px]' : 'text-[16px]'}                     
`}
    >
      {item.content !== '' ? (
        item.content.split('\n').map((item) => <p>{item}</p>)
      ) : (
        <p className=" italic">[user didn&apos;t respond]</p>
      )}
    </p>
  </div>
);

export default TranscriptText;
