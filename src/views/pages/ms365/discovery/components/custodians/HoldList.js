import React from 'react';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import {
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import { Person, PersonCardInteraction, ViewType } from '@microsoft/mgt-react';
import useIsSignedIn from '../../hooks/useIsSignedIn';
import Placeholder from '../Placeholder';
import { useGlobalState } from '../../state/globalState';
import { getHoldItems } from '../../services/EdiscoveryService';
import Loading from '../Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useBoolean } from '@uifabric/react-hooks';
import DeleteLegalHoldDialog from './DeleteLegalHoldDialog';

export const HoldList = ({ reloadState }) => {
  const [items, setItems] = React.useState([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [isSignedIn] = useIsSignedIn();
  const [currentCase] = useGlobalState('currentCase');
  const [holds, setHolds] = useGlobalState('holds');
  const [deleteDialogIsOpen, { setTrue: openDeleteDialog, setFalse: dismissDeleteDialog }] = useBoolean(false);
  const [delId, setDelId] = React.useState('');
  const navigate = useNavigate();

  const fetchHolds = React.useCallback(
    async () => {
      setIsLoaded(false);
      const holds = await getHoldItems(currentCase);
      setHolds(holds);
      setIsLoaded(true);
    },
    [setHolds, setIsLoaded, isSignedIn, reloadState, deleteDialogIsOpen]
  );

  React.useEffect(() => {
    fetchHolds();
  }, [fetchHolds]);

  React.useEffect(() => {
    setColumns([
      {
        key: 'columnTitle',
        name: 'Legal Hold Name',
        fieldName: 'displayName',
        minWidth: 100,
        maxWidth: 250,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnDescription',
        name: 'Description',
        fieldName: 'description',
        minWidth: 70,
        isMultiline: true,
        isResizable: true,
        isCollapsible: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnIsEnabled',
        name: 'IsEnabled',
        fieldName: 'isEnabled',
        minWidth: 70,
        maxWidth: 250,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnStatus',
        name: 'Status',
        fieldName: 'status',
        minWidth: 70,
        maxWidth: 100,
        isMultiline: true,
        isResizable: true,
        isCollapsible: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnCreatedDateTime',
        name: 'Created date',
        fieldName: 'createdDateTime',
        minWidth: 150,
        maxWidth: 150,
        isPadded: true,
      },
      {
        key: 'columnLastModifiedDateTime',
        name: 'Last modified',
        fieldName: 'lastModifiedDateTime',
        minWidth: 150,
        maxWidth: 150,
        isPadded: true,
      },
      {
        key: 'columnDelete',
        name: 'Delete',
        fieldName: 'delete',
        minWidth: 70,
        maxWidth: 100,
        isPadded: true,
      },
    ]);
  }, []);

  React.useEffect(() => {
    let sortedItems = [];
    sortedItems = [...holds];
    sortedItems.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
    setIsLoaded(true);
    setItems(sortedItems);
  }, [holds]);

  const selection = new Selection({
    onSelectionChanged: () => {
    },
  });

  const _renderItemColumn = (holdItem, index, column) => {
    switch (column?.key) {
      case 'columnStatus':
        return <span>{holdItem[column?.fieldName]}</span>;

      case 'columnDescription':
        return <span>{holdItem[column?.fieldName]}</span>;

      case 'columnIsEnabled':
        return <span>{holdItem[column?.fieldName]?'true':'false'}</span>;

      case 'columnDelete':
        return (
          <Link onClick={() => {setDelId(holdItem.id);openDeleteDialog()}} style={{cursor: 'pointer', textDecoration: 'none'}}>
            <DeleteOutlineOutlinedIcon />
          </Link>
        );

      case 'columnTitle':
        return <span>{holdItem[column?.fieldName]}</span>;

      case 'columnLastModifiedDateTime':
      case 'columnCreatedDateTime': {
        const date = new Date(holdItem[column?.fieldName]);
        return <span>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</span>;
      }

      default:
        return <span>{holdItem[column?.fieldName]}</span>;
    }
  };

  const _getKey = (item, index) => item.key;

  return (
    <>
      <Fabric>
        {items && isSignedIn && (
          <DetailsList
            items={items}
            columns={columns}
            selectionMode={SelectionMode.single}
            getKey={_getKey}
            onRenderItemColumn={_renderItemColumn}
            layoutMode={DetailsListLayoutMode.justified}
            isHeaderVisible
            selectionPreservedOnEmptyClick
            selection={selection}
            enterModalSelectionOnTouch
            ariaLabelForSelectionColumn="Toggle selection"
            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
            checkButtonAriaLabel="select row"
          />
        )}

        {!isLoaded && isSignedIn && <Loading />}
        {!isLoaded && <Placeholder text="Loading holds" icon="ProgressRingDots" />}
        {!isSignedIn && <Placeholder text="Please sign in" icon="SignIn" />}
        {(!items || items.length === 0) && isSignedIn && isLoaded && <Placeholder text="No results..." icon="ErrorBadge" />}
      </Fabric>
      {deleteDialogIsOpen && <DeleteLegalHoldDialog onDismiss={dismissDeleteDialog} deleteId={delId} />}
    </>
  );
};
export default HoldList;