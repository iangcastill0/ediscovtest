import { prepScopes, Providers } from '@microsoft/mgt-element';

export async function getCaseItems(query) {
  const provider = Providers.globalProvider;
  console.log('get cases start')
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;

    const results = await graphClient
      ?.api('/compliance/ediscovery/cases')
      .version('beta')
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();

    console.log('get cases:', results)

    return results.value;
  }
  return [];
}

export async function addCaseItem(item, caseName, descriptionText, caseNumber) {
  console.log('caseNumber', caseNumber)
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const ediscoveryCase = {
      displayName: caseName,
      description: descriptionText,
      externalId: caseNumber
    };
    const results = await graphClient
      ?.api('/security/cases/ediscoveryCases')
      .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
      .post(ediscoveryCase);
    return results;
  }
  return false;
}

export async function getCaseItem(id) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;

    const results = await graphClient
      ?.api(`/compliance/ediscovery/cases/${id}`)
      .version('beta')
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();

    return results;
  }
  return {};
}

export async function deleteCaseItem(deleteId) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    try {
      const results = await graphClient
      ?.api(`/security/cases/ediscoveryCases/${deleteId}`)
      .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
      .delete();
      console.log('delete case result:', results);
      return results;
    } catch (error) {
      console.log('delete error:', error.message);
      return error.message;
    }
  }
  return false;
}

export async function deleteSearchItem(currentCase, deleteId) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    try {
      const results = await graphClient
      ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/searches/${deleteId}`)
      .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
      .delete();
      console.log('delete search result:', results);
      return results;
    } catch (error) {
      console.log('delete search error:', error.message);
      return error.message;
    }
  }
  return false;
}

export async function deleteHoldItem(currentCase, deleteId) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    try {
      const results = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${deleteId}/removeHold`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post();
      console.log('delete hold result:', results);
      return results;
    } catch (error) {
      console.log('delete hold error:', error.message);
      return error.message;
    }
  }
  return false;
}

export async function deleteLegalHoldItem(currentCase, deleteId) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    try {
      const results = await graphClient
          ?.api(`/compliance/ediscovery/cases/${currentCase.id}/legalHolds/${deleteId}`)
          .version('beta')
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
	        .delete();
      console.log('delete legal hold result:', results);
      return results;
    } catch (error) {
      console.log('delete legal hold error:', error.message);
      return error.message;
    }
  }
  return false;
}

export async function getCustodianItems(currentCase) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const results = await graphClient
      ?.api(`/compliance/ediscovery/cases/${currentCase.id}/custodians`)
      .version('beta')
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();
    return results.value;
  }
  return [];
}

export async function getSearchList(currentCase) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const results = await graphClient
      ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/searches`)
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();
    return results.value;
  }
  return [];
}

export async function getReviewList(currentCase) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const results = await graphClient
      ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/reviewSets`)
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();
    return results.value;
  }
  return [];
}

