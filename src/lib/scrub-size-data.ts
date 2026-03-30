import type { ScrubSize } from "@/types/registration";

/** Reference measurements (cm) — illustrative; adjust when official chart is available. */
export const SCRUB_SIZE_COLUMNS: ScrubSize[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
];

type RowKey = "A" | "B" | "C" | "D" | "E";

export const SCRUB_TABLE_ROWS: {
  key: RowKey;
  label: string;
  values: Record<ScrubSize, string>;
}[] = [
  {
    key: "A",
    label: "LINGKAR BADAN",
    values: {
      S: "96",
      M: "104",
      L: "112",
      XL: "120",
      XXL: "128",
      "3XL": "136",
      "4XL": "144",
    },
  },
  {
    key: "B",
    label: "PANJANG BADAN",
    values: {
      S: "68",
      M: "72",
      L: "76",
      XL: "80",
      XXL: "84",
      "3XL": "88",
      "4XL": "92",
    },
  },
  {
    key: "C",
    label: "PANJANG LENGAN",
    values: {
      S: "58",
      M: "60",
      L: "62",
      XL: "64",
      XXL: "66",
      "3XL": "68",
      "4XL": "70",
    },
  },
  {
    key: "D",
    label: "LEBAR PINGGANG",
    values: {
      S: "48",
      M: "52",
      L: "56",
      XL: "60",
      XXL: "64",
      "3XL": "68",
      "4XL": "72",
    },
  },
  {
    key: "E",
    label: "LINGKAR PANGGUL",
    values: {
      S: "100",
      M: "108",
      L: "116",
      XL: "124",
      XXL: "132",
      "3XL": "140",
      "4XL": "148",
    },
  },
];
