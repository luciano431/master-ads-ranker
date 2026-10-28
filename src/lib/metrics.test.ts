import { describe, expect, it } from "vitest";
import { deriveAd, summarize } from "./metrics";
import { periodRange } from "./dates";
import type { AdRow } from "./types";

const row = (over: Partial<AdRow> = {}): AdRow => ({
  ad_id: "1", ad_name: "a", status: "ACTIVE", preview_url: null, thumbnail_url: null,
  object_type: null, is_video: false, spend: 100, impressions: 10000, link_clicks: 200,
  purchases: 4, purchase_value: 500, leads: 20, ...over,
});

describe("deriveAd", () => {
  it("calcula ROAS, CPA, CTR y CPC con link clicks", () => {
    const ad = deriveAd(row(), "purchases");
    expect(ad.roas).toBe(5);
    expect(ad.cpa).toBe(25);
    expect(ad.ctr).toBe(2);
    expect(ad.cpc).toBe(0.5);
  });

  it("usa leads como conversión cuando se elige", () => {
    expect(deriveAd(row(), "leads").cpa).toBe(5);
  });

  it("devuelve null en vez de dividir por cero", () => {
    const ad = deriveAd(row({ spend: 0, purchases: 0, impressions: 0, link_clicks: 0 }), "purchases");
    expect([ad.roas, ad.cpa, ad.ctr, ad.cpc]).toEqual([null, null, null, null]);
  });
});

describe("summarize", () => {
  it("pondera el ROAS por gasto", () => {
    const ads = [row({ spend: 100, purchase_value: 1000 }), row({ ad_id: "2", spend: 900, purchase_value: 900 })]
      .map((r) => deriveAd(r, "purchases"));
    expect(summarize(ads).roas).toBeCloseTo(1.9);
  });
});

describe("periodRange", () => {
  it("toma N días completos terminando ayer", () => {
    expect(periodRange(7, new Date("2026-10-28T12:00:00Z"))).toEqual({ since: "2026-10-21", until: "2026-10-27" });
  });
});
