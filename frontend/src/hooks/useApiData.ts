"use client";

import { useCallback, useEffect, useState } from "react";
import { describeError } from "@/lib/api";

interface Estado<T> {
  data?: T;
  error?: string;
}

/**
 * Carga datos del backend y los vuelve a pedir cuando cambia `loader` o se llama a `reload`.
 * `loader` debe estar memoizado con useCallback; sus dependencias actúan como filtros.
 * Mientras recarga se conservan los datos anteriores para evitar parpadeos.
 */
export function useApiData<T>(loader: () => Promise<T>) {
  const [estado, setEstado] = useState<Estado<T>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    loader().then(
      (data) => vigente && setEstado({ data }),
      (error) => vigente && setEstado((prev) => ({ data: prev.data, error: describeError(error) })),
    );
    return () => {
      vigente = false;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: estado.data,
    error: estado.error,
    loading: estado.data === undefined && estado.error === undefined,
    reload,
  };
}
