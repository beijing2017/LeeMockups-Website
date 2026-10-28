import { createGpuRenderer } from './gpu-backface.js';
import { createUvEditor } from './uv-editor-v3.mjs';
import { readMockupPackage } from './package-reader-v2.mjs';
import { ALL_FORMATS, BlobSource, BufferTarget, CanvasSource, Input, Mp4OutputFormat, Output, VideoSampleSink } from './vendor/mediabunny.min.mjs';

const $=id=>document.getElementById(id);
const canvas=$('canvas');
const videos=[$('black'),$('white'),$('base')];
const requestedSku=new URLSearchParams(location.search).get('sku');
if(requestedSku&&!/^LM-VM-[A-Z]{3}-\d{3}$/.test(requestedSku))location.replace('/mockups/');
const sampleId=requestedSku||'LM-VM-MUG-002';
const packageMode=true;
const assetRoot=sampleId==='v10'?'./assets':`./assets/${sampleId}`;
const sampleLabel={v10:'V10 Frame','mug-v1':'Mug v1','mug-v2':'Matte Black Coffee Mug','mug-v2-package':'Matte Black Coffee Mug','shirt-v3-f':'Shirt v3 F','mug-v1-enc':'Mug v1'}[sampleId];
$('sampleName').textContent=sampleLabel||sampleId;
$('cover').alt=`${sampleLabel} default preview`;
let hasRenderedFrame=false;
function showCover(src){
  const cover=$('cover');
  cover.onload=()=>{if(!hasRenderedFrame)cover.hidden=false;};
  cover.onerror=()=>{cover.hidden=true;};
  cover.src=src;
}
if(sampleId==='mug-v1-enc')showCover('https://downloads.leemockups.com/mockups/LM-VM-MUG-001/LM-VM-MUG-001-thumb.webp');
else if(!packageMode)showCover(`${assetRoot}/thumbnail.png`);
if(sampleId!=='mug-v1-enc'&&!packageMode)for(let i=0;i<videos.length;i++)videos[i].src=`${assetRoot}/${['black-layer.mp4','white-layer.mp4','base-layer.mp4'][i]}`;
let meshes,packageMeshForFrame,meshBuffer,trianglesPerFrame,manifest,artwork,draw,busy=false,previousUrl,userArtworkReady=false;
const resultVideo=$('resultVideo');
function hideResultVideo(clear=false){
  resultVideo.pause();
  resultVideo.hidden=true;
  if(clear){resultVideo.removeAttribute('src');resultVideo.load();}
}
let packageLayers,packageDefaultDisplay;
function setupArtworkRenderer(){
  draw=createGpuRenderer(canvas,artwork);
  draw.setCullBackfaces(manifest.templateId==='mug-v2');
  draw.setSeamFade(manifest.slot?.seamFadeWidth ?? (manifest.templateId==='mug-v2' ? .012 : 0));
}
let uvPreviewTimer;
const uvEditor=createUvEditor({
  canvas:$('uvCanvas'),hint:$('uvHint'),
  onChange:({centerU,centerV,scaleX,scaleY})=>{
    if(draw)draw.setDesignTransform(centerU,centerV,scaleX,scaleY);
    if(previousUrl)invalidateOutput();
    if(hasRenderedFrame&&!busy){
      clearTimeout(uvPreviewTimer);
      uvPreviewTimer=setTimeout(async()=>{
        if(busy||!draw||!artwork)return;
        try{await render(299);}catch(error){showError(`Preview failed: ${error.message}`);}
      },90);
    }
  }
});
let decryptionKey;
const decryptedAssets=new Map();
const packageObjectUrls=new Set();
function packageObjectUrl(data,type){
  const url=URL.createObjectURL(new Blob([data],{type}));
  packageObjectUrls.add(url);
  return url;
}
function releaseTemporaryResources(){
  clearTimeout(uvPreviewTimer);
  uvEditor.dispose();
  hideResultVideo(true);
  clearStills();
  if(previousUrl){URL.revokeObjectURL(previousUrl);previousUrl=undefined;}
  for(const video of videos){video.pause();video.removeAttribute('src');video.load();}
  $('cover').removeAttribute('src');
  for(const url of packageObjectUrls)URL.revokeObjectURL(url);
  packageObjectUrls.clear();
  decryptedAssets.clear();
  indexedChunkFrames=undefined;
  floatChunkBuffer=undefined;
  meshes=undefined;
  packageMeshForFrame=undefined;
  meshBuffer=undefined;
  packageLayers=undefined;
  packageDefaultDisplay=undefined;
  artwork=undefined;
  draw=undefined;
  decryptionKey=undefined;
}
window.addEventListener('pagehide',releaseTemporaryResources,{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
const stillFrameNumbers=[30,90,150,210,270];
let stillUrls=[];
function clearStills(showPlaceholders=true){
  for(const url of stillUrls)URL.revokeObjectURL(url);
  stillUrls=[];
  const grid=$('stillsGrid');
  grid.replaceChildren();
  $('stillZoom').hidden=true;
  $('stillZoomImage').removeAttribute('src');
  $('stillsCaption').textContent='Created after video generation';
  if(showPlaceholders)for(let position=0;position<5;position++){
    const card=document.createElement('div');card.className='still-placeholder';
    const logo=document.createElement('img');logo.src='/leemockups-symbol.png';logo.alt='';logo.setAttribute('aria-hidden','true');
    card.append(logo);grid.append(card);
  }
}
function invalidateOutput(){
  clearStills();
  hideResultVideo(true);
  const link=$('download');link.hidden=true;link.removeAttribute('href');
  if(previousUrl){URL.revokeObjectURL(previousUrl);previousUrl=undefined;}
  $('exportBtn').hidden=false;
  $('metrics').textContent='';
}
function showStills(stills){
  clearStills(false);
  $('stillsCaption').textContent='Full-resolution PNG images';
  for(const [position,still] of stills.entries()){
    const url=URL.createObjectURL(still.blob);stillUrls.push(url);
    const card=document.createElement('div');card.className='still-card';
    const image=document.createElement('img');image.src=url;image.alt=`Video still ${position+1}, frame ${still.frame}`;
    const link=document.createElement('a');link.href=url;link.download=`LeeMockups-${sampleId}-still-${position+1}.png`;
    link.className='still-download';link.textContent='↓';link.title='Download full-resolution PNG';
    link.setAttribute('aria-label',`Download still ${position+1}`);
    const showZoom=()=>{$('stillZoomImage').src=url;$('stillZoom').hidden=false;};
    const hideZoom=()=>{$('stillZoom').hidden=true;};
    card.addEventListener('mouseenter',showZoom);
    card.addEventListener('mouseleave',hideZoom);
    link.addEventListener('focus',showZoom);
    link.addEventListener('blur',hideZoom);
    image.addEventListener('click',()=>{$('stillZoom').hidden?showZoom():hideZoom();});
    card.append(image,link);$('stillsGrid').append(card);
  }
}
const captureStill=()=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not save a still image.')),'image/png'));
let indexedChunkIndex=-1,indexedChunkFrames;
let floatChunkIndex=-1,floatChunkBuffer;
function status(message, progress = null, detail = '') {
  const overlay = $('progressOverlay');
  overlay.hidden = false;
  overlay.classList.toggle('has-preview', hasRenderedFrame);
  overlay.classList.remove('is-error');
  $('progressTrack').hidden = false;
  if ($('status').textContent !== message) $('status').textContent = message;
  $('progressDetail').textContent = detail;
  const known = Number.isFinite(progress);
  $('progressPercent').textContent = known ? `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` : '';
  $('progressTrack').classList.toggle('indeterminate', !known);
  if (known) $('progressTrack').setAttribute('aria-valuenow', String(Math.round(Math.max(0, Math.min(1, progress)) * 100)));
  else $('progressTrack').removeAttribute('aria-valuenow');
  $('meterFill').style.width = known ? `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` : '';
}
function hideStatus() { $('progressOverlay').hidden = true; }
function showError(message) {
  status(message);
  $('progressOverlay').classList.add('is-error');
  $('progressTrack').hidden = true;
}
const megabytes = bytes => (bytes / 1024 / 1024).toFixed(1);
async function downloadFreePackage(response) {
  if (!response.body) throw new Error('This browser cannot stream the mockup download.');
  const rawLength = Number(response.headers.get('Content-Length'));
  const total = Number.isSafeInteger(rawLength) && rawLength > 0 ? rawLength : null;
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  const started = performance.now();
  const update = () => {
    const seconds = Math.floor((performance.now() - started) / 1000);
    status('Downloading your free mockup…',
      total ? Math.min(1, received / total) : null,
      total ? `${megabytes(received)} / ${megabytes(total)} MB · ${seconds}s elapsed`
        : `${megabytes(received)} MB received · ${seconds}s elapsed`);
  };
  update();
  const ticker = setInterval(update, 1000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (received > 250 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('The mockup package is too large for this browser.');
      }
      update();
    }
  } finally {
    clearInterval(ticker);
    reader.releaseLock();
  }
  if (total && received !== total) throw new Error('The mockup download was incomplete. Please refresh and try again.');
  update();
  return new Blob(chunks, { type: 'application/octet-stream' });
}
const wait=(target,event)=>new Promise((resolve,reject)=>{target.addEventListener(event,resolve,{once:true});target.addEventListener('error',()=>reject(new Error(`${event} failed`)),{once:true});});
async function loadDecryptionKey(){
  const productUrl='https://www.leemockups.com/mockup/?sku=LM-VM-MUG-001';
  const returnToPurchase=()=>location.replace(productUrl);
  const fragment=new URLSearchParams(location.hash.slice(1));
  let encoded=fragment.get('key');
  const ticket=fragment.get('ticket');
  if(ticket){
    history.replaceState(null,'',location.pathname+location.search);
    status('Verifying your purchase…');
    try{
      const response=await fetch('https://downloads.leemockups.com/commerce/render-key',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({mockup:sampleId,ticket}),
        cache:'no-store',
      });
      const result=await response.json();
      if(response.status===401||response.status===403){returnToPurchase();throw new Error('The access ticket has expired or is invalid.');}
      if(!response.ok||!result.ok||result.mockup!==sampleId)throw new Error(result.error||'Access could not be verified.');
      encoded=result.key;
    }catch(error){
      $('purchaseReturn').hidden=false;
      throw new Error(`Access expired or could not be verified. Your purchase is still valid. Return to your purchased mockup and choose Create video again. (${error.message})`);
    }
  }
  if(!encoded){returnToPurchase();throw new Error('Open this mockup from your purchased product page.');}
  const base64=encoded.replace(/-/g,'+').replace(/_/g,'/');
  const raw=Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length/4)*4,'=')),character=>character.charCodeAt(0));
  if(raw.length!==32||!crypto.subtle)throw new Error('The test key is invalid or this browser cannot decrypt the assets.');
  return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
}
async function fetchAsset(name){
  if(decryptedAssets.has(name))return decryptedAssets.get(name);
  const sealed=manifest.browserEncryption?.files.includes(name);
  const response=await fetch(`${assetRoot}/${name}${sealed?'.enc':''}`);
  if(!response.ok)throw new Error(`Could not load ${name}.`);
  const bytes=await response.arrayBuffer();
  if(!sealed)return bytes;
  const data=new Uint8Array(bytes);
  if(data.length<34||new TextDecoder().decode(data.subarray(0,6))!=='LMENC1')throw new Error(`${name} has an invalid encrypted format.`);
  let plain;
  try{
    plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:data.subarray(6,18),additionalData:new TextEncoder().encode(name)},decryptionKey,data.subarray(18));
  }catch{throw new Error(`Could not decrypt ${name}. Check the private test link.`);}
  decryptedAssets.set(name,plain);
  return plain;
}
async function seek(video,seconds){if(Math.abs(video.currentTime-seconds)<.01&&video.readyState>=2)return;const ready=wait(video,'seeked');video.currentTime=seconds;await ready;}
async function loadIndexedFrame(index){
  const {chunkFrames}=manifest.browserMesh;
  const chunkIndex=Math.floor(index/chunkFrames);
  if(indexedChunkIndex!==chunkIndex){
    const response=await fetch(`${assetRoot}/mesh-${String(chunkIndex).padStart(2,'0')}.bin.gz`);
    if(!response.ok||!response.body)throw new Error(`Could not load mesh segment ${chunkIndex+1}.`);
    const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const view=new DataView(buffer);
    const frames=[];
    let offset=0;
    for(let frame=0;frame<chunkFrames;frame++){
      if(offset+48>buffer.byteLength)throw new Error('Mockup mesh data is incomplete.');
      const vertices=view.getUint32(offset,true),triangles=view.getUint32(offset+4,true);
      const min=[],span=[];
      for(let field=0;field<5;field++){
        min[field]=view.getFloat32(offset+8+field*8,true);
        span[field]=view.getFloat32(offset+12+field*8,true)-min[field];
      }
      offset+=48;
      if(!vertices||!triangles||offset+vertices*10+triangles*6>buffer.byteLength)
        throw new Error('Mockup mesh data has an invalid length.');
      const packed=new Uint16Array(buffer,offset,vertices*5);offset+=vertices*10;
      const positions=new Float32Array(vertices*5);
      for(let vertex=0;vertex<vertices;vertex++)for(let field=0;field<5;field++)
        positions[vertex*5+field]=min[field]+span[field]*packed[vertex*5+field]/65535;
      const indices=new Uint16Array(buffer,offset,triangles*3);offset+=triangles*6;
      frames.push({vertices:positions,indices});
    }
    if(offset!==buffer.byteLength)throw new Error('Mockup mesh data has extra bytes.');
    indexedChunkFrames=frames;
    indexedChunkIndex=chunkIndex;
  }
  return indexedChunkFrames[index%chunkFrames];
}
async function loadFloatChunkFrame(index){
  const {chunkFrames}=manifest.browserMesh;
  const chunkIndex=Math.floor(index/chunkFrames);
  if(floatChunkIndex!==chunkIndex){
    const response=await fetch(`${assetRoot}/mesh-${String(chunkIndex).padStart(2,'0')}.bin.gz`);
    if(!response.ok||!response.body)throw new Error(`Could not load mesh segment ${chunkIndex+1}.`);
    const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    if(buffer.byteLength!==chunkFrames*trianglesPerFrame*3*5*4)throw new Error('Mockup mesh data has an invalid length.');
    floatChunkBuffer=buffer;
    floatChunkIndex=chunkIndex;
  }
  return new Float32Array(floatChunkBuffer,(index%chunkFrames)*trianglesPerFrame*3*5*4,trianglesPerFrame*3*5);
}
async function meshForFrame(index){
  return manifest.browserMesh?.encoding==='gzip-indexed-u16-chunks'
    ? await loadIndexedFrame(index)
    : manifest.browserMesh?.encoding==='gzip-f32-chunks'
      ? await loadFloatChunkFrame(index)
      : meshBuffer
        ? new Float32Array(meshBuffer,index*trianglesPerFrame*3*5*4,trianglesPerFrame*3*5)
        : packageMode ? packageMeshForFrame(index) : meshes[index];
}
async function render(index,sources=videos){
  draw(await meshForFrame(index),sources);hasRenderedFrame=true;$('cover').hidden=true;
}

