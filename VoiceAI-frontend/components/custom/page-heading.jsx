import React from 'react';

const PageHeading = ({ heading, children }) => (
  <>
    <div className="flex w-[90%] mx-auto justify-between items-center py-8">
      <div>
        <h1 className=" font-normal text-gray-600 text-2xl">{heading}</h1>
      </div>
      {children}
    </div>
    <hr />
  </>
);

export default PageHeading;
