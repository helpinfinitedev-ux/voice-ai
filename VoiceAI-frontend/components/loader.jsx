import React from 'react';

const Loader = ({ width, height }) => (
  <div
    style={{ width: width || '48px', height: height || '48px' }}
    className="border-[5px] border-neutral-900 border-b-transparent rounded-full inline-block custom-loader"
  />
);

export default Loader;