async function preview(){
  if(!artwork||!manifest||busy)return;
  busy=true;$('exportBtn').disabled=true;
  try{status('Rendering a full-resolution preview…');await Promise.all(videos.map(v=>seek(v,9.85)));await render(299);hideStatus();}
  catch(error){showError(`Preview failed: ${error.message}`);}
  finally{busy=false;$('exportBtn').disabled=!userArtworkReady;}
}

$('file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  if(!manifest){status('Please wait for the mockup to load before choosing an image.');return;}
  invalidateOutput();
  $('exportBtn').disabled=true;
  $('filename').textContent=file.name;
  try{
    const bitmap=await createImageBitmap(file);
    const c=document.createElement('canvas');c.width=manifest.slot.recommendedWidth;c.height=manifest.slot.recommendedHeight;
    const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';
    const fit=Math.min(c.width/bitmap.width,c.height/bitmap.height);
    const width=bitmap.width*fit,height=bitmap.height*fit;
    ctx.drawImage(bitmap,(c.width-width)/2,(c.height-height)/2,width,height);
    artwork=ctx.getImageData(0,0,c.width,c.height);c.width=c.height=1;
    setupArtworkRenderer();
    userArtworkReady=true;
    uvEditor.setArtwork(bitmap);
    await preview();
  }catch(error){$('exportBtn').disabled=!userArtworkReady;showError(`Could not read the image: ${error.message}`);}
});

