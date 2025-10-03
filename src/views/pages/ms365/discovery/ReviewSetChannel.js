import React from 'react';
import Header from './components/reviewset/Header';
import ReviewSetList from './components/reviewset/ReviewSetList';



// ==============================|| ORDER DETAILS ||============================== //

const ReviewSetView = () => {
  const [reloadState, setReloadState] = React.useState(false);

  return (
    <>
      <Header setReloadState={setReloadState} reloadState={reloadState} />
      <ReviewSetList reloadState={reloadState}/>
    </>
  );
};

export default ReviewSetView;
