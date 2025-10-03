import React from 'react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { useBoolean } from '@uifabric/react-hooks';
import { SearchBox } from '@fluentui/react';
import { Login } from '@microsoft/mgt-react';
import useIsSignedIn from '../hooks/useIsSignedIn';
import TodoCaseDialog from './TodoCaseDialog';
import AddCaseDialog from './AddCaseDialog';
import { useGlobalState, setReloadFlag } from '../state/globalState';

export const Header = ({ setReloadState, reloadState }) => {
  const [todoDialogIsOpen, { setTrue: openTodoDialog, setFalse: dismissTodoDialog }] = useBoolean(false);
  const [caseDialogIsOpen, { setTrue: openCaseDialog, setFalse: dismissCaseDialog }] = useBoolean(false);
  const [commandBarItems, setCommandBarItems] = React.useState([]);
  const [currentCase] = useGlobalState('currentCase');
  const [isSignedIn] = useIsSignedIn();
  const [query, setQuery] = useGlobalState('currentQuery');

  React.useEffect(() => {
    setCommandBarItems([
      {
        key: 'addCase',
        text: 'Add new case',
        iconProps: { iconName: 'Add' },
        disabled: !(isSignedIn),
        onClick: openCaseDialog,
      },
      {
        key: 'reloadCustodians',
        text: 'Reload',
        iconProps: { iconName: 'Refresh' },
        disabled: !(isSignedIn),
        onClick: () => setReloadState(!reloadState),
      },
    ]);
  }, [currentCase, isSignedIn, openTodoDialog, openCaseDialog, query]);

  React.useEffect(() => {
    setReloadState(!reloadState);
    console.log('reload state', reloadState);
  }, [caseDialogIsOpen]);

  const _farItems = [
    {
      key: 'search',
      onRender: () => (
        <SearchBox
          placeholder="Search"
          className="searchBox"
          styles={{
            root: {
              width: '220px',
              marginTop: '5px',
            },
          }}
          disabled={!isSignedIn}
          underlined
          onSearch={setQuery}
          onClear={() => setQuery('')}
        />
      ),
    },
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
      {todoDialogIsOpen && <TodoCaseDialog onDismiss={dismissTodoDialog} />}
      {caseDialogIsOpen && <AddCaseDialog onDismiss={dismissCaseDialog} />}
    </div>
  );
};

export default Header;
