// Публічний URL медіафайлу тваринки в Supabase Storage (бакет 'pets').
export const petImageUrl = (fileName) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pets/${fileName}`;
