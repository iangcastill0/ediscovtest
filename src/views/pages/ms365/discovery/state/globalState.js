import { createGlobalState } from 'react-hooks-global-state';

const defaultState = {
  currentCase: null,
  cases: [],
  currentQuery: '',
  holds: [],
  reloadFlag: false,
  custodians: [],
  selectCustodian: null,
  searches: [],
  collection: null,
  reviewSets: [],
  review: null,
};

export const { setGlobalState, useGlobalState } = createGlobalState(defaultState);

export const setCurrentCase = (currentCase) => {
  setGlobalState('currentCase', currentCase);
};

export const setCases = (cases) => {
  setGlobalState('cases', cases);
};

export const setQuery = (query) => {
  setGlobalState('currentQuery', query);
};

export const setHolds = (holds) => {
  setGlobalState('holds', holds);
};

export const setReloadFlag = () => {
  setGlobalState('reloadFlag', !defaultState.reloadFlag);
};

export const setCustodians = (custodians) => {
  setGlobalState('custodians', custodians);
};

export const setSelectCustodian = (selectCustodian) => {
  setGlobalState('selectCustodian', selectCustodian);
};

export const setSearches = (searches) => {
  setGlobalState('searches', searches);
};

export const setCollection = (collection) => {
  setGlobalState('collection', collection);
};

export const setReviewSets = (reviewSets) => {
  setGlobalState('reviewSets', reviewSets);
};

export const setReview = (review) => {
  setGlobalState('review', review);
};