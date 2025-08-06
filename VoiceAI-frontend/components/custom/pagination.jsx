import React, { useState } from 'react';
import PrevButton from '@/assets/PrevButton';
import NextButton from '@/assets/NextButton';
import ChevronDown from '@/assets/ChevronDown';

const CustomPagination = ({
  listLength,
  currentPage,
  handlePrev,
  handleNext,
  selectValue,
  setSelectValue,
  rowNumSelectValues,
  setPage,
}) => {
  const [showSelectValues, setShowSelectValue] = useState(false);
  return (
    <div className="flex items-center justify-end gap-4 my-2 text-[12px] font-medium text-gray-700">
      <div className="flex items-center gap-2">
        <p>Rows per page:</p>
        <div className="relative">
          <div className="flex items-center justify-between gap-[20px] w-[fit-content] pl-2 border border-gray-300 rounded">
            <p>{selectValue}</p>
            <button
              type="button"
              className=" py-1 focus:outline-none"
              onClick={() => setShowSelectValue((prev) => !prev)}
            >
              <ChevronDown />
            </button>
          </div>
          {showSelectValues && (
            <div className="absolute bottom-[100%] left-0 w-[w-full] bg-white border border-gray-300 rounded-[8px]  shadow-md">
              {rowNumSelectValues?.map((item) => (
                <p
                  className="py-1 px-4 cursor-pointer hover:bg-gray-200 hover:text-gray-700"
                  onClick={() => {
                    const length =
                      currentPage * selectValue > listLength
                        ? listLength
                        : currentPage * selectValue;
                    setPage(Math.round(length / item.value) || 1);
                    setSelectValue(item.value);
                    setShowSelectValue(false);
                  }}
                >
                  {item.value}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p>
          {(currentPage - 1) * selectValue + 1} -{' '}
          {currentPage * selectValue > listLength
            ? listLength
            : currentPage * selectValue}{' '}
        </p>
        <p>of</p>
        <p>{listLength}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          type="button"
          className="focus:outline-none"
          onClick={handlePrev}
        >
          <PrevButton />
        </button>
        <button
          disabled={listLength <= currentPage * selectValue}
          type="button"
          className="focus:outline-none"
          onClick={handleNext}
        >
          <NextButton />
        </button>
      </div>
    </div>
  );
};

export default CustomPagination;
