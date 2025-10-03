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
import { setCollection, useGlobalState } from '../../state/globalState';
import { getSearchList } from '../../services/EdiscoveryService';
import Loading from '../Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useBoolean } from '@uifabric/react-hooks';
import DeleteSearchDialog from './DeleteSearchDialog';

export const SearchList = ({ reloadState }) => {
  const [items, setItems] = React.useState([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [isSignedIn] = useIsSignedIn();
  const [currentCase] = useGlobalState('currentCase');
  const [searches, setSearches] = useGlobalState('searches');
  const [deleteDialogIsOpen, { setTrue: openDeleteDialog, setFalse: dismissDeleteDialog }] = useBoolean(false);
  const [delId, setDelId] = React.useState('');
  const navigate = useNavigate();

  const fetchSearches = React.useCallback(
    async () => {
      setIsLoaded(false);
      const searches = await getSearchList(currentCase);
      setSearches(searches);
      setIsLoaded(true);
    },
    [setSearches, setIsLoaded, isSignedIn, reloadState, deleteDialogIsOpen]
  );

  React.useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  React.useEffect(() => {
    setColumns([
      {
        key: 'columnTitle',
        name: 'Name',
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
        minWidth: 100,
        maxWidth: 250,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnContentQuery',
        name: 'ContentQuery',
        fieldName: 'contentQuery',
        minWidth: 100,
        maxWidth: 250,
        isMultiline: true,
        isResizable: true,
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
        key: 'columnCreatedBy',
        name: 'Created by',
        fieldName: 'createdBy',
        minWidth: 150,
        maxWidth: 250,
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
    sortedItems = [...searches];
    sortedItems.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
    setIsLoaded(true);
    setItems(sortedItems);
  }, [searches]);

  const selection = new Selection({
    onSelectionChanged: () => {
    },
  });

  const _renderItemColumn = (searchItem, index, column) => {
    switch (column?.key) {
      case 'columnTitle':
        return <Link onClick={() => {setCollection(searchItem);navigate(`/ms365/eDiscovery/reviewSet`)}} style={{cursor: 'pointer'}}>{searchItem[column?.fieldName]}</Link>;
      case 'columnDelete':
        return (
          <Link onClick={() => {setDelId(searchItem.id);openDeleteDialog()}} style={{cursor: 'pointer', textDecoration: 'none'}}>
            <DeleteOutlineOutlinedIcon />
          </Link>
        );
      case 'columnCreatedBy': {
        const identityContent = searchItem[column?.fieldName];
        return (
          <Person
            personQuery={identityContent.user?.displayName}
            view={ViewType.oneline}
            personCardInteraction={()=>console.log('username')}
          />
        );
      }
      case 'columnLastModifiedDateTime':
      case 'columnCreatedDateTime': {
        const date = new Date(searchItem[column?.fieldName]);
        return <span>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</span>;
      }

      default:
        return <span>{searchItem[column?.fieldName]}</span>;
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
        {!isLoaded && <Placeholder text="Loading collections" icon="ProgressRingDots" />}
        {!isSignedIn && <Placeholder text="Please sign in" icon="SignIn" />}
        {(!items || items.length === 0) && isSignedIn && isLoaded && <Placeholder text="No results..." icon="ErrorBadge" />}
      </Fabric>
      {deleteDialogIsOpen && <DeleteSearchDialog onDismiss={dismissDeleteDialog} deleteId={delId} />}
    </>
  );
};
export default SearchList;