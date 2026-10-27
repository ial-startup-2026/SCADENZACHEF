import { describe, expect, it } from "vitest";
import { calcolaDimensioni } from "./immagini";

describe("calcolaDimensioni", () => {
  it("riduce il lato lungo mantenendo le proporzioni", () => {
    expect(calcolaDimensioni(4000, 3000, 1600)).toEqual({ larghezza: 1600, altezza: 1200 });
    expect(calcolaDimensioni(3000, 4000, 1600)).toEqual({ larghezza: 1200, altezza: 1600 });
  });

  it("non ingrandisce mai le immagini piccole", () => {
    expect(calcolaDimensioni(800, 600, 1600)).toEqual({ larghezza: 800, altezza: 600 });
  });

  it("non produce dimensioni nulle con immagini molto allungate", () => {
    expect(calcolaDimensioni(10000, 2, 100)).toEqual({ larghezza: 100, altezza: 1 });
  });
});
