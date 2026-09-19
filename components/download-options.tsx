"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ShieldCheck } from "lucide-react";

type Props = { version:string; windows:string; macArm64:string; macX64:string };
const AppleMark=()=> <svg className="apple-mark" aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.22.07 2.07.67 2.79.72 1.08-.22 2.11-.85 3.27-.77 1.39.11 2.44.66 3.15 1.65-2.87 1.72-2.19 5.5.44 6.56-.57 1.5-1.3 2.99-2.5 4.05zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z" /></svg>;
const WindowsMark=()=> <span className="windows-mark" aria-hidden="true"><i/><i/><i/><i/></span>;

export function DownloadOptions({version,windows,macArm64,macX64}:Props){
  const [system,setSystem]=useState<"windows"|"mac"|"other">("other");
  useEffect(()=>{const identity=`${navigator.platform||""} ${navigator.userAgent||""}`;setSystem(/Macintosh|Mac OS X|MacIntel/i.test(identity)?"mac":/Windows|Win32|Win64/i.test(identity)?"windows":"other")},[]);
  return <div className="download-options">
    <a className={`platform${system==="windows"?" main-download":""}`} id="windows-download" href={windows}><WindowsMark/><span><small>{system==="windows"?"RECOMMENDED FOR YOUR COMPUTER":"DOWNLOAD FOR"}</small><strong>Windows <b>v{version}</b></strong><em>Windows 10 or later · 64-bit Windows · Portable ZIP</em></span><ArrowDown/></a>
    <a className={`platform${system==="mac"?" main-download":""}`} id="mac-apple-silicon" href={macArm64}><AppleMark/><span><small>{system==="mac"?"RECOMMENDED FOR YOUR MAC":"MAC · RECOMMENDED FOR MOST"}</small><strong>Apple Silicon <b>v{version}</b></strong><em>M1, M2, M3, M4 or newer · arm64 ZIP</em></span><ArrowDown/></a>
    <a className="platform" id="mac-intel" href={macX64}><AppleMark/><span><small>MAC · OLDER MODELS</small><strong>Intel <b>v{version}</b></strong><em>Shows “Processor: Intel” · x64 ZIP</em></span><ArrowDown/></a>
    <a className="which-mac" href="/help#choose-mac">Not sure which Mac version? Check in 20 seconds →</a>
    <p><ShieldCheck/> Direct Cloudflare download · No account required</p>
  </div>
}
