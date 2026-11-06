# Managing Historic Figures

This guide explains how to add, edit, or remove historic figures from the game.

## File Location

All figures are managed in: **`src/data/figuresConfig.ts`**

This file is shared with the Cloudflare Worker that powers AI Mode, so it must stay free of browser-only and Node-only code. The Worker looks figures up by `figureId(name)`, a slug derived from the name (for example `albert-einstein`), so keep names unique.

## Current Status

- **Enabled Figures**: 60
- **Total Figures**: 60

The daily puzzle cycles through the enabled roster one figure per day, so every figure added pushes the first repeat further out.

## Adding a New Figure

1. Open `src/data/figuresConfig.ts`
2. Add a new object to the `allFigures` array:

```typescript
{
  enabled: true,  // Set to true when ready to use
  name: "Full Name",
  alternateNames: ["alternate1", "nickname"],
  eraTags: ["Era", "Field"],              // optional, shown under the silhouette
  voiceLine: "A short in-character line.", // optional, shown after a correct guess
  clues: [
    { text: "Clue 1 - Most vague", difficulty: 'hard' },
    { text: "Clue 2 - Still vague", difficulty: 'medium' },
    { text: "Clue 3 - Getting more specific", difficulty: 'medium' },
    { text: "Clue 4 - Very specific", difficulty: 'easy' },
    { text: "Clue 5 - Almost gives it away", difficulty: 'easy' }
  ]
}
```

The `difficulty` tag drives adaptive hints: after repeated misses the game reveals the easiest remaining clue first.

### Guidelines for Clues

**Progressive Difficulty**: Order clues from vague to specific
- **Clue 1**: Era, location, or field (very broad)
- **Clue 2**: Major achievement or role (still general)
- **Clue 3**: Specific accomplishments
- **Clue 4**: Very distinctive facts
- **Clue 5**: Nearly unmistakable details

**Example - Good Clue Progression**:
```typescript
clues: [
  { text: "I was born in Germany in 1879.", difficulty: 'hard' },              // When/where
  { text: "I won the Nobel Prize in Physics in 1921.", difficulty: 'medium' }, // Recognition
  { text: "I developed the theory of relativity.", difficulty: 'medium' },     // Major work
  { text: "My famous equation is E=mc².", difficulty: 'easy' },                // Specific detail
  { text: "I had distinctive wild white hair.", difficulty: 'easy' }           // Unmistakable trait
]
```

**Alternate Names**: Include all reasonable variations, all lower-case
- Last name only: `["einstein"]`
- Full name variations: `["marie curie", "marie sklodowska-curie"]`
- Nicknames: `["leonardo", "da vinci"]`
- Titles: `["queen elizabeth", "elizabeth i"]`
- Unaccented and native spellings: `["simon bolivar"]`, `["ibn sina"]`

Every alternate name is a full-credit answer on its own, so leave out bare titles and epithets (`"king"`, `"the great"`) that could point at several figures. Classic mode already refuses a partial match made only of such words (see `NAME_TOKEN_STOPWORDS` in `src/utils/gameUtils.ts`), and AI mode uses the same list to tell a question like "were you great?" from a guess.

## Editing a Figure

1. Find the figure in `src/data/figuresConfig.ts`
2. Update any property directly:
   - Change the name
   - Add/remove alternate names
   - Rewrite clues
3. Save the file
4. Changes take effect immediately in dev mode

## Enabling/Disabling Figures

### To Enable a Figure
```typescript
{
  enabled: true,  // Change false to true
  name: "Figure Name",
  // ...
}
```

### To Disable a Figure (Soft Delete)
```typescript
{
  enabled: false,  // Change true to false
  name: "Figure Name",
  // ...
}
```

This keeps the data intact for future use.

### To Remove Completely (Hard Delete)
Delete the entire object from the array. **Warning**: This permanently removes the figure.

## Testing Your Changes

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. In the game:
   - **Classic Mode**: Use the header toggle, check that clues make sense and progress logically
   - **AI Mode**: Flip the toggle (needs `OPENAI_API_KEY` in `.env.local`) and test that the AI can accurately portray the figure
   - **Guess Validation**: Try various name formats to ensure alternate names work

