// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ valore: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.valore }));

import { TabBar } from "./tab-bar";

describe("TabBar", () => {
  it("mostra le cinque voci nell'ordine previsto, con Scansiona al centro", () => {
    pathname.valore = "/";
    render(<TabBar />);
    const nomi = screen.getAllByRole("link").map((l) => l.textContent);
    expect(nomi).toEqual(["Home", "Magazzino", "Scansiona", "Spesa", "Profilo"]);
  });

  it("segna come corrente solo la voce attiva", () => {
    pathname.valore = "/magazzino";
    render(<TabBar />);
    const attive = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "page");
    expect(attive.map((l) => l.textContent)).toEqual(["Magazzino"]);
  });
});
