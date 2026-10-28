export type Account = {
  id: string;
  name: string;
  currency: string;
  status: "active" | "inactive";
};

// Lo que devuelve la Edge Function: métricas crudas por anuncio.
export type AdRow = {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  status: string;
  preview_url: string | null;
  thumbnail_url: string | null;
  object_type: string | null;
  is_video: boolean;
  spend: number;
  impressions: number;
  link_clicks: number;
  purchases: number;
  purchase_value: number;
  leads: number;
  messages: number;
};

// Cotización usada para pasar los montos a USD.
export type Fx = { from: string; rate: number; source: string };

export type ConversionType = "purchases" | "leads" | "messages";
