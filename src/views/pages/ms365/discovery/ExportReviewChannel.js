import React from 'react';
import Header from './components/export/Header';



// ==============================|| ORDER DETAILS ||============================== //

const ExportReviewView = () => {
  const [reloadState, setReloadState] = React.useState(false);

  return (
    <>
      <Header setReloadState={setReloadState} reloadState={reloadState} />
    </>
  );
};

export default ExportReviewView;
