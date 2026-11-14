import{r as o,j as x}from"./index-AM40Lm7G.js";import{u as P,a as $,b as I,_ as B,C as L,M as k,S as H,U,c as q,d as T,B as X,e as b}from"./Fbo-y04KHHBI.js";const D=t=>typeof t=="function",G=o.forwardRef(({envMap:t,resolution:e=256,frames:r=1/0,makeDefault:n,children:a,...s},u)=>{const c=P(({set:f})=>f),i=P(({camera:f})=>f),d=P(({size:f})=>f),l=o.useRef(null);o.useImperativeHandle(u,()=>l.current,[]);const m=o.useRef(null),y=$(e);o.useLayoutEffect(()=>{s.manual||(l.current.aspect=d.width/d.height)},[d,s]),o.useLayoutEffect(()=>{l.current.updateProjectionMatrix()});let v=0,g=null;const p=D(a);return I(f=>{p&&(r===1/0||v<r)&&(m.current.visible=!1,f.gl.setRenderTarget(y),g=f.scene.background,t&&(f.scene.background=t),f.gl.render(f.scene,l.current),f.scene.background=g,f.gl.setRenderTarget(null),m.current.visible=!0,v++)}),o.useLayoutEffect(()=>{if(n){const f=i;return c(()=>({camera:l.current})),()=>c(()=>({camera:f}))}},[l,n,c]),o.createElement(o.Fragment,null,o.createElement("perspectiveCamera",B({ref:l},s),!p&&a),o.createElement("group",{ref:m},p&&a(y.texture)))}),V=Math.PI/180;function Z(t){return t*V}function W(t,e){var y;const r=H.physical,{vertexShader:n,fragmentShader:a,uniforms:s}=r,u=r.defines??{},c=U.clone(s),i=new t(e.material||{});i.color&&(c.diffuse.value=i.color),"roughness"in i&&(c.roughness.value=i.roughness),"metalness"in i&&(c.metalness.value=i.metalness),"envMap"in i&&(c.envMap.value=i.envMap),"envMapIntensity"in i&&(c.envMapIntensity.value=i.envMapIntensity),Object.entries(e.uniforms??{}).forEach(([v,g])=>{c[v]=g!==null&&typeof g=="object"&&"value"in g?g:{value:g}});let d=`${e.header}
${e.vertexHeader??""}
${n}`,l=`${e.header}
${e.fragmentHeader??""}
${a}`;for(const[v,g]of Object.entries(e.vertex??{}))d=d.replace(v,`${v}
${g}`);for(const[v,g]of Object.entries(e.fragment??{}))l=l.replace(v,`${v}
${g}`);return new q({defines:{...u},uniforms:c,vertexShader:d,fragmentShader:l,lights:!0,fog:!!((y=e.material)!=null&&y.fog)})}function Y(){const[t,e]=o.useState(!1);return o.useEffect(()=>{const r=()=>e(document.hidden);return r(),document.addEventListener("visibilitychange",r),()=>document.removeEventListener("visibilitychange",r)},[]),t}const J=30,K=({children:t})=>{const e=Y(),r=o.useRef(null);return o.useEffect(()=>{if(e)return;let n,a=0;const s=u=>{var c;n=requestAnimationFrame(s),u-a>=1e3/J&&(a=u,(c=r.current)==null||c.invalidate())};return n=requestAnimationFrame(s),()=>cancelAnimationFrame(n)},[e]),x.jsx(T,{dpr:1,frameloop:e?"never":"demand",gl:{powerPreference:"high-performance",antialias:!1},className:"beams-container",onCreated:n=>{r.current=n,n.invalidate()},children:t})},Q=t=>{const e=t.replace("#",""),r=parseInt(e.substring(0,2),16),n=parseInt(e.substring(2,4),16),a=parseInt(e.substring(4,6),16);return[r/255,n/255,a/255]},ee=`
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`,ae=({beamWidth:t=2,beamHeight:e=15,beamNumber:r=12,lightColor:n="#ffffff",speed:a=2,noiseIntensity:s=1.75,scale:u=.2,rotation:c=0})=>{const i=o.useRef(null),d=o.useMemo(()=>W(k,{header:`
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${ee}`,vertexHeader:`
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }
  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }
  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,fragmentHeader:"",vertex:{"#include <begin_vertex>":"transformed.z += getPos(transformed.xyz);","#include <beginnormal_vertex>":"objectNormal = getNormal(position.xyz);"},fragment:{"#include <dithering_fragment>":`
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`},material:{fog:!0},uniforms:{diffuse:new L(...Q("#000000")),time:{shared:!0,mixed:!0,linked:!0,value:0},roughness:.3,metalness:.3,uSpeed:{shared:!0,mixed:!0,linked:!0,value:a},envMapIntensity:10,uNoiseIntensity:s,uScale:u}}),[a,s,u]);return x.jsxs(K,{children:[x.jsxs("group",{rotation:[0,0,Z(c)],children:[x.jsx(S,{ref:i,material:d,count:r,width:t,height:e}),x.jsx(ne,{color:n,position:[0,3,10]})]}),x.jsx("ambientLight",{intensity:1}),x.jsx("color",{attach:"background",args:["#000000"]}),x.jsx(G,{makeDefault:!0,position:[0,0,20],fov:30})]})};function te(t,e,r,n,a){const s=new X,u=t*(a+1)*2,c=t*a*2,i=new Float32Array(u*3),d=new Uint32Array(c*3),l=new Float32Array(u*2);let m=0,y=0,v=0;const p=-(t*e+(t-1)*n)/2;for(let f=0;f<t;f++){const h=p+f*(e+n),w=Math.random()*300,M=Math.random()*300;for(let z=0;z<=a;z++){const _=r*(z/a-.5),C=[h,_,0],F=[h+e,_,0];i.set([...C,...F],m*3);const j=z/a;if(l.set([w,j+M,w+1,j+M],v),z<a){const A=m,R=m+1,E=m+2,O=m+3;d.set([A,R,E,E,R,O],y),y+=6}m+=2,v+=4}}return s.setAttribute("position",new b(i,3)),s.setAttribute("uv",new b(l,2)),s.setIndex(new b(d,1)),s.computeVertexNormals(),s}const N=o.forwardRef(({material:t,width:e,count:r,height:n},a)=>{const s=o.useRef(null);o.useImperativeHandle(a,()=>s.current);const u=o.useMemo(()=>te(r,e,n,0,100),[r,e,n]);return I((c,i)=>{s.current.material.uniforms.time.value+=.1*i}),x.jsx("mesh",{ref:s,geometry:u,material:t})});N.displayName="MergedPlanes";const S=o.forwardRef((t,e)=>x.jsx(N,{ref:e,material:t.material,width:t.width,count:t.count,height:t.height}));S.displayName="PlaneNoise";const ne=({position:t,color:e})=>{const r=o.useRef(null);return o.useEffect(()=>{if(!r.current)return;const n=r.current.shadow.camera;n&&(n.top=24,n.bottom=-24,n.left=-24,n.right=24,n.far=64,r.current.shadow.bias=-.004)},[]),x.jsx("directionalLight",{ref:r,color:e,intensity:1,position:t})};export{ae as default};
