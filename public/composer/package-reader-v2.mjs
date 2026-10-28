const encoder = new TextEncoder();
const decoder = new TextDecoder();
const magic = encoder.encode('LMOFFLINE1');
const seed = Uint8Array.from('9146ab07d3e91258fceb60411df97042a8573cb9e02d65f71498a3be602fcd85'.match(/../g), value => parseInt(value, 16));
const wantedFiles = new Set(['manifest.json', 'thumbnail.png', 'default-display.png', 'black-layer.mp4', 'white-layer.mp4', 'base-layer.mp4']);

async function decryptPackage(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 54 || !magic.every((value, index) => bytes[index] === value)) {
    throw new Error('This is not a supported LeeMockups package.');
  }
  const material = await crypto.subtle.importKey('raw', seed, 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({
    name: 'HKDF', hash: 'SHA-256', salt: bytes.subarray(10, 26),
    info: encoder.encode('LeeMockups offline v1'),
  }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const ciphertext = new Uint8Array(bytes.length - 54 + 16);
  ciphertext.set(bytes.subarray(54));
  ciphertext.set(bytes.subarray(38, 54), bytes.length - 54);
  try {
    return new Uint8Array(await crypto.subtle.decrypt({
      name: 'AES-GCM', iv: bytes.subarray(26, 38), additionalData: magic,
    }, key, ciphertext));
  } catch {
    throw new Error('The mockup package could not be decrypted.');
  }
}

function unshuffleDoubles(bytes) {
  if (bytes.length % 8) throw new Error('Invalid indexed mesh coordinate data.');
  const count=bytes.length/8;
  const unshuffled=new Uint8Array(bytes.length);
  for(let part=0;part<8;part++)for(let index=0;index<count;index++)
    unshuffled[index*8+part]=bytes[part*count+index];
  const view=new DataView(unshuffled.buffer);
  const values=new Float64Array(count);
  for(let index=0;index<count;index++){
    values[index]=view.getFloat64(index*8,true);
    if(!Number.isFinite(values[index]))throw new Error('Invalid indexed mesh coordinate.');
  }
  return values;
}

function convertMesh(data, frame, topologies) {
  const mesh=typeof data==='object'&&!(data instanceof Uint8Array)?data:JSON.parse(decoder.decode(data));
  if(mesh.frame!==frame)throw new Error(`Invalid mesh for frame ${frame}.`);
  if(mesh.meshEncoding==='indexed-f64-v1'){
    const n=mesh.vertexCount,t=mesh.triangleCount;
    if(!Number.isSafeInteger(n)||!Number.isSafeInteger(t)||n<1||t<1||n>100000||t>100000||
       !/^topology-[a-f0-9]{64}\.lmgeom$/.test(mesh.topology))throw new Error('Invalid indexed mesh.');
    const topology=topologies.get(mesh.topology);
    if(!topology||topology.length!==n*16+t*13)throw new Error('Indexed mesh topology is missing.');
    const packed=Uint8Array.from(atob(mesh.positions),char=>char.charCodeAt(0));
    if(packed.length!==n*24)throw new Error('Indexed mesh positions are incomplete.');
    const positions=unshuffleDoubles(packed),uv=unshuffleDoubles(topology.subarray(0,n*16));
    const indices=new DataView(topology.buffer,topology.byteOffset+n*16,t*12);
    const vertices=new Float32Array(t*15);
    for(let triangle=0;triangle<t;triangle++){
      if(topology[n*16+t*12+triangle]!==0)throw new Error('Unsupported reflected mesh.');
      for(let corner=0;corner<3;corner++){
        const index=indices.getUint32((triangle*3+corner)*4,true);
        if(index>=n)throw new Error('Indexed mesh vertex is out of bounds.');
        const offset=(triangle*3+corner)*5;
        vertices[offset]=positions[index*3]*2-1;
        vertices[offset+1]=1-positions[index*3+1]*2;
        vertices[offset+2]=positions[index*3+2];
        vertices[offset+3]=uv[index*2];
        vertices[offset+4]=uv[index*2+1];
      }
    }
    return vertices;
  }
  if(mesh.meshEncoding||!Array.isArray(mesh.triangles)||mesh.triangles.length>100000)
    throw new Error(`Unsupported mesh for frame ${frame}.`);
  const vertices=new Float32Array(mesh.triangles.length*15);
  let offset=0;
  for(const triangle of mesh.triangles){
    if(triangle.reflection||triangle.vertices?.length!==3)throw new Error(`Unsupported mesh for frame ${frame}.`);
    for(const vertex of triangle.vertices){
      const values=[vertex.x*2-1,1-vertex.y*2,vertex.depth,vertex.u,vertex.v];
      if(values.some(value=>!Number.isFinite(value)))throw new Error(`Invalid vertex in frame ${frame}.`);
      vertices.set(values,offset);offset+=5;
    }
  }
  return vertices;
}

export async function readMockupPackage(blob, onProgress = () => {}) {
  if (!globalThis.fflate?.Unzip || !globalThis.crypto?.subtle) {
    throw new Error('This browser cannot open the mockup package.');
  }
  if (blob.size > 250 * 1024 * 1024) throw new Error('The mockup package is too large for this browser test.');
  onProgress('Decrypting the mockup package…', 0.02);
  const zip = await decryptPackage(blob);
  const files = new Map();
  const meshFiles = new Map();
  const topologies = new Map();
  let extractedBytes = 0;
  let count = 0;
  const unzip = new fflate.Unzip(file => {
    count += 1;
    if (count > 500) throw new Error('The mockup package has too many files.');
    const match = /^mesh\/mesh_(\d{4})\.json$/.exec(file.name);
    const topologyMatch = /^mesh\/(topology-[a-f0-9]{64}\.lmgeom)$/.exec(file.name);
    if (!wantedFiles.has(file.name) && !match && !topologyMatch) return;
    const chunks = [];
    let length = 0;
    file.ondata = (error, chunk, final) => {
      if (error) throw error;
      length += chunk.length;
      extractedBytes += chunk.length;
      if (extractedBytes > 400 * 1024 * 1024 || length > 30 * 1024 * 1024) {
        throw new Error('The mockup package exceeds the browser test limit.');
      }
      chunks.push(chunk);
      if (!final) return;
      const data = new Uint8Array(length);
      let cursor = 0;
      for (const part of chunks) { data.set(part, cursor); cursor += part.length; }
      if (match) {
        const frame=Number(match[1]);
        if(frame<1||frame>10000||meshFiles.has(frame))throw new Error('Invalid mesh frame.');
        meshFiles.set(frame,data);
      } else if(topologyMatch){
        if(topologies.has(topologyMatch[1]))throw new Error('Duplicate mesh topology.');
        topologies.set(topologyMatch[1],data);
      } else {
        if (files.has(file.name)) throw new Error('Duplicate mockup file.');
        files.set(file.name, data);
      }
    };
    file.start();
  });
  unzip.register(fflate.UnzipInflate);
  const chunkSize = 1024 * 1024;
  for (let offset = 0; offset < zip.length; offset += chunkSize) {
    const end = Math.min(zip.length, offset + chunkSize);
    unzip.push(zip.subarray(offset, end), end === zip.length);
    if (offset % (8 * chunkSize) === 0) {
      onProgress('Preparing browser frames…', 0.08 + end / zip.length * 0.72);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  if (files.size !== wantedFiles.size || meshFiles.size !== 300) {
    throw new Error('The mockup package is incomplete.');
  }
  const manifest = JSON.parse(decoder.decode(files.get('manifest.json')));
  if (!manifest.templateId || !Number.isSafeInteger(manifest.frameStart) ||
      manifest.frameEnd-manifest.frameStart+1 !== 300 || manifest.fps !== 30 ||
      manifest.output?.width !== 2000 || manifest.output?.height !== 2000 ||
      !manifest.slot?.recommendedWidth || !manifest.slot?.recommendedHeight) {
    throw new Error('This free mockup has an unsupported format.');
  }
  const meshes=Array.from({length:300},(_,index)=>meshFiles.get(manifest.frameStart+index));
  if(meshes.some(mesh=>!mesh))throw new Error('The mockup package is missing mesh frames.');
  const getMesh=index=>{
    if(!Number.isInteger(index)||index<0||index>=300)throw new Error('Invalid frame number.');
    return convertMesh(meshes[index],manifest.frameStart+index,topologies);
  };
  const result = {
    manifest,
    meshes,
    getMesh,
    thumbnail: new Blob([files.get('thumbnail.png')], { type: 'image/png' }),
    defaultDisplay: new Blob([files.get('default-display.png')], { type: 'image/png' }),
    layers: ['black-layer.mp4', 'white-layer.mp4', 'base-layer.mp4'].map(name => new Blob([files.get(name)], { type: 'video/mp4' })),
  };
  files.clear();
  onProgress('Mockup package ready.', 0.85);
  return result;
}
