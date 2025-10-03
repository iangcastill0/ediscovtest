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
import { setReview, useGlobalState } from '../../state/globalState';
import { getReviewList } from '../../services/EdiscoveryService';
import Loading from '../Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';

export const ReviewSetList = ({ reloadState }) => {
  const [items, setItems] = React.useState([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [columns, setColumns] = React.useState([]);
  const [isSignedIn] = useIsSignedIn();
  const [currentCase] = useGlobalState('currentCase');
  const [reviewSets, setReviewSets] = useGlobalState('reviewSets');
  const navigate = useNavigate();

  const fetchReviews = React.useCallback(
    async () => {
      setIsLoaded(false);
      const reviewSets = await getReviewList(currentCase);
      setReviewSets(reviewSets);
      setIsLoaded(true);
    },
    [setReviewSets, setIsLoaded, isSignedIn, reloadState]
  );

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
        key: 'columnCreatedDateTime',
        name: 'Created date',
        fieldName: 'createdDateTime',
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
    ]);
  }, []);

  React.useEffect(() => {
    let sortedItems = [];
    sortedItems = [...reviewSets];
    sortedItems.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
    setIsLoaded(true);
    setItems(sortedItems);
  }, [reviewSets]);

  const selection = new Selection({
    onSelectionChanged: () => {
    },
  });

  const _renderItemColumn = (reviewItem, index, column) => {
    switch (column?.key) {
      case 'columnTitle':
        return <Link onClick={() => {setReview(reviewItem);navigate(`/ms365/eDiscovery/export`)}} style={{cursor: 'pointer'}}>{reviewItem[column?.fieldName]}</Link>;
      case 'columnCreatedBy': {
        const identityContent = reviewItem[column?.fieldName];
        return (
          <Person
            personQuery={identityContent.user?.displayName}
            view={ViewType.oneline}
            personCardInteraction={()=>console.log('username')}
          />
        );
      }
      case 'columnCreatedDateTime': {
        const date = new Date(reviewItem[column?.fieldName]);
        return <span>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</span>;
      }

      default:
        return <span>{reviewItem[column?.fieldName]}</span>;
    }
  };

  const _getKey = (item, index) => item.key;

  return (
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
      {!isLoaded && <Placeholder text="Loading review sets" icon="ProgressRingDots" />}
      {!isSignedIn && <Placeholder text="Please sign in" icon="SignIn" />}
      {(!items || items.length === 0) && isSignedIn && isLoaded && <Placeholder text="No results..." icon="ErrorBadge" />}
    </Fabric>
  );
};
export default ReviewSetList;