3. Run `npm test`:
   - `src/data/figuresConfig.test.ts` checks every figure has exactly five clues, at least one `easy` clue, a unique id, a voice line and era tags, lower-case alternate names, and that no clue contains the name or an alternate name; it also requires at least 50 enabled figures
   - `src/utils/gameUtils.test.ts` checks guess matching against the roster (titles and epithets alone never win)
   - The "How to Play" overlay shows how many figures are enabled

## Best Practices

### Writing Good Clues

✅ **Do**:
- Use first person ("I was born..." not "They were born...")
- Be historically accurate
- Progress from general to specific
- Include diverse types of info (when/where, achievements, famous works, personal traits)

❌ **Don't**:
- Reveal the name directly (a test fails if a clue contains the name or any alternate name, so "the Elizabethan era" cannot be a clue for Elizabeth I)
- Name another figure from the roster as if they were the answer; mentioning them as an ally or rival is fine
- Make clues too easy at the start
- Make clues too obscure at the end
- Include controversial or sensitive information

### Choosing Alternate Names

✅ **Include**:
- Common shortened versions
- Full vs. shortened names
- Maiden names (for historical figures)
- Title variations

❌ **Don't Include**:
- Very obscure nicknames
- Misspellings (the AI handles typos)
- Names in other languages (unless commonly used in English)

### AI Mode Considerations

In AI Mode the Worker builds the figure's system prompt from your clues, so they double as the model's reference material. Make sure:
- Clues contain factual, verifiable information
- Information is rich enough for the AI to roleplay
- Facts are from different aspects of the figure's life

## Current Enabled Figures

1. Albert Einstein
2. Marie Curie
3. Leonardo da Vinci
4. William Shakespeare
5. Nikola Tesla
6. Galileo Galilei
7. Isaac Newton
8. Napoleon Bonaparte
9. Joan of Arc
10. Queen Elizabeth I
11. Hatshepsut
12. Tutankhamun
13. Cleopatra
14. Confucius
15. Socrates
16. Archimedes
17. Alexander the Great
18. Julius Caesar
19. Boudica
20. Wu Zetian
21. Murasaki Shikibu
22. Avicenna
23. Mansa Musa
24. Marco Polo
25. Ibn Battuta
26. Zheng He
27. Johannes Gutenberg
28. Michelangelo
29. Suleiman the Magnificent
30. Montezuma II
31. Wolfgang Amadeus Mozart
32. Ludwig van Beethoven
33. Catherine the Great
34. George Washington
35. Simón Bolívar
36. Jane Austen
37. Charles Darwin
38. Abraham Lincoln
39. Harriet Tubman
40. Florence Nightingale
41. Ada Lovelace
42. Vincent van Gogh
43. Louis Pasteur
44. Hokusai
45. Queen Victoria
46. Mahatma Gandhi
47. Winston Churchill
48. Amelia Earhart
49. Frida Kahlo
50. Alan Turing
51. Anne Frank
52. Rosa Parks
53. Martin Luther King Jr.
54. Nelson Mandela
55. Yuri Gagarin
56. Pablo Picasso
57. Wangari Maathai
58. Helen Keller
59. Neil Armstrong
60. Agatha Christie

## Function Reference

### `getEnabledFigures()`
Returns array of all enabled figures (used by the game)

### `getFigureCount()`
Returns:
```typescript
{
  enabled: number,  // Count of enabled figures
  total: number     // Count of all figures
}
```

### `figureId(name)`
Returns the URL-safe id the browser sends to the AI API, e.g. `figureId("Joan of Arc")` is `"joan-of-arc"`.

### `getFigureById(id)`
Returns the enabled figure with that id, or `undefined`. Used by the Worker to build prompts.

## Troubleshooting

**Figure not appearing in game?**
- Check `enabled: true` is set
- Verify the clues array has exactly 5 entries
- Make sure there are no syntax errors in the file

**AI mode not working correctly?**
- Clues should be historically accurate
- Include diverse information (not just achievements)
- Test in Classic mode first to verify clues work
- If the Worker answers `unknown_figure`, the figure is disabled or its name changed; the id is derived from the name

**TypeScript errors?**
- Ensure the structure matches the `HistoricFigure` interface
- Check for missing commas or brackets
- Run `npm run build` to see detailed errors
