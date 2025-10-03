import React from 'react';
import Header from './components/Header';
import CaseList from './components/CaseList';
import { useGlobalState } from './state/globalState';



// ==============================|| ORDER DETAILS ||============================== //

const DiscoveryView = () => {
  const [currentCase] = useGlobalState('currentCase');
  const [reloadState, setReloadState] = React.useState(false);

  return (
    <>
      <Header setReloadState={setReloadState} reloadState={reloadState} />
      <CaseList reloadState={reloadState}/>
    </>
  );
};

export default DiscoveryView;
