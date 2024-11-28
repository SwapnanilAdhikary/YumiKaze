// app/api/interpolatedApi/route.js
import { promises as fs } from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { cnt } = await req.json();

    if (!cnt) {
      console.log("Cnt not provided");
      return new Response(JSON.stringify({ message: "Cnt not provided" }), {
        status: 400, // Use 400 for Bad Request
      });
    }

    // Fix file paths using proper string interpolation
    const oldTestFile = path.resolve(`../../../../public/test.webm`);
    const newTestFile = path.resolve(
      `../../../../public/garbage/test${cnt}.webm`
    );

    const oldVideoCollection = path.resolve(
      `../../../../public/video_collections/test${cnt + 1}.webm`
    );
    const newVideoCollection = path.resolve(`../../../../public/test.webm`);

    // Move the files
    await fs.rename(oldTestFile, newTestFile);
    await fs.rename(oldVideoCollection, newVideoCollection);

    return new Response(
      JSON.stringify({ message: "File moved successfully" }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error moving file: ${err.message}` }),
      { status: 500 }
    );
  }
}