export async function addCustodianItem(currentCase, custodianName) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const _custodian = {
      email: custodianName,
    };
    try {
      const results = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .post(_custodian);
      if(results.id){
        const userSource = {
          email: custodianName,
          includedSources: 'mailbox, site'
        };
        const sourceResults = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${results.id}/userSources`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post(userSource);
        const updateIndexResults = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${results.id}/updateIndex`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post();
        const applyHoldResults = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${results.id}/applyHold`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post();
      }
      return results;
    } catch (error) {
      console.error("Error adding custodian:", error);
      return false;
    }
  }
  return false;
}

export async function addSearchItem(currentCase, selectCustodian, searchName) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    try {
      const userSources = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${selectCustodian.id}/userSources`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .get();
      if(userSources.value.length > 0){
        const custodianSources = userSources.value.map(item => `https://graph.microsoft.com/v1.0/security/cases/ediscoveryCases/${currentCase.id}/custodians/${selectCustodian.id}/userSources/${item.id}`);
        const _search = {
          displayName: searchName,
          description: 'My search',
          contentQuery: '',
          'custodianSources@odata.bind': custodianSources,
          'noncustodialSources@odata.bind': []
        };
        const results = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/searches`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post(_search);
        if(results.id){
          const estimateResult = await graphClient
            ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/searches/${results.id}/estimatestatistics`)
            .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
            .post();
        }
      }
      const siteSources = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${selectCustodian.id}/siteSources`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .get();
      console.log('siteSources', siteSources)
      const unifiedGroupSources = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/custodians/${selectCustodian.id}/unifiedGroupSources`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .get();
      console.log('unifiedGroupSources', unifiedGroupSources)
      const noncustodialdatasources = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/noncustodialdatasources`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .get();
      console.log('noncustodialdatasources', noncustodialdatasources)
      return userSources;
    } catch (error) {
      console.error("Error adding search:", error);
      return false;
    }
  }
  return false;
}

export async function addReviewItem(currentCase, collection, reviewName) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const ediscoveryReviewSet = {
      displayName: reviewName
    };
    try {
      const reviewSetResult = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/reviewSets`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .post(ediscoveryReviewSet);
      if(reviewSetResult.id){
        const addToReviewSet = {
          search: {
              id: collection.id
          },
          additionalDataOptions: 'linkedFiles'
        };
        const estimateResult = await graphClient
          ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/reviewSets/${reviewSetResult.id}/addToReviewSet`)
          .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
          .post(addToReviewSet);
        console.log('addToReviewSet', estimateResult);
      }
      console.log(reviewSetResult)
      return reviewSetResult;
    } catch (error) {
      console.error("Error adding search:", error);
      return false;
    }
  }
  return false;
}

export async function addExportItem(currentCase, review, exportName) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const _export = {
      outputName: exportName,
      description: `Export for ${review.displayName}`,
      exportOptions: 'originalFiles,tags',
      exportStructure: 'directory'
    };
    try {
      const exportResult = await graphClient
        ?.api(`/security/cases/ediscoveryCases/${currentCase.id}/reviewSets/${review.id}/export`)
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .post(_export);
      console.log('exportResult', exportResult)
      return exportResult;
    } catch (error) {
      console.error("Error adding search:", error);
      return false;
    }
  }
  return false;
}

export async function addHoldItem(currentCase, holdName) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;
    const _legalHold = {
      '@odata.type': '#microsoft.graph.ediscovery.legalHold',
      description: 'This is a new hold',
      createdBy: {
        '@odata.type': 'microsoft.graph.identitySet'
      },
      isEnabled: true,
      status: 'Pending',
      contentQuery: '',
      errors: [
        'error'
      ],
      displayName: holdName
    };

    try {
      const results = await graphClient
        ?.api(`/compliance/ediscovery/cases/${currentCase.id}/legalHolds`)
        .version('beta')
        .middlewareOptions(prepScopes('eDiscovery.ReadWrite.All'))
        .post(_legalHold);
      console.log(results);
      return results;
    } catch (error) {
      console.error("Error adding legal hold:", error);
      return false;
    }
  }
  return false;
}

export async function getHoldItems(currentCase) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;

    const results = await graphClient
      ?.api(`/compliance/ediscovery/cases/${currentCase.id}/legalHolds`)
      .version('beta')
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();
    console.log('hold list', results);

    return results.value;
  }
  return [];
}

export async function getHoldItem(caseId, holdId) {
  const provider = Providers.globalProvider;
  if (provider?.graph?.client) {
    const graphClient = provider.graph.client;

    const results = await graphClient
      ?.api(`/compliance/ediscovery/cases/${caseId}/legalHolds${holdId}`)
      .version('beta')
      .middlewareOptions(prepScopes('eDiscovery.Read.All'))
      .get();
      console.log('hold item', results);

    return results;
  }
  return {};
}