# OpenRouter AI Chat

A multi-model AI chat application built with Next.js and TypeScript. Chat with different AI providers, switch models during a conversation, and keep your conversation history saved locally.

## Live Demo

- **Live application:** https://openrouter-ai-chat-5chzr392x-farhat10.vercel.app/
- **GitHub repository:** https://github.com/hussenfarhat22/openrouter-ai-chat

## Features

- **Multiple AI models:** Switch between OpenAI, Anthropic, Google, Meta, and Mistral.
- **Streaming responses:** See AI responses appear gradually as they are generated.
- **Conversation context:** Switch models within a conversation while preserving the conversation history sent to the selected model.
- **Conversation management:** Create, reopen, rename, and delete conversations.
- **Local persistence:** Conversation history is saved in the browser using localStorage.
- **Markdown support:** Render formatted text, lists, links, and code blocks.
- **Responsive interface:** Desktop and mobile layouts, including a mobile chat-history menu.
- **Light and dark modes:** Switch the interface theme.
- **Server-side API integration:** OpenRouter requests are handled by a Next.js API route.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Vercel AI SDK
- OpenRouter AI SDK provider
- React Markdown and remark-gfm
- Browser localStorage
- Vercel deployment

## Supported Models

The application currently configures these models:

| Provider | Model ID |
|---|---|
| OpenAI | `openai/gpt-4o-mini` |
| Anthropic | `anthropic/claude-haiku-5.5` |
| Google | `google/gemini-3.8-flash` |
| Meta | `meta-llama/llama-3.3-70b-instruct` |
| Mistral | `mistralai/mistral-large-4-0` |

Model availability and usage depend on OpenRouter and the relevant provider. These are the model IDs configured in this project and may need updating if providers change their catalog.

## Prerequisites

Install the following before running the project locally:

- Node.js 22 or later
- npm
- An OpenRouter account and a valid API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hussenfarhat22/openrouter-ai-chat.git
cd openrouter-ai-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your environment variable

Create a `.env.local` file in the project root and add:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Replace the placeholder with your own valid API key.

**Security:** Never commit `.env.local`, expose the API key in client-side code, or use a `NEXT_PUBLIC_` prefix for this secret.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Create a production build

```bash
npm run build
```

## Deployment

This project is deployed on Vercel and connected to the GitHub repository.

To deploy your own copy:

1. Import the repository into Vercel.
2. Add `OPENROUTER_API_KEY` under the project's Environment Variables.
3. Enable it for the environments you need.
4. Deploy the application.

Keep your API key in server-side environment variables.

## Data and Privacy

- Conversation history is stored in the user's browser using localStorage.
- Local conversation history is not automatically synchronized between devices or browsers.
- The selected model receives the conversation messages included in each API request.
- Requests to generate responses are sent to OpenRouter and processed according to its policies and the selected provider's policies.
- The application does not currently use a separate database for conversation storage.

## Known Limitations

- Conversation history is stored locally in the browser and may be lost if browser storage is cleared.
- There is no user authentication or cross-device conversation synchronization.
- Model availability, response quality, latency, and usage costs depend on the selected provider and OpenRouter.
- Provider errors and rate limits may require the user to retry a request.
- The application uses a fixed list of configured model IDs rather than fetching a dynamic model catalog.
- Production error handling, request limits, and accessibility can be improved further.

## Future Improvements

- Improve user-facing error messages for rate limits and unavailable models.
- Add stronger request and abuse protection.
- Improve automated testing and accessibility.
- Add optional database-backed conversation synchronization.
- Add a dynamic model catalog and more detailed usage information.

## License

No license has been specified yet. Contact the repository owner before reusing or redistributing this project.
