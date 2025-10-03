import React from 'react';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import {
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import { Person, PersonCardInteraction, ViewType } from '@microsoft/mgt-react';
import useIsSignedIn from '../hooks/useIsSignedIn';
import Placeholder from './Placeholder';
import { filterCases, getCaseUrl } from '../helpers/CaseHelpers';
import { setCurrentCase, useGlobalState } from '../state/globalState';
import { getCaseItems } from '../services/EdiscoveryService';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useBoolean } from '@uifabric/react-hooks';
import DeleteCaseDialog from './DeleteCaseDialog';

export const CaseList = ({ reloadState }) => {
  const [items, setItems] = React.useState([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [isSignedIn] = useIsSignedIn();
  const [cases, setCases] = useGlobalState('cases');
  const [currentQuery] = useGlobalState('currentQuery');
  const [reloadFlag] = useGlobalState('reloadFlag');
  const [deleteDialogIsOpen, { setTrue: openDeleteDialog, setFalse: dismissDeleteDialog }] = useBoolean(false);
  const [delId, setDelId] = React.useState('');
  const navigate = useNavigate();

  const fetchCases = React.useCallback(
    async (query) => {
      setIsLoaded(false);
      const cases = await getCaseItems(query);
      setCases(cases);
      setIsLoaded(true);
    },
    [setCases, setIsLoaded, isSignedIn, reloadState, deleteDialogIsOpen]
  );

  React.useEffect(() => {
    fetchCases(currentQuery);
  }, [currentQuery, fetchCases]);

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
        key: 'columnNumber',
        name: 'Case number',
        fieldName: 'externalId',
        minWidth: 70,
        maxWidth: 150,
        isMultiline: true,
        isResizable: true,
        isCollapsible: true,
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
        key: 'columnLastModifiedBy',
        name: 'Modified by',
        fieldName: 'lastModifiedBy',
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
  }, [currentQuery]);

  React.useEffect(() => {
    let sortedItems = [];
    if (currentQuery) {
      sortedItems = [...filterCases(cases, currentQuery)];
    } else {
      sortedItems = [...cases];
    }

    sortedItems.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));

    setIsLoaded(true);
    setItems(sortedItems);
  }, [cases, currentQuery]);

  const selection = new Selection({
    onSelectionChanged: () => {
      console.log(selection.getSelection()[0])
    },
  });

  const _renderItemColumn = (caseItem, index, column) => {
    switch (column?.key) {
      case 'columnTitle':
        return <Link onClick={() => {setCurrentCase(caseItem);navigate(`/ms365/eDiscovery/custodians`)}} style={{cursor: 'pointer'}}>{caseItem[column?.fieldName]}</Link>;

      case 'columnStatus':
        return <span>{caseItem[column?.fieldName]}</span>;

      case 'columnDelete':
        return (
          <Link onClick={() => {setDelId(caseItem.id);openDeleteDialog()}} style={{cursor: 'pointer', textDecoration: 'none'}}>
            <DeleteOutlineOutlinedIcon />
          </Link>
        );
  
      case 'columnLastModifiedBy': {
        const identityContent = caseItem[column?.fieldName];
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
        const date = new Date(caseItem[column?.fieldName]);
        return <span>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</span>;
      }

      default:
        return <span>{caseItem[column?.fieldName]}</span>;
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
            onItemInvoked={(item) => window.open(getCaseUrl(item), '_blank')}
            enterModalSelectionOnTouch
            ariaLabelForSelectionColumn="Toggle selection"
            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
            checkButtonAriaLabel="select row"
          />
        )}

        {!isLoaded && isSignedIn && <Loading />}
        {!isLoaded && isSignedIn && <Placeholder text="Loading cases" icon="ProgressRingDots" />}
        {!isSignedIn && <Placeholder text="Please sign in" icon="SignIn" />}
        {(!items || items.length === 0) && isSignedIn && isLoaded && <Placeholder text="No results..." icon="ErrorBadge" />}
      </Fabric>
      {deleteDialogIsOpen && <DeleteCaseDialog onDismiss={dismissDeleteDialog} deleteId={delId} />}
    </>
  );
};
export default CaseList;