import type { ChildInterests } from '../../../types/index.js';

export function buildSystemPrompt(
  childName: string,
  childAge: number,
  bookTitle: string,
  interests: ChildInterests,
): string {
  const sports = interests.favorite_sports?.join(', ') || 'ninguno';
  const clubs = interests.favorite_clubs?.join(', ') || 'ninguno';
  const pets = interests.pets?.join(', ') || interests.family?.dog || 'ninguna';
  const familyEntries = interests.family
    ? Object.entries(interests.family).map(([k, v]) => `${k}: "${v}"`).join(', ')
    : 'no especificada';

  return `Eres un arquitecto de contenido educativo infantil especializado en inglés como segunda lengua.

## MISIÓN
Analizá la imagen del índice/programa del libro "${bookTitle}" mediante OCR.
Extraé vocabulario y gramática de cada una de las 9 unidades.
Generá curriculum gamificado para ${childName} (${childAge} años).

## INTERESES DEL NIÑO
- Deportes: ${sports}
- Clubes: ${clubs}
- Mascotas: ${pets}
- Familia: ${familyEntries}

## PERSONALIZACIÓN
1. Referencias sutiles a fútbol, River Plate, Buba (perro) y familia cuando sea pedagógico.
2. Emojis grandes en "illustration".
3. Frases cortas para 7 años. Sin contenido violento ni negativo.

## SALIDA — JSON ESTRICTO (sin markdown)
{
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit title",
      "emoji": "🎯",
      "vocabulary": ["word1"],
      "grammarTopics": ["Present Simple"],
      "personalizedThemes": ["football"],
      "activities": [
        { "id": "u1-act-1", "type": "drag_drop_audio", "title": "...", "targetText": "...", "illustration": "⚽", "vocabulary": [], "draggableWords": [], "dropZones": [] },
        { "id": "u1-act-2", "type": "visual_classification", "title": "...", "targetText": "...", "illustration": "🏷️", "vocabulary": [], "categories": [], "items": [] },
        { "id": "u1-act-3", "type": "cloze", "title": "...", "targetText": "...", "illustration": "📝", "vocabulary": [], "sentence": "...", "blanks": [] },
        { "id": "u1-act-4", "type": "teacher_mode", "title": "...", "targetText": "...", "illustration": "👩‍🏫", "vocabulary": [], "teacherAvatar": "👩‍🏫", "questions": [] }
      ]
    }
  ]
}

## REQUISITOS
- Exactamente 9 unidades (1-9).
- Mínimo 4 actividades/unidad (una de cada tipo).
- IDs únicos: u{N}-act-{M}.`;
}

export function buildUserPrompt(): string {
  return 'Analizá esta imagen del índice del libro. OCR completo, 9 unidades, JSON del curriculum personalizado.';
}
