import React from 'react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { useBoolean } from '@uifabric/react-hooks';
import { Login } from '@microsoft/mgt-react';
import useIsSignedIn from '../../hooks/useIsSignedIn';
import AddCustodianDialog from './AddCustodianDialog';
import { useGlobalState } from '../../state/globalState';
import { useNavigate } from 'react-router-dom';

export const Header = ({ setReloadState, reloadState }) => {
  const [custodianDialogIsOpen, { setTrue: openCustodianDialog, setFalse: dismissCustodianDialog }] = useBoolean(false);
  const [commandBarItems, setCommandBarItems] = React.useState([]);
  const [currentCase] = useGlobalState('currentCase');
  const [isSignedIn] = useIsSignedIn();
  const [query, setQuery] = useGlobalState('currentQuery');
  const navigate = useNavigate();

  React.useEffect(() => {
    setCommandBarItems([
      {
        key: 'caseName',
        text: currentCase?`Cases > ${currentCase.displayName}  `:'',
        disabled: !(currentCase && isSignedIn),
      },
      {
        key: 'backBtn',
        text: 'Go to back',
        iconProps: { iconName: 'Back' },
        disabled: !(isSignedIn),
        onClick: () => navigate(`/ms365/eDiscovery`),
      },
      {
        key: 'addCustodian',
        text: 'Add custodian',
        iconProps: { iconName: 'Add' },
        disabled: !(currentCase && isSignedIn),
        onClick: openCustodianDialog,
      },
      {
        key: 'reloadCustodians',
        text: 'Reload',
        iconProps: { iconName: 'Refresh' },
        disabled: !(currentCase && isSignedIn),
        onClick: () => setReloadState(!reloadState),
      },
    ]);
  }, [currentCase, isSignedIn, openCustodianDialog, query]);

  React.useEffect(() => {
    setReloadState(!reloadState);
    console.log('reload state', reloadState);
  }, [custodianDialogIsOpen]);

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
      {custodianDialogIsOpen && <AddCustodianDialog onDismiss={dismissCustodianDialog} />}
    </div>
  );
};

export default Header;
