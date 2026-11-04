# Managing Historic Figures

This guide explains how to add, edit, or remove historic figures from the game.

## File Location

All figures are managed in: **`src/data/figuresConfig.ts`**

This file is shared with the Cloudflare Worker that powers AI Mode, so it must stay free of browser-only and Node-only code. The Worker looks figures up by `figureId(name)`, a slug derived from the name (for example `albert-einstein`), so keep names unique.

## Current Status

- **Enabled Figures**: 10
- **Total Figures**: 10

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

**Alternate Names**: Include all reasonable variations
- Last name only: `["einstein"]`
- Full name variations: `["marie curie", "marie sklodowska-curie"]`
- Nicknames: `["leonardo", "da vinci"]`
- Titles: `["queen elizabeth", "elizabeth i"]`

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
   - `src/data/figuresConfig.test.ts` checks every figure has exactly five clues and a unique id
   - The "How to Play" overlay shows how many figures are enabled

## Best Practices

### Writing Good Clues

✅ **Do**:
- Use first person ("I was born..." not "They were born...")
- Be historically accurate
- Progress from general to specific
- Include diverse types of info (when/where, achievements, famous works, personal traits)

❌ **Don't**:
- Reveal the name directly
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
