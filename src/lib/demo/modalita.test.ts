import { afterEach, describe, expect, it, vi } from "vitest";
import { modalitaDemo } from "./modalita";

afterEach(() => vi.unstubAllEnvs());

describe("modalitaDemo", () => {
  it("è spenta di default", () => {
    vi.stubEnv("MODALITA_DEMO", "");
    expect(modalitaDemo()).toBe(false);
  });

  it("si accende solo con MODALITA_DEMO=1 in sviluppo", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MODALITA_DEMO", "1");
    expect(modalitaDemo()).toBe(true);
    vi.stubEnv("MODALITA_DEMO", "true");
    expect(modalitaDemo()).toBe(false);
  });

  it("non si accende mai in produzione, nemmeno con la variabile impostata", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MODALITA_DEMO", "1");
    expect(modalitaDemo()).toBe(false);
  });
});
