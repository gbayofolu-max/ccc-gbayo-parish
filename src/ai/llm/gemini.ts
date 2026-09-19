async function fetchWithTimeout(
  url: string,
  options: any,
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}


export async function askGemini(
  messages: any[]
): Promise<string | null> {

  const keys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6,
  ].filter(Boolean) as string[];

  const systemMessage = messages.find((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  const contents = otherMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (let i = 0; i < keys.length; i++) {

    const key = keys[i];

    try {

      console.log(`Trying Gemini key #${i + 1}`);

      const response = await fetchWithTimeout(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            ...(systemMessage
              ? { systemInstruction: { parts: [{ text: systemMessage.content }] } }
              : {}),
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );


      if (!response.ok) {

        const errorText = await response.text();

        console.warn(
          `Gemini key #${i + 1} failed: ${response.status}`,
          errorText.substring(0, 200)
        );

        continue;
      }


      const json = await response.json();


      const answer =
        json?.candidates?.[0]?.content?.parts?.[0]?.text;


      if (answer) {
        return answer;
      }


    } catch (error) {

      console.warn(
        `Gemini key #${i + 1} error (or timed out)`,
        error
      );

    }
  }


  return null;
}