async function openLayers(){
  const paths=['black-layer.mp4','white-layer.mp4','base-layer.mp4'];
  const inputs=[];
  try{
    for(let i=0;i<paths.length;i++){
      status('Creating your video…',0);
      const source=packageMode?packageLayers[i]:manifest.browserEncryption
        ? new Blob([await fetchAsset(paths[i])],{type:'video/mp4'})
        : await (async()=>{const response=await fetch(`${assetRoot}/${paths[i]}`);if(!response.ok)throw new Error(`Could not load ${paths[i]}.`);return response.blob();})();
      const input=new Input({source:new BlobSource(source),formats:ALL_FORMATS});
      inputs.push(input);
    }
    const tracks=await Promise.all(inputs.map(input=>input.getPrimaryVideoTrack()));
    if(tracks.some(track=>!track))throw new Error('A mockup video layer has no video track.');
    return {inputs,sinks:tracks.map(track=>new VideoSampleSink(track,{hardwareAcceleration:'prefer-software'}))};
  }catch(error){inputs.forEach(input=>input.dispose());throw error;}
}

$('exportBtn').addEventListener('click',async()=>{
  if(!draw||busy||!userArtworkReady)return;
  if(!window.VideoEncoder||!window.VideoDecoder){showError('This browser cannot encode the video. Please use a recent version of Chrome or Edge.');return;}
  busy=true;$('exportBtn').disabled=true;
  clearTimeout(uvPreviewTimer);uvEditor.setLocked(true);$('file').disabled=true;
  invalidateOutput();
  $('progressOverlay').classList.add('is-exporting');
  status('Creating your video…',0);
  let layerData,output;
  try{
    layerData=await openLayers();
    output=new Output({format:new Mp4OutputFormat(),target:new BufferTarget()});
    const videoSource=new CanvasSource(canvas,{codec:'avc',bitrate:12_000_000});
    output.addVideoTrack(videoSource,{frameRate:30});
    await output.start();
    const started=performance.now();
    const stills=[];
    for(let index=0;index<300;index++){
      const timestamp=(index+.1)/30;
      const samples=await Promise.all(layerData.sinks.map(sink=>sink.getSample(timestamp)));
      try{
        if(samples.some(sample=>!sample))throw new Error(`Could not decode frame ${index+1}.`);
        await render(index,samples);
        if(stillFrameNumbers.includes(index+1))stills.push({frame:index+1,blob:await captureStill()});
        await videoSource.add(index/30,1/30,{keyFrame:index%30===0});
      }finally{samples.forEach(sample=>sample?.close());}
      if(index%5===0||index===299){
        status('Creating your video…',((index+1)/300)*.95);
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    status('Creating your video…',.95);
    await output.finalize();
    const data=output.target.buffer;
    if(!data?.byteLength)throw new Error('The video encoder produced no data.');
    const blob=new Blob([data],{type:'video/mp4'});
    previousUrl=URL.createObjectURL(blob);
    const link=$('download');link.href=previousUrl;link.download=`LeeMockups-${sampleId}.mp4`;link.hidden=false;
    $('exportBtn').hidden=true;
    resultVideo.src=previousUrl;resultVideo.hidden=false;
    resultVideo.play().catch(()=>{});
    showStills(stills);
    status('Your video is ready',1);
    $('metrics').textContent=`Created in ${Math.round((performance.now()-started)/1000)} seconds. Video length: 10 seconds.`;
    hideStatus();
  }catch(error){showError(`Video generation failed: ${error.message}`);}
  finally{$('progressOverlay').classList.remove('is-exporting');layerData?.inputs.forEach(input=>input.dispose());busy=false;$('exportBtn').disabled=!userArtworkReady;uvEditor.setLocked(false);$('file').disabled=false;}
});

try{
  if(packageMode){
    const connectionStarted=performance.now();
    const showConnection=()=>status('Connecting to your free mockup…', null,
      `Waiting for the download to start · ${Math.floor((performance.now()-connectionStarted)/1000)}s elapsed`);
    showConnection();
    const connectionTicker=setInterval(showConnection,1000);
    let response;
    try{response=await fetch(`https://downloads.leemockups.com/browser/free/${encodeURIComponent(sampleId)}`,{cache:'no-store'});}
    finally{clearInterval(connectionTicker);}
    if(!response.ok)throw new Error(`Could not download the free mockup (${response.status}).`);
    const packageBlob=await downloadFreePackage(response);
    const unpacked=await readMockupPackage(packageBlob,(message,progress)=>{
      if(message==='Preparing browser frames…')status(message,Math.max(0,Math.min(1,(progress-.08)/.72)));
      else status(message);
    });
    manifest=unpacked.manifest;
    meshes=unpacked.meshes;
    packageMeshForFrame=unpacked.getMesh;
    packageLayers=unpacked.layers;
    packageDefaultDisplay=unpacked.defaultDisplay;
    $('sampleName').textContent=manifest.name||sampleId;
    $('cover').alt=`${manifest.name||sampleId} default preview`;
    showCover(packageObjectUrl(unpacked.thumbnail,'image/png'));
    for(let i=0;i<videos.length;i++)videos[i].src=packageObjectUrl(packageLayers[i],'video/mp4');
  }else{
  const metadata=await fetch(`${assetRoot}/manifest.json`);
  if(!metadata.ok)throw new Error('Could not load the mockup details.');
  manifest=await metadata.json();
  }
  if(manifest.frameEnd-manifest.frameStart+1!==300||manifest.fps!==30
      ||manifest.output.width!==2000||manifest.output.height!==2000)throw new Error('This mockup has an unsupported format.');
  $('outputSize').textContent=`${manifest.output.width} × ${manifest.output.height} px`;
  $('recommendedSize').textContent=`Recommended: ${manifest.slot.recommendedWidth} × ${manifest.slot.recommendedHeight} px`;
  if(!packageMode&&manifest.browserEncryption){
    if(manifest.browserEncryption.algorithm!=='AES-256-GCM'||manifest.browserEncryption.format!=='LMENC1')throw new Error('This encrypted mockup format is not supported.');
    decryptionKey=await loadDecryptionKey();
    status('Loading and decrypting your mockup…');
    const names=['thumbnail.png','black-layer.mp4','white-layer.mp4','base-layer.mp4'];
    const decoded=await Promise.all(names.map(fetchAsset));
    showCover(packageObjectUrl(decoded[0],'image/png'));
    for(let i=0;i<videos.length;i++)videos[i].src=packageObjectUrl(decoded[i+1],'video/mp4');
  }
  if(packageMode){
    if(meshes.length!==300||typeof packageMeshForFrame!=='function')throw new Error('The package mesh is incomplete.');
  }else if(manifest.browserMesh?.encoding==='gzip-indexed-u16-chunks'){
    if(manifest.browserMesh.chunkFrames!==30||manifest.browserMesh.chunks!==10
        ||typeof DecompressionStream!=='function')throw new Error('This browser cannot decode the fabric mesh.');
  }else if(manifest.browserMesh?.encoding==='gzip-f32-chunks'){
    if(manifest.browserMesh.chunkFrames!==30||manifest.browserMesh.chunks!==10
        ||typeof DecompressionStream!=='function')throw new Error('This browser cannot decode the mockup mesh.');
    trianglesPerFrame=manifest.browserMesh.trianglesPerFrame;
  }else if(manifest.browserMesh){
    trianglesPerFrame=manifest.browserMesh.trianglesPerFrame;
    meshBuffer=manifest.browserEncryption?await fetchAsset('meshes.bin')
      :await (async()=>{const response=await fetch(`${assetRoot}/meshes.bin`);if(!response.ok)throw new Error('Could not load the mockup mesh.');return response.arrayBuffer();})();
    if(meshBuffer.byteLength!==300*trianglesPerFrame*3*5*4)throw new Error('Mockup mesh data has an invalid length.');
  }else{
    const response=await fetch(`${assetRoot}/meshes.json`);if(!response.ok)throw new Error('Could not load the mockup mesh.');
    meshes=await response.json();if(meshes.length!==300)throw new Error('The mockup has an invalid frame count.');
  }
  decryptedAssets.clear();
  status('Initializing your mockup preview…');
  uvEditor.setSlot(manifest.slot.recommendedWidth,manifest.slot.recommendedHeight);
  uvEditor.setMesh(await meshForFrame(299));
  await Promise.all(videos.map(v=>v.readyState>=1?null:wait(v,'loadedmetadata')));
  if(packageMode){
    const bitmap=await createImageBitmap(packageDefaultDisplay);
    const design=document.createElement('canvas');
    design.width=manifest.slot.recommendedWidth;design.height=manifest.slot.recommendedHeight;
    const context=design.getContext('2d');context.imageSmoothingQuality='high';
    context.drawImage(bitmap,0,0,design.width,design.height);
    artwork=context.getImageData(0,0,design.width,design.height);
    bitmap.close();design.width=design.height=1;
    packageDefaultDisplay=undefined;
    setupArtworkRenderer();
    await preview();
    $('exportBtn').disabled=true;
    hideStatus();
  }else hideStatus();
}catch(error){
  showError(`Could not load this mockup: ${error.message}`);
}
