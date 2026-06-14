// Server payload shapes shared by the gift neighbourhood SFCs (Gifts list,
// per-row Gift display, CreateGift modal). Adding fields here is the single
// place to keep all three in sync with the API resource.

export interface Photo {
  id: number;
  link: string;
}

export interface Gift {
  id: number;
  status: string;
  name: string;
  date?: string | null;
  comment?: string | null;
  url?: string | null;
  amount?: number | null;
  amount_with_currency?: string;
  recipient?: { id?: number; complete_name?: string } | null;
  contact?: { id: number };
  photos: Photo[];
  contact_id?: number;
  // Local row-edit toggle — server doesn't return this; client toggles it.
  edit?: boolean;
}
