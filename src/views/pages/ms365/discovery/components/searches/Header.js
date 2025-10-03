import React from 'react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { useBoolean } from '@uifabric/react-hooks';
import { Login } from '@microsoft/mgt-react';
import useIsSignedIn from '../../hooks/useIsSignedIn';
import AddSearchDialog from './AddSearchDialog';
import { useGlobalState } from '../../state/globalState';
import { useNavigate } from 'react-router-dom';

export const Header = ({ setReloadState, reloadState }) => {
  const [searchDialogIsOpen, { setTrue: openSearchDialog, setFalse: dismissSearchDialog }] = useBoolean(false);
  const [commandBarItems, setCommandBarItems] = React.useState([]);
  const [currentCase] = useGlobalState('currentCase');
  const [selectCustodian] = useGlobalState('selectCustodian');
  const [isSignedIn] = useIsSignedIn();
  const [query, setQuery] = useGlobalState('currentQuery');
  const navigate = useNavigate();

  React.useEffect(() => {
    setCommandBarItems([
      {
        key: 'caseName',
        text: currentCase?`Cases > ${currentCase.displayName} > ${selectCustodian.displayName}  `:'',
        disabled: !(currentCase && isSignedIn),
      },
      {
        key: 'backBtn',
        text: 'Go to back',
        iconProps: { iconName: 'Back' },
        disabled: !(currentCase && isSignedIn),
        onClick: () => navigate(`/ms365/eDiscovery/custodians`),
      },
      {
        key: 'addSearch',
        text: 'Add search',
        iconProps: { iconName: 'Add' },
        disabled: !(currentCase && isSignedIn && selectCustodian),
        onClick: openSearchDialog,
      },
      {
        key: 'reloadCustodians',
        text: 'Reload',
        iconProps: { iconName: 'Refresh' },
        disabled: !(currentCase && isSignedIn && selectCustodian),
        onClick: () => setReloadState(!reloadState),
      },
    ]);
  }, [currentCase, selectCustodian, isSignedIn, openSearchDialog, query]);

  React.useEffect(() => {
    setReloadState(!reloadState);
    console.log('reload state', reloadState);
  }, [searchDialogIsOpen]);

  const _farItems = [
    {
      key: 'login',
      onRender: () => <Login />,
    },
  ];

  return (
    <div>
      <CommandBar
        items={commandBarItems}
        farItems={_farItems}
        ariaLabel="Use left and right arrow keys to navigate between commands"
      />
      {searchDialogIsOpen && <AddSearchDialog onDismiss={dismissSearchDialog} />}
    </div>
  );
};

export default Header;
