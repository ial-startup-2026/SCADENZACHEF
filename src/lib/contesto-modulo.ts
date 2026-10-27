"use client";

import { createContext, useContext } from "react";

/** Valori da rimettere nei campi dopo un invio non riuscito. */
export const ValoriModulo = createContext<Record<string, string> | undefined>(undefined);

export const useValoriModulo = () => useContext(ValoriModulo);
