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
import { setSelectCustodian, useGlobalState } from '../../state/globalState';
import { getCustodianItems } from '../../services/EdiscoveryService';
import Loading from '../Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useBoolean } from '@uifabric/react-hooks';
import DeleteHoldDialog from './DeleteHoldDialog';
import HoldList from './HoldList';

export const CustodianList = ({ reloadState }) => {
  const [items, setItems] = React.useState([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [isSignedIn] = useIsSignedIn();
  const [currentCase] = useGlobalState('currentCase');
  const [custodians, setCustodians] = useGlobalState('custodians');
  const [deleteDialogIsOpen, { setTrue: openDeleteDialog, setFalse: dismissDeleteDialog }] = useBoolean(false);
  const [delId, setDelId] = React.useState('');
  const navigate = useNavigate();

  const fetchCustodians = React.useCallback(
    async () => {
      setIsLoaded(false);
      const custodians = await getCustodianItems(currentCase);
      setCustodians(custodians);
      setIsLoaded(true);
    },
    [setCustodians, setIsLoaded, isSignedIn, reloadState, deleteDialogIsOpen]
  );

  React.useEffect(() => {
    fetchCustodians();
  }, [fetchCustodians]);

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
        key: 'columnApplyHold',
        name: 'ApplyHoldToSources',
        fieldName: 'applyHoldToSources',
        minWidth: 100,
        maxWidth: 250,
        isRowHeader: true,
        isResizable: true,
        data: 'string',
        isPadded: true,
      },
      {
        key: 'columnHoldStatus',
        name: 'HoldStatus',
        fieldName: 'holdStatus',
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
      // {
      //   key: 'columnDelete',
      //   name: 'Single Hold Delete',
      //   fieldName: 'delete',
      //   minWidth: 70,
      //   maxWidth: 100,
      //   isPadded: true,
      // },
    ]);
  }, []);

  React.useEffect(() => {
    let sortedItems = [];
    sortedItems = [...custodians];
    sortedItems.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
    setIsLoaded(true);
    setItems(sortedItems);
  }, [custodians]);

  const selection = new Selection({
    onSelectionChanged: () => {
    },
  });

  const _renderItemColumn = (custodianItem, index, column) => {
    switch (column?.key) {
      case 'columnStatus':
        return <span>{custodianItem[column?.fieldName]}</span>;

      case 'columnHoldStatus':
        return <span>{custodianItem[column?.fieldName]}</span>;

      case 'columnApplyHold':
        return <span>{custodianItem[column?.fieldName]?'true':'false'}</span>;

      // case 'columnDelete':
      //   return (
      //     <Link onClick={() => {setDelId(custodianItem.id);openDeleteDialog()}} style={{cursor: 'pointer', textDecoration: 'none'}}>
      //       <DeleteOutlineOutlinedIcon />
      //     </Link>
      //   );

      case 'columnTitle': {
        const identityContent = custodianItem[column?.fieldName];
        console.log('identityContent', identityContent)
        return (
          <Link onClick={() => {setSelectCustodian(custodianItem);navigate(`/ms365/eDiscovery/searches`)}} style={{cursor: 'pointer'}}>
            <Person
              personQuery={identityContent}
              view={ViewType.oneline}
              personCardInteraction={()=>console.log('username')}
            />
          </Link>
        );
      }

      case 'columnLastModifiedDateTime':
      case 'columnCreatedDateTime': {
        const date = new Date(custodianItem[column?.fieldName]);
        return <span>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</span>;
      }

      default:
        return <span>{custodianItem[column?.fieldName]}</span>;
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
        {!isLoaded && <Placeholder text="Loading custodians" icon="ProgressRingDots" />}
        {!isSignedIn && <Placeholder text="Please sign in" icon="SignIn" />}
        {(!items || items.length === 0) && isSignedIn && isLoaded && <Placeholder text="No results..." icon="ErrorBadge" />}
      </Fabric>
      {deleteDialogIsOpen && <DeleteHoldDialog onDismiss={dismissDeleteDialog} deleteId={delId} />}
      <br />
      <HoldList reloadState={reloadState}/>
    </>
  );
};
export default CustodianList;