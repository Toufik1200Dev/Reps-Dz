const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../controllers/programController.js');
let c = fs.readFileSync(file, 'utf8');

const oldStr = `  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error('OpenRouter returned no content');
  return content;
}`;

const newStr = `  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    const retryCount = options._retryCount || 0;
    if (retryCount < 2) {
      console.warn('[Program] OpenRouter returned no content, retrying...', retryCount + 1);
      await new Promise((r) => setTimeout(r, 2000));
      return callOpenRouter(messages, { ...options, _retryCount: retryCount + 1 });
    }
    throw new Error('OpenRouter returned no content');
  }
  return content;
}`;

if (c.includes("throw new Error('OpenRouter returned no content')") && !c.includes('_retryCount')) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(file, c);
  console.log('Done: added OpenRouter retry logic');
} else {
  console.log('Already applied or pattern changed');
}
