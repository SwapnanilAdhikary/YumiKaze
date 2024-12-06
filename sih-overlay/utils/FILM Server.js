// interpolateFrames.js

import Replicate from "replicate";

export const interpolateFrames = async (frame1, frame2, timesToInterpolate) => {
  try {
    const replicate = new Replicate({
      auth: "r8_DyCtmqxEJiJQHD7yk2piEuGCp4bMYga1jMCjQ", // Replace with your actual API key
    });

    const output = await replicate.run(
      "google-research/frame-interpolation:4f88a16a13673a8b589c18866e540556170a5bcb2ccdc12de556e800e9456d3d",
      {
        input: {
          frame1,
          frame2,
          times_to_interpolate: timesToInterpolate,
        },
      }
    );

    console.log("Interpolated frames output:", output);
    return output;
  } catch (error) {
    console.error("Error during frame interpolation:", error);
    throw error; // Re-throw the error for handling in the calling context
  }
};
