# VinGrape AI — Built-in AI Assistant

VinGrape AI is the integrated artificial intelligence assistant of the VinGrape operating system. It is completely **free** with no API keys, no signups, and no usage limits.

## Features

### Chat
Have natural conversations with the AI. Ask questions, get explanations, brainstorm ideas, or just talk.

### Theme Creation
Ask the AI to create custom themes for your operating system. Examples:
- "Create a pure black theme with white accents"
- "Make a beautiful sunset gradient theme"
- "Design an ocean blue theme with cyan highlights"

The AI generates a complete theme with 40 settings (colors, gradients, fonts, radii, shadows, glow effects, and more) and adds it to your Settings → Appearance panel instantly. The theme persists across reloads.

### App Creation
Ask the AI to build desktop apps. Examples:
- "Create a calculator app"
- "Make a digital clock app"
- "Build a color picker tool"

The AI writes a complete React component and adds it to your desktop. Created apps appear in the start menu and dock.

### Persistence
All created themes and apps are saved to the cloud database, so they survive page reloads and are available across sessions.

## How It Works

VinGrape AI uses the **Pollinations.AI** free text generation API — a completely free, open-source AI platform that requires no authentication. The API is OpenAI-compatible and accessible at `https://text.pollinations.ai/openai`.

The AI is given a system prompt that explains the VinGrape OS structure, including:
- The 40-field theme schema (CSS colors, gradients, layout metrics)
- The app component format (React + Tailwind + lucide-react)
- Special JSON tag formats (`<THEME_JSON>`, `<APP_JSON>`) for structured output

When the AI responds with a theme or app JSON block, the OS parses it, saves it to Supabase, and applies it live.

## Privacy

- Conversations are sent to the Pollinations.AI API for processing
- Created themes and apps are stored in your Supabase project
- No personal data is collected or stored

## Usage Tips

1. **Be specific** when requesting themes — mention colors, mood, or style
2. **Be descriptive** when requesting apps — describe what it should do
3. The AI can **chat about anything** — it's not limited to OS customization
4. Created themes appear in **Settings → Appearance** alongside built-in themes
5. Created apps appear in the **start menu** and on the **desktop**

## Technical Details

- **API**: Pollinations.AI (free, no key required)
- **Model**: OpenAI-compatible endpoint
- **Storage**: Supabase (custom_themes, custom_apps tables)
- **Theme format**: JSON with 40 settings applied via CSS custom properties
- **App format**: React TSX components with Tailwind CSS

---

Made by ArtGroup (Artem Malmygin)
