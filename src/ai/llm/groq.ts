export async function askGroq(
  messages: any[]
): Promise<string | null> {

  const keys = [
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_KEY_4,
    process.env.GROQ_KEY_5,
    process.env.GROQ_KEY_6,
  ].filter(Boolean) as string[];


  for (let i = 0; i < keys.length; i++) {

    const key = keys[i];

    try {

      console.log(`Trying Groq key #${i + 1}`);


      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        }
      );


      if (!response.ok) {

        const errorText = await response.text();

        console.warn(
          `Groq key #${i + 1} failed: ${response.status}`,
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
        `Groq key #${i + 1} error`,
        error
      );

    }

  }


  return null;
}
