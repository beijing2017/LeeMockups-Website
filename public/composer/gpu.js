const vertexBase = `#version 300 es
layout(location=0) in vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}`;
const fragmentBase = `#version 300 es
precision highp float;
uniform sampler2D baseLayer; uniform vec2 resolution;
out vec4 outputColor;
void main(){outputColor=texture(baseLayer,gl_FragCoord.xy/resolution);}`;
const vertexArt = `#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in float depth;
layout(location=2) in vec2 uv;
uniform float nearDepth;
out vec2 designUv;
void main(){gl_Position=vec4(position*depth,depth-2.*nearDepth,depth);designUv=uv;}`;
const fragmentArt = `#version 300 es
precision highp float;
uniform sampler2D baseLayer,blackLayer,whiteLayer,design;
uniform vec2 resolution, designCenter;
uniform float designScale;
in vec2 designUv;
out vec4 outputColor;
vec3 lin(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 srgb(vec3 c){c=clamp(c,0.,1.);return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
void main(){
  vec2 at=gl_FragCoord.xy/resolution;
  vec3 base=lin(texture(baseLayer,at).rgb);
  vec3 black=lin(texture(blackLayer,at).rgb);
  vec3 white=lin(texture(whiteLayer,at).rgb);
  vec2 artUv=(designUv-designCenter)/designScale+vec2(.5);
  vec4 art=texture(design,clamp(artUv,0.,1.));
  if(any(lessThan(artUv,vec2(0.)))||any(greaterThan(artUv,vec2(1.)))) art.a=0.;
  vec3 replacement=black+lin(art.rgb)*(white-black);
  outputColor=vec4(srgb(mix(base,replacement,art.a)),1.);
}`;

function shader(gl, type, source) {
  const value=gl.createShader(type); gl.shaderSource(value,source); gl.compileShader(value);
  if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
  return value;
}
function program(gl, vertex, fragment) {
  const value=gl.createProgram();
  gl.attachShader(value,shader(gl,gl.VERTEX_SHADER,vertex));
  gl.attachShader(value,shader(gl,gl.FRAGMENT_SHADER,fragment));
  gl.linkProgram(value);
  if(!gl.getProgramParameter(value,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(value));
  return value;
}
function texture(gl, source, unit) {
  const value=gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,value);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(source) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
  return value;
}
export function createGpuRenderer(canvas,artwork) {
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:true});
  if(!gl) throw new Error('This browser does not support WebGL 2 rendering.');
  const w=canvas.width,h=canvas.height;
  const layers=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
  const artCanvas=document.createElement('canvas');artCanvas.width=artwork.width;artCanvas.height=artwork.height;
  artCanvas.getContext('2d').putImageData(artwork,0,0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  const textures=[texture(gl,null,0),texture(gl,null,1),texture(gl,null,2),texture(gl,artCanvas,3)];
  artCanvas.width=artCanvas.height=1;
  const baseProgram=program(gl,vertexBase,fragmentBase);
  const artProgram=program(gl,vertexArt,fragmentArt);
  const nearDepthLocation=gl.getUniformLocation(artProgram,'nearDepth');
  const designCenterLocation=gl.getUniformLocation(artProgram,'designCenter');
  const designScaleLocation=gl.getUniformLocation(artProgram,'designScale');
  for(const p of [baseProgram,artProgram]){
    gl.useProgram(p);
    for(const [name,unit] of [['blackLayer',0],['whiteLayer',1],['baseLayer',2],['design',3]]){
      const loc=gl.getUniformLocation(p,name);if(loc!==null)gl.uniform1i(loc,unit);
    }
    gl.uniform2f(gl.getUniformLocation(p,'resolution'),w,h);
  }
  const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const meshBuffer=gl.createBuffer();
  const meshIndices=gl.createBuffer();
  const renderFrame = (triangles,sources) => {
    gl.viewport(0,0,w,h);
    for(let i=0;i<sources.length;i++){
      const c=layers[i],ctx=c.getContext('2d');
      ctx.clearRect(0,0,w,h);
      if(typeof sources[i].draw==='function')sources[i].draw(ctx,0,0,w,h);
      else ctx.drawImage(sources[i],0,0,w,h);
      gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    }
    gl.useProgram(baseProgram);gl.bindBuffer(gl.ARRAY_BUFFER,quad);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.drawArrays(gl.TRIANGLES,0,6);
    // The base video is a backdrop. Only the projected artwork triangles
    // compete for depth, as in the desktop compositor's per-pixel z-buffer.
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    let data,indices;
    if(triangles?.vertices instanceof Float32Array&&(triangles.indices instanceof Uint32Array||triangles.indices instanceof Uint16Array)){
      data=triangles.vertices;indices=triangles.indices;
    }else if(triangles instanceof Float32Array)data=triangles;
    else{
      const values=[];
      for(const vertices of triangles)for(const v of vertices)values.push(v.x*2-1,1-v.y*2,v.depth,v.u,v.v);
      data=new Float32Array(values);
    }
    gl.useProgram(artProgram);gl.bindBuffer(gl.ARRAY_BUFFER,meshBuffer);
    let nearest=Infinity;
    for(let i=2;i<data.length;i+=5)if(data[i]>0 && data[i]<nearest)nearest=data[i];
    gl.uniform1f(nearDepthLocation,Number.isFinite(nearest)?nearest*.5:.01);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STREAM_DRAW);
    gl.vertexAttribPointer(0,2,gl.FLOAT,false,20,0);
    gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,1,gl.FLOAT,false,20,8);
    gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,2,gl.FLOAT,false,20,12);
    if(indices){
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,meshIndices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STREAM_DRAW);
      gl.drawElements(gl.TRIANGLES,indices.length,indices instanceof Uint16Array?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT,0);
    }else gl.drawArrays(gl.TRIANGLES,0,data.length/5);
    gl.disable(gl.DEPTH_TEST);
    gl.flush();
  };
  renderFrame.setDesignTransform=(centerU=.5,centerV=.5,scale=1)=>{
    gl.useProgram(artProgram);
    gl.uniform2f(designCenterLocation,centerU,centerV);
    gl.uniform1f(designScaleLocation,scale);
  };
  renderFrame.setDesignTransform();
  return renderFrame;
}
