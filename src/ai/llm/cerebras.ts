export async function askCerebras(
  messages: any[]
): Promise<string | null> {

  const keys = [
    process.env.CEREBRAS_KEY_1,
    process.env.CEREBRAS_KEY_2,
    process.env.CEREBRAS_KEY_3,
    process.env.CEREBRAS_KEY_4,
    process.env.CEREBRAS_KEY_5,
    process.env.CEREBRAS_KEY_6,
  ].filter(Boolean) as string[];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    try {
      const response = await fetch(
        "https://api.cerebras.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3.1-8b",
            messages,
            temperature: 0.7,
            max_tokens: 800,
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();

        const answer =
          json?.choices?.[0]?.message?.content;

        if (answer) {
          return answer;
        }
      }

      console.warn(
        `Cerebras key ${i + 1} failed (${response.status})`
      );

    } catch (error) {
      console.warn(
        `Cerebras key ${i + 1} error`,
        error
      );
    }
  }

  return null;
}
