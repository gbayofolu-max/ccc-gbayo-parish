import { NextRequest, NextResponse } from "next/server";

import { nehemiahPipeline } from "@/ai/pipelines/nehemiahPipeline";


export async function POST(request: NextRequest) {

  try {

    const body = await request.json();

    const question =
      body?.question?.trim();


    if (!question) {

      return NextResponse.json(
        {
          error: "Question is required.",
        },
        {
          status: 400,
        }
      );

    }


    console.log(
      "🔥 NEHEMIAH AI QUESTION:",
      question
    );


    const answer =
      await nehemiahPipeline({
        question,
      });


    if (!answer) {

      throw new Error(
        "AI providers returned no response."
      );

    }


    return NextResponse.json({

      success: true,

      answer,

    });


  } catch (error) {


    console.error(
      "🚨 NEHEMIAH AI ERROR:",
      error
    );


    return NextResponse.json(

      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },

      {
        status: 500,
      }

    );

  }

}
