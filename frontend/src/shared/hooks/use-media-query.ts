import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(() => matchMedia(query).matches);

  useEffect(() => {
    const result = matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    result.addEventListener('change', onChange);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}
