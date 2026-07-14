import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * A custom hook to access the system theme preference.
 * Returns either 'light' or 'dark'.
 */
export function useColorScheme() {
  return _useColorScheme() ?? 'light';
}

export default useColorScheme;
