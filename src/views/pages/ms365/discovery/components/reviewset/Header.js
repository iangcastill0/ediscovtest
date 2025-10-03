import React from 'react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { useBoolean } from '@uifabric/react-hooks';
import { Login } from '@microsoft/mgt-react';
import useIsSignedIn from '../../hooks/useIsSignedIn';
import AddReviewDialog from './AddReviewDialog';
import { useGlobalState } from '../../state/globalState';
import { useNavigate } from 'react-router-dom';

export const Header = ({ setReloadState, reloadState }) => {
  const [addReviewSetDialogIsOpen, { setTrue: openReviewDialog, setFalse: dismissReviewDialog }] = useBoolean(false);
  const [commandBarItems, setCommandBarItems] = React.useState([]);
  const [currentCase] = useGlobalState('currentCase');
  const [collection] = useGlobalState('collection');
  const [isSignedIn] = useIsSignedIn();
  const [query, setQuery] = useGlobalState('currentQuery');
  const navigate = useNavigate();

  React.useEffect(() => {
    setCommandBarItems([
      {
        key: 'caseName',
        text: currentCase?`Cases > ${currentCase.displayName} > ${collection.displayName}  `:'',
        disabled: !(currentCase && isSignedIn),
      },
      {
        key: 'backBtn',
        text: 'Go to back',
        iconProps: { iconName: 'Back' },
        disabled: !(currentCase && isSignedIn),
        onClick: () => navigate(`/ms365/eDiscovery/searches`),
      },
      {
        key: 'addReview',
        text: 'Add Review Set',
        iconProps: { iconName: 'Add' },
        disabled: !(currentCase && isSignedIn && collection),
        onClick: openReviewDialog,
      },
      {
        key: 'reloadReviewSet',
        text: 'Reload',
        iconProps: { iconName: 'Refresh' },
        disabled: !(currentCase && isSignedIn && collection),
        onClick: () => setReloadState(!reloadState),
      },
    ]);
  }, [currentCase, collection, isSignedIn, openReviewDialog, query]);

  React.useEffect(() => {
    setReloadState(!reloadState);
    console.log('reload state', reloadState);
  }, [addReviewSetDialogIsOpen]);

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
      {addReviewSetDialogIsOpen && <AddReviewDialog onDismiss={dismissReviewDialog} />}
    </div>
  );
};

export default Header;
