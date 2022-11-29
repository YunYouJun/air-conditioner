export function myUseLocalStorage<T>(key: string, defaultValue: T) {
  const initValue = {
    ...defaultValue,
    ...parseJSON(localStorage.getItem(key)),
  }
  const setValue = function (newValue: any) {
    localStorage.setItem(key, JSON.stringify({ ...newValue }))
  }

  return [initValue, setValue]
}
export default myUseLocalStorage

function parseJSON(value: any) {
  try {
    return value === 'undefined' ? undefined : JSON.parse(value ?? '')
  }
  catch {
    return undefined
  }
}
