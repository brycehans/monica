// Server payload shapes shared across the people neighbourhood —
// Emotion.vue (the picker), CreateActivity (form submission), ActivityList
// (read-out), PhoneCallList (read-out). Same `{ id, name }` shape in all
// four; centralising avoids drift when, e.g., a server adds an `icon`
// field and only one consumer is updated.

export interface Emotion {
  id: number;
  name: string;
}
