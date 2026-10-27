"use client";

import { useState } from "react";
import { Scansione } from "./scansione";
import { creaServiziApp } from "./servizi-app";

export function ScansionaApp({ localeId, demo }: { localeId: string; demo: boolean }) {
  const [servizi] = useState(() => creaServiziApp(localeId, demo));
  return <Scansione servizi={servizi} />;
}
