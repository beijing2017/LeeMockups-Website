// Stable provider boundary. V1 intentionally ships without credentials or a remote call.
// A future adapter receives sampled frame paths and must return only these editable observations.
export class ContentAnalysisProvider {
  async analyze({ framePaths }) {
    throw new Error(`No AI analysis provider configured (${framePaths.length} frames available). Use manual observations.`);
  }
}

export function getContentAnalysisProvider() {
  return null;
}
