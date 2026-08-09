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

      console.log(`Trying Cerebras key #${i + 1}`);

      const response = await fetch(
        "https://api.cerebras.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );


      if (!response.ok) {

        const errorText = await response.text();

        console.warn(
          `Cerebras key #${i + 1} failed: ${response.status}`,
          errorText.substring(0, 200)
        );

        continue;
      }


      const json = await response.json();


      const answer =
        json?.choices?.[0]?.message?.content;


      if (answer) {
        return answer;
      }


    } catch (error) {

      console.warn(
        `Cerebras key #${i + 1} error`,
        error
      );

    }
  }


  return null;
}
