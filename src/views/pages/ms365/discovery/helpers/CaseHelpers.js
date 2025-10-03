export function getCaseUrl(caseItem) {
  return `https://compliance.microsoft.com/advancedediscovery/cases/v2/${caseItem?.id}?casename=${caseItem?.displayName}&casesworkbench=Overviewitem.url`;
}

export function filterCases(cases, query) {
  const filteredCases = cases.filter(caseItem => 
    caseItem.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    caseItem.description?.toLowerCase().includes(query.toLowerCase())
  );

  return filteredCases;
}
