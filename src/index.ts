import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 Treasure Hunter API en puerto ${env.PORT}`);
  console.log(`   AI provider: ${env.AI_PROVIDER} | configured: ${Boolean(env.GEMINI_API_KEY || env.OPENAI_API_KEY)}`);
});
