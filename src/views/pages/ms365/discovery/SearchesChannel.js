import React from 'react';
import Header from './components/searches/Header';
import SearchList from './components/searches/SearchList';



// ==============================|| ORDER DETAILS ||============================== //

const SearchesView = () => {
  const [reloadState, setReloadState] = React.useState(false);

  return (
    <>
      <Header setReloadState={setReloadState} reloadState={reloadState} />
      <SearchList reloadState={reloadState}/>
    </>
  );
};

export default SearchesView;
