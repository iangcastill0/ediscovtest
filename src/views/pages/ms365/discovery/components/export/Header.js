import React from 'react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { useBoolean } from '@uifabric/react-hooks';
import { Login } from '@microsoft/mgt-react';
import useIsSignedIn from '../../hooks/useIsSignedIn';
import AddExportDialog from './AddExportDialog';
import { useGlobalState } from '../../state/globalState';
import { useNavigate } from 'react-router-dom';

export const Header = ({ setReloadState, reloadState }) => {
  const [addExportDialogIsOpen, { setTrue: openExportDialog, setFalse: dismissExportDialog }] = useBoolean(false);
  const [commandBarItems, setCommandBarItems] = React.useState([]);
  const [currentCase] = useGlobalState('currentCase');
  const [review] = useGlobalState('review');
  const [isSignedIn] = useIsSignedIn();
  const [query, setQuery] = useGlobalState('currentQuery');
  const navigate = useNavigate();

  React.useEffect(() => {
    setCommandBarItems([
      {
        key: 'caseName',
        text: currentCase?`Cases > ${currentCase.displayName} > ${review.displayName}  `:'',
        disabled: !(currentCase && isSignedIn),
      },
      {
        key: 'backBtn',
        text: 'Go to back',
        iconProps: { iconName: 'Back' },
        disabled: !(currentCase && isSignedIn),
        onClick: () => navigate(`/ms365/eDiscovery/reviewSet`),
      },
      {
        key: 'addExport',
        text: 'Add Export',
        iconProps: { iconName: 'Add' },
        disabled: !(currentCase && isSignedIn && review),
        onClick: openExportDialog,
      },
      {
        key: 'reloadReviewSet',
        text: 'Reload',
        iconProps: { iconName: 'Refresh' },
        disabled: !(currentCase && isSignedIn && review),
        onClick: () => setReloadState(!reloadState),
      },
    ]);
  }, [currentCase, review, isSignedIn, openExportDialog, query]);

  React.useEffect(() => {
    setReloadState(!reloadState);
    console.log('reload state', reloadState);
  }, [addExportDialogIsOpen]);

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
      {addExportDialogIsOpen && <AddExportDialog onDismiss={dismissExportDialog} />}
    </div>
  );
};

export default Header;
