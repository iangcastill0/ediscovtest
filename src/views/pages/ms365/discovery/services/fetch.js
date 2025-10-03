async function http(path, config) {
  const request = new Request(path, config);
  const response = await fetch(request);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  // may error if there is no body, return empty array
  return response.json().catch(() => ({}));
}

export async function httpGet(path, config) {
  const init = { method: 'get', ...config };
  return await http(path, init);
}

export async function httpPost(path, body, config) {
  const init = { method: 'post', body: JSON.stringify(body), ...config };
  return await http(path, init);
}

export async function httpPut(path, body, config) {
  const init = { method: 'put', body: JSON.stringify(body), ...config };
  return await http(path, init);
}

export async function httpDelete(path, body, config) {
  const init = { method: 'delete', body: JSON.stringify(body), ...config };
  return await http(path, init);
}
