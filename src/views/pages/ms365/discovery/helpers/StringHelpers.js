export function isEmpty(value) {
  return !value || value.length === 0;
}

export function hasValue(value) {
  return !isEmpty(value);
}
