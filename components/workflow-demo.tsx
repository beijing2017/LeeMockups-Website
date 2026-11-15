"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/marketing-attribution";

export function WorkflowDemo() {
  const [playing, setPlaying] = useState(false);
  return <div className="workflow-demo-player">
    {playing ? <iframe src="https://www.youtube-nocookie.com/embed/sFGsWJYoUrc?autoplay=1" title="LeeMockups complete mockup creation walkthrough" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <button type="button" className="workflow-demo-cover" aria-label="Play the full LeeMockups walkthrough" onClick={() => { setPlaying(true); trackEvent("watch_demo", { video_id: "sFGsWJYoUrc" }); }}>
        <img src="https://i.ytimg.com/vi/sFGsWJYoUrc/hqdefault.jpg" alt="Preview of the LeeMockups video walkthrough" loading="lazy" />
        <span className="workflow-play"><Play size={24} fill="currentColor" /> Watch the full walkthrough</span>
      </button>}
  </div>;
}
