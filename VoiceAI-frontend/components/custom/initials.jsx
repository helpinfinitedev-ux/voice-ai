import React from 'react';

const Initials = ({
  Icon,
  backgroundColor,
  name,
  width,
  height,
  fontSize,
  fontWeight,
}) => (
  <div
    style={{
      fontSize: fontSize || '16px',
      fontWeight: fontWeight || '400',
      width: width || '42px',
      height: height || '42px',
      backgroundColor: backgroundColor || 'rgb(248,113,113)',
    }}
    className="w-[42px] h-[42px] text-white hover:shadow-md transition-all duration-200 ease-in
     rounded-full p-2 flex justify-center items-center"
  >
    {Icon || name?.toUpperCase().substring(0, 2)}
  </div>
);

export default Initials;
