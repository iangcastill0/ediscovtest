import { prepScopes, Providers, ProviderState } from '@microsoft/mgt-element';
import { getCaseUrl } from '../helpers/CaseHelpers';

export async function getTaskLists() {
  const provider = Providers.globalProvider;
  let graphClient;
  if (provider && provider.state === ProviderState.SignedIn) {
    graphClient = provider.graph.client;
  }

  const results = await graphClient
    ?.api('/me/todo/lists')
    .version('v1.0')
    .middlewareOptions(prepScopes('Tasks.ReadWrite'))
    .get();

  const taskLists = results.value;
  return taskLists;
}

export async function addTodoItem(item, listId) {
  const provider = Providers.globalProvider;
  let graphClient;
  if (provider && provider.state === ProviderState.SignedIn) {
    graphClient = provider.graph.client;
  }

  const newTask = await graphClient
    ?.api(`/me/todo/lists/${listId}/tasks`)
    .version('v1.0')
    .middlewareOptions(prepScopes('Tasks.ReadWrite'))
    .post({
      title: item?.displayName,
      linkedResources: [
        {
          webUrl: getCaseUrl(item),
          applicationName: 'Browser',
          displayName: item?.displayName,
        },
      ],
    });

  return newTask;
}
