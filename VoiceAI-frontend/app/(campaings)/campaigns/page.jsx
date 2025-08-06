'use client';

import Campaigns from './_components/campaigns-list/campaigns-list';

const { useState } = require('react');

const Page = () => {
  const [state, setState] = useState();

  return <Campaigns />;
};
export default Page;
