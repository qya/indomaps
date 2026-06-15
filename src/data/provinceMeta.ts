export interface ProvinceMeta {
  slug: string;
  whatGeoId: number;
  name: string;
}

export const PROVINCES: ProvinceMeta[] = [
  { slug: "id-ac", whatGeoId: 11, name: "Aceh" },
  { slug: "id-su", whatGeoId: 12, name: "Sumatera Utara" },
  { slug: "id-sb", whatGeoId: 13, name: "Sumatera Barat" },
  { slug: "id-ri", whatGeoId: 14, name: "Riau" },
  { slug: "id-ja", whatGeoId: 15, name: "Jambi" },
  { slug: "id-ss", whatGeoId: 16, name: "Sumatera Selatan" },
  { slug: "id-be", whatGeoId: 17, name: "Bengkulu" },
  { slug: "id-la", whatGeoId: 18, name: "Lampung" },
  { slug: "id-bb", whatGeoId: 19, name: "Kepulauan Bangka Belitung" },
  { slug: "id-kr", whatGeoId: 21, name: "Kepulauan Riau" },
  { slug: "id-jk", whatGeoId: 31, name: "DKI Jakarta" },
  { slug: "id-jb", whatGeoId: 32, name: "Jawa Barat" },
  { slug: "id-jt", whatGeoId: 33, name: "Jawa Tengah" },
  { slug: "id-yo", whatGeoId: 34, name: "DI Yogyakarta" },
  { slug: "id-ji", whatGeoId: 35, name: "Jawa Timur" },
  { slug: "id-bt", whatGeoId: 36, name: "Banten" },
  { slug: "id-ba", whatGeoId: 51, name: "Bali" },
  { slug: "id-nb", whatGeoId: 52, name: "Nusa Tenggara Barat" },
  { slug: "id-nt", whatGeoId: 53, name: "Nusa Tenggara Timur" },
  { slug: "id-kb", whatGeoId: 61, name: "Kalimantan Barat" },
  { slug: "id-kt", whatGeoId: 62, name: "Kalimantan Tengah" },
  { slug: "id-ks", whatGeoId: 63, name: "Kalimantan Selatan" },
  { slug: "id-ki", whatGeoId: 64, name: "Kalimantan Timur" },
  { slug: "id-ku", whatGeoId: 65, name: "Kalimantan Utara" },
  { slug: "id-sa", whatGeoId: 71, name: "Sulawesi Utara" },
  { slug: "id-st", whatGeoId: 72, name: "Sulawesi Tengah" },
  { slug: "id-sn", whatGeoId: 73, name: "Sulawesi Selatan" },
  { slug: "id-sg", whatGeoId: 74, name: "Sulawesi Tenggara" },
  { slug: "id-go", whatGeoId: 75, name: "Gorontalo" },
  { slug: "id-sr", whatGeoId: 76, name: "Sulawesi Barat" },
  { slug: "id-ma", whatGeoId: 81, name: "Maluku" },
  { slug: "id-mu", whatGeoId: 82, name: "Maluku Utara" },
  { slug: "id-pa", whatGeoId: 91, name: "Papua" },
  { slug: "id-pb", whatGeoId: 92, name: "Papua Barat" },
  { slug: "id-ps", whatGeoId: 93, name: "Papua Selatan" },
  { slug: "id-pt", whatGeoId: 94, name: "Papua Tengah" },
  { slug: "id-pe", whatGeoId: 95, name: "Papua Pegunungan" },
  { slug: "id-pd", whatGeoId: 96, name: "Papua Barat Daya" },
];

export const PROVINCE_BY_SLUG = Object.fromEntries(
  PROVINCES.map((p) => [p.slug, p])
) as Record<string, ProvinceMeta>;

export const PROVINCE_BY_WHATGEO_ID = Object.fromEntries(
  PROVINCES.map((p) => [p.whatGeoId, p])
) as Record<number, ProvinceMeta>;
