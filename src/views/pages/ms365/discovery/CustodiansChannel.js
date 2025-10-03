import React from 'react';
import Header from './components/custodians/Header';
import CustodianList from './components/custodians/CustodianList';



// ==============================|| ORDER DETAILS ||============================== //

const CustodiansView = () => {
  const [reloadState, setReloadState] = React.useState(false);

  return (
    <>
      <Header setReloadState={setReloadState} reloadState={reloadState} />
      <CustodianList reloadState={reloadState}/>
    </>
  );
};

export default CustodiansView;
