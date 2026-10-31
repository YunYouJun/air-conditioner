(function(){let e={cold:`❄️`,hot:`☀️`},t={beep:`di`,start:`ac-work`,work:`air-extractor-fan`},n={min:16,max:31,step:1},r={mode:`cold`,status:!1,temperature:26,temperatures:{cold:26,hot:26},sound:`normal`,swing:!1,fan:`auto`},i=[`normal`,`sleep`,`mute`],a={cold:`制冷`,hot:`制热`},o={normal:`标准`,sleep:`睡眠`,mute:`静音`},s={normal:1,sleep:.3,mute:0},c=[`auto`,`low`,`medium`,`high`],l={auto:`自动`,low:`低风`,medium:`中风`,high:`高风`},u={low:.45,medium:.7,high:1};function d(e){return c.includes(e)}function f(e){let t=Math.max(c.indexOf(e),0);return c[(t+1)%c.length]}function p(e){return i.includes(e)}function m(e){let t=Math.max(i.indexOf(e),0);return i[(t+1)%i.length]}let h={startDelayMs:8e3,loopCrossfadeMs:1500,stopFadeMs:600,settleAfterMs:9e4,settleRampMs:2e4,settleLevel:.5,surgeLevel:.85,quietDurationMs:[18e4,36e4],surgeDurationMs:[6e4,12e4],surgeRampMs:1e4};function g(e=`/assets/audio`,n=`m4a`){let r=e.replace(/\/$/,``);return{beep:`${r}/${t.beep}.${n}`,start:`${r}/${t.start}.${n}`,work:`${r}/${t.work}.${n}`}}function ee(e){return e?.currentSrc||e?.src||``}async function te(e){let t=await fetch(e);if(!t.ok)throw Error(`Failed to load ${e}: ${t.status}`);return t.arrayBuffer()}function ne(){let e=globalThis,t=e.AudioContext??e.webkitAudioContext;if(!t)return null;try{return new t({latencyHint:`interactive`})}catch{return new t}}function re(e,t){let n=e.currentTime,r=e.createOscillator(),i=e.createGain();r.type=`sine`,r.frequency.setValueAtTime(1500,n),r.frequency.exponentialRampToValueAtTime(520,n+.07),i.gain.setValueAtTime(1e-4,n),i.gain.exponentialRampToValueAtTime(.12,n+.004),i.gain.exponentialRampToValueAtTime(1e-4,n+.16),r.connect(i),i.connect(t),r.start(n),r.stop(n+.18),r.onended=()=>i.disconnect()}function ie(e,t){if(typeof e.createOscillator!=`function`)return!1;try{let n=e.currentTime,r=e.createOscillator(),i=e.createGain();return r.type=`sine`,r.frequency.setValueAtTime(2400,n),r.frequency.exponentialRampToValueAtTime(1400,n+.02),i.gain.setValueAtTime(1e-4,n),i.gain.exponentialRampToValueAtTime(.15,n+.002),i.gain.exponentialRampToValueAtTime(1e-4,n+.045),r.connect(i),i.connect(t),r.start(n),r.stop(n+.05),r.onended=()=>i.disconnect(),!0}catch{return!1}}function _(e){let t=/* @__PURE__ */ new Float32Array(64);for(let n=0;n<64;n++){let r=n/63*Math.PI/2;t[n]=e===`in`?Math.sin(r):Math.cos(r)}return t}function ae(e,t){return e[0]+(e[1]-e[0])*t()}function v(e){e&&(e.load(),Promise.resolve(e.play()).catch(()=>{}))}function oe(e){if(e){try{e.currentTime>0&&(e.pause?.(),e.currentTime=0)}catch{}Promise.resolve(e.play()).catch(()=>{})}}function y(e){e&&(e.pause?e.pause():e.load())}function b(e,t={}){let n=t.random??Math.random,r=t.soundMode??`normal`,i=t.fanSpeed??`auto`,a=!1,o=0,c,l,d=0,f=/* @__PURE__ */ new Set,p=/* @__PURE__ */ new Map,m,g=1,b;function x(e,t){let n=setTimeout(()=>{f.delete(n),e()},t);f.add(n)}function S(){f.forEach(e=>clearTimeout(e)),f.clear()}function C(){return s[r]}function w(e,t=1){e&&(e.volume!==void 0&&(e.volume=Math.min(1,Math.max(0,C()*t))),e.muted!==void 0&&(e.muted=r===`mute`))}function T(){b&&clearInterval(b),b=void 0}function E(t,n,r){T();let i=g,a=Math.max(1,Math.round(n/100)),o=0;b=setInterval(()=>{o++,g=i+(t-i)*(o/a),w(e.work,g),o>=a&&(T(),r?.())},100)}function D(){return c===void 0&&(c=k(),c&&(m=j())),c}function O(){let e=D();e&&A(e)}function se(e){let n=p.get(e);if(!n){let r=t.loadAudioData??te;n=new Promise((t,n)=>{try{t(r(e))}catch(e){n(e)}}).catch(t=>{throw p.delete(e),t}),p.set(e,n)}return n.then(e=>e.slice(0))}function k(){if(t.webAudio===!1)return null;try{let n=(t.createAudioContext??ne)();if(!n)return null;let r=n.createGain();r.gain.value=C(),r.connect(n.destination);let i={};return{context:n,master:r,buffers:i,ready:Promise.all([`beep`,`start`,`work`].map(async t=>{let r=ee(e[t]);if(r&&!i[t])try{i[t]=await n.decodeAudioData(await se(r))}catch{}})).then(()=>!!(i.start&&i.work))}}catch{return null}}function A(e){e.context.state===`suspended`&&Promise.resolve(e.context.resume()).catch(()=>{})}function j(){if(typeof document>`u`)return()=>{};let e=()=>{O()};return document.addEventListener(`pointerdown`,e,!0),document.addEventListener(`keydown`,e,!0),()=>{document.removeEventListener(`pointerdown`,e,!0),document.removeEventListener(`keydown`,e,!0)}}function M(e){return Promise.race([e.ready,new Promise(e=>setTimeout(e,1500,!1))])}function N(e,t,n,r){let i=e.context.createBufferSource();return i.buffer=t,i.connect(n),i.start(r),i}function P(e,t,n){e.sources.add(t),t.onended=()=>{e.sources.delete(t),t.disconnect(),n?.()}}function F(e,t,n){let r=e.buffers.work,i=Math.min(h.loopCrossfadeMs/1e3,r.duration/2),a=e.context.createGain();a.gain.value=0,a.gain.setValueCurveAtTime(_(`in`),n,i),a.gain.setValueCurveAtTime(_(`out`),n+r.duration-i,i),a.connect(t.fan);let o=N(e,r,a,n);o.stop(n+r.duration),P(t,o,()=>a.disconnect());let s=n+r.duration-i;x(()=>{l===t&&F(e,t,s)},Math.max(0,(s-e.context.currentTime-1)*1e3))}function I(e,t){if(l&&c){let n=l.fan.gain,r=c.context.currentTime;n.cancelScheduledValues(r),n.setValueAtTime(n.value,r),n.linearRampToValueAtTime(e,r+t/1e3)}else E(e,t)}function L(){return i===`auto`?1:u[i]}function R(){a=!0;let e=++o;if(i!==`auto`)return;let t=()=>e===o&&i===`auto`,r=()=>{x(()=>{t()&&(I(h.surgeLevel,h.surgeRampMs),x(()=>{t()&&(I(h.settleLevel,h.surgeRampMs),r())},ae(h.surgeDurationMs,n)))},ae(h.quietDurationMs,n))};x(()=>{t()&&(I(h.settleLevel,h.settleRampMs),r())},h.settleAfterMs)}function ce(e){let t=e.context.createGain();t.connect(e.master);let n=e.context.createGain();n.gain.value=L(),n.connect(t);let r={output:t,fan:n,sources:/* @__PURE__ */ new Set};l=r;let i=e.context.currentTime;P(r,N(e,e.buffers.start,t,i)),F(e,r,i+h.startDelayMs/1e3),x(R,h.startDelayMs)}function z(e){let t=l;if(l=void 0,!t||!c)return;let n=c.context.currentTime,r=n+e/1e3,i=t.output.gain;i.cancelScheduledValues(n),i.setValueAtTime(i.value,n),i.linearRampToValueAtTime(0,r),t.sources.forEach(e=>{try{e.stop(r)}catch{}}),setTimeout(()=>t.output.disconnect(),e+100)}function B(){let{start:t,work:n}=e;y(n),w(t),v(t),x(()=>{n&&(g=0,w(n,0),n.loop!==void 0&&(n.loop=!0),v(n),E(L(),h.loopCrossfadeMs),R())},h.startDelayMs)}function V(t){y(e.start),t>0?E(0,t,()=>y(e.work)):y(e.work)}function H(){let e=++d;a=!1,o++,S(),T(),z(0),V(0);let t=D();t?(A(t),M(t).then(n=>{e===d&&(n?ce(t):B())})):B()}function U(){d++,a=!1,o++,S(),z(h.stopFadeMs),V(h.stopFadeMs)}return t.webAudio!==!1&&D(),{unlock(){O()},beep(){if(r===`mute`)return;let t=D();if(t){if(A(t),t.buffers.beep){let e=N(t,t.buffers.beep,t.master,t.context.currentTime);e.onended=()=>{try{e.disconnect()}catch{}};return}if(ie(t.context,t.master))return}w(e.beep),oe(e.beep)},drip(){if(r!==`normal`)return;let e=D();e&&e.context.state===`running`&&typeof e.context.createOscillator==`function`&&re(e.context,e.master)},toggleStatusAudio(e){e?U():H()},setSoundMode(t){r=t,c&&c.master.gain.setTargetAtTime(C(),c.context.currentTime,.08),w(e.beep),w(e.start),w(e.work,g)},setFanSpeed(e){e!==i&&(i=e,a?e===`auto`?(I(1,h.loopCrossfadeMs),R()):(o++,I(u[e],h.loopCrossfadeMs)):l&&(l.fan.gain.value=L()))},dispose(){d++,S(),T(),z(0),V(0),m?.(),m=void 0,c&&!t.createAudioContext&&Promise.resolve(c.context.close()).catch(()=>{}),c=null}}}let x={auto:.8,low:.55,medium:.8,high:1},S=[9e3,18e3];function C(e){if(!e.status||e.mode!==`cold`)return 0;let t=.2+.8*(31-e.temperature)/15,n=Math.min(1,Math.max(.2,t))*x[e.fan??`auto`];return Math.round(n*100)/100}function w(e){if(!e.status||e.mode!==`cold`||e.temperature>22)return;let[t,n]=S,r=(e.temperature-16)/6,i=t+(n-t)*Math.min(1,Math.max(0,r));return Math.round(i*(e.fan===`high`?.8:1))}function T(e){let t=w(e);return{mist:C(e),dripCycle:t===void 0?void 0:`${t}ms`,drip:t===void 0?`off`:`on`}}let E={compact:{width:360,height:128},wide:{width:600,height:200}};function D(e,t){return!(e>0)||!(t>0)?1:Math.min(1,e/t)}function O(e,t,n){if(typeof ResizeObserver>`u`)return()=>{};let r,i=e=>{let i=D(e,t);i!==r&&(r=i,n(i))};i(e.offsetWidth??e.getBoundingClientRect().width);let a=new ResizeObserver(e=>{for(let t of e)i(t.contentRect.width)});return a.observe(e),()=>a.disconnect()}function se(e,t,n=4){let r=globalThis.matchMedia;if(typeof r!=`function`||!r(`(hover: hover) and (pointer: fine)`).matches||r(`(prefers-reduced-motion: reduce)`).matches)return()=>{};let i=0,a=(e,n)=>{cancelAnimationFrame(i),i=requestAnimationFrame(()=>t(e,n))},o=t=>{let r=e.getBoundingClientRect();if(!r.width||!r.height)return;let i=(t.clientX-r.left)/r.width-.5,o=(t.clientY-r.top)/r.height-.5,s=e=>Math.round(e*100)/100;a(s(-o*2*n),s(i*2*n))},s=()=>a(0,0);return e.addEventListener(`pointermove`,o),e.addEventListener(`pointerleave`,s),()=>{cancelAnimationFrame(i),e.removeEventListener(`pointermove`,o),e.removeEventListener(`pointerleave`,s)}}function k(e,t,n={}){let{delay:r=500,interval:i=200,minInterval:a=100,value:o}=n,s,c=i,l,u=()=>{clearTimeout(s),s=void 0},d=()=>{if(o&&o()===l)return u();l=o?.(),t(),c=Math.max(a,c*.85),s=setTimeout(d,c)},f=e=>{e.button===0&&(u(),l=o?.(),t(),c=i,s=setTimeout(d,r))},p=e=>{e.detail===0&&t()},m=e=>e.preventDefault();return e.addEventListener(`pointerdown`,f),e.addEventListener(`pointerup`,u),e.addEventListener(`pointerleave`,u),e.addEventListener(`pointercancel`,u),e.addEventListener(`click`,p),e.addEventListener(`contextmenu`,m),()=>{u(),e.removeEventListener(`pointerdown`,f),e.removeEventListener(`pointerup`,u),e.removeEventListener(`pointerleave`,u),e.removeEventListener(`pointercancel`,u),e.removeEventListener(`click`,p),e.removeEventListener(`contextmenu`,m)}}function A(e,t){let n=e?.mode===`hot`?`hot`:`cold`,i=M(e?.temperature??r.temperature,t),a=n=>{let r=e?.temperatures?.[n];return typeof r==`number`&&Number.isFinite(r)?M(r,t):i};return{...r,...e,mode:n,temperature:i,temperatures:{cold:n===`cold`?i:a(`cold`),hot:n===`hot`?i:a(`hot`)},sound:p(e?.sound)?e.sound:r.sound,swing:typeof e?.swing==`boolean`?e.swing:r.swing,fan:d(e?.fan)?e.fan:`auto`}}function j(e,t){let n={cold:t,hot:t,...e.temperatures};return n[e.mode]=t,{...e,temperature:t,temperatures:n}}function M(e,t){if(!t)return Math.min(31,Math.max(16,e));let{min:n,max:r,step:i}=t,a=i>0?Math.round((e-n)/i)*i+n:e;return Number(Math.min(r,Math.max(n,a)).toFixed(4))}function N(e,t,r){let i=r?.step??n.step;switch(t.type){case`increment`:return j(e,M(e.temperature+i,r));case`decrement`:return j(e,M(e.temperature-i,r));case`toggleStatus`:return{...e,status:!e.status};case`status`:return{...e,status:t.status};case`mode`:{let n=e.status||t.powerOn===!0;if(t.mode===e.mode)return n===e.status?e:{...e,status:n};let i={cold:e.temperature,hot:e.temperature,...e.temperatures,[e.mode]:e.temperature};return{...e,status:n,mode:t.mode,temperature:M(i[t.mode]??e.temperature,r),temperatures:i}}case`sound`:return{...e,sound:p(t.sound)?t.sound:e.sound};case`cycleSound`:return{...e,sound:m(e.sound)};case`toggleSwing`:return{...e,swing:!e.swing};case`swing`:return{...e,swing:t.swing===!0};case`fan`:return{...e,fan:d(t.fan)?t.fan:e.fan};case`cycleFan`:return{...e,fan:f(e.fan)};case`update`:return A({...e,...t.payload},r);default:throw Error(`Unexpected Ac Action`)}}function P(e,t){return e===`cold`?{message:`制冷调到 ${t}°C 以上更省电`,detail:`少开一度，为节能减排出一份力`}:{message:`制热调到 ${t}°C 以下更省电`,detail:`少开一度，为节能减排出一份力`}}function F(){let e;return(t,n)=>{if(t.kind===`limit`)return`shake`;if(t.kind===`setting`)return`announce`;let r=`${n.mode}:${n.temperature}`;return r===e?`skip`:(e=r,`note`)}}function I(e){return`${o[e]}模式：${{normal:`风声和按键音恢复正常`,sleep:`风声和按键音都调小了，晚安`,mute:`空调不再发出任何声音`}[e]}`}function L(e){return e===`auto`?`风速：自动，由空调根据室温调节`:`风速：${l[e]}`}function R(e){return e?`扫风已开启：导风板上下摆动，出风左右扫`:`扫风已关闭：导风板停在当前位置`}function ce(e,t,r,i=n){if(r.type===`increment`&&e.temperature>=i.max)return{message:`已经是最大温度啦！`,severity:`error`,kind:`limit`};if(r.type===`decrement`&&e.temperature<=i.min)return{message:`已经是最小温度啦！`,severity:`error`,kind:`limit`};if((r.type===`sound`||r.type===`cycleSound`)&&t.sound!==e.sound)return{message:I(t.sound),severity:`info`,kind:`setting`};if((r.type===`fan`||r.type===`cycleFan`)&&t.fan&&t.fan!==e.fan)return{message:L(t.fan),severity:`info`,kind:`setting`};if((r.type===`swing`||r.type===`toggleSwing`)&&t.swing!==e.swing)return{message:R(t.swing),severity:`info`,kind:`setting`};if(r.type===`mode`&&t.mode===`cold`&&t.temperature<26)return{...P(`cold`,26),severity:`success`,kind:`tip`};if(r.type===`mode`&&t.mode===`hot`&&t.temperature>20)return{...P(`hot`,20),severity:`success`,kind:`tip`}}function z(e,t){if(!e)return r;try{let n=e.getItem(t);return n?A(JSON.parse(n)):r}catch{return r}}function B(e,t,n){if(e)try{e.setItem(t,JSON.stringify(n))}catch{}}function V(){if(typeof window>`u`)return null;try{return window.localStorage}catch{return null}}function H(e={}){let t=e.storageKey??`ac:state`,n=e.storage===void 0?V():e.storage,i=z(n,t),a=e.limits,o=A({...r,...i,...e.initialState},a),s=/* @__PURE__ */ new Set;return{getState(){return o},dispatch(r){let i=o,c=N(o,r,a),l=ce(i,c,r,a),u={action:r,previousState:i,state:c,notification:l};return o=c,B(n,t,c),s.forEach(e=>e(u)),l&&e.onNotify?.(l,u),u},subscribe(e){return s.add(e),()=>{s.delete(e)}}}}let U={cold:`m20.79 13.95l-2.33.62l-2-1.13v-2.88l2-1.13l2.33.62l.52-1.93l-1.77-.47l.46-1.77l-1.93-.52l-.62 2.33l-2 1.13L13 7.38V5.12l1.71-1.71L13.29 2L12 3.29L10.71 2L9.29 3.41L11 5.12v2.26L8.5 8.82l-2-1.13l-.58-2.33L4 5.88l.47 1.77l-1.77.47l.52 1.93l2.33-.62l2 1.13v2.89l-2 1.13l-2.33-.62l-.52 1.93l1.77.47L4 18.12l1.93.52l.62-2.33l2-1.13L11 16.62v2.26l-1.71 1.71L10.71 22L12 20.71L13.29 22l1.41-1.41l-1.7-1.71v-2.26l2.5-1.45l2 1.13l.62 2.33l1.88-.51l-.47-1.77l1.77-.47zM9.5 10.56L12 9.11l2.5 1.45v2.88L12 14.89l-2.5-1.45z`,hot:`m3.55 19.09l1.41 1.41l1.8-1.79l-1.42-1.42M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6s6-2.69 6-6c0-3.32-2.69-6-6-6m8 7h3v-2h-3m-2.76 7.71l1.8 1.79l1.41-1.41l-1.79-1.8M20.45 5l-1.41-1.4l-1.8 1.79l1.42 1.42M13 1h-2v3h2M6.76 5.39L4.96 3.6L3.55 5l1.79 1.81zM1 13h3v-2H1m12 9h-2v3h2`,power:`m16.56 5.44l-1.45 1.45A5.97 5.97 0 0 1 18 12a6 6 0 0 1-6 6a6 6 0 0 1-6-6c0-2.17 1.16-4.06 2.88-5.12L7.44 5.44A7.96 7.96 0 0 0 4 12a8 8 0 0 0 8 8a8 8 0 0 0 8-8c0-2.72-1.36-5.12-3.44-6.56M13 3h-2v10h2`,plus:`M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z`,minus:`M19 13H5v-2h14z`,increase:`m7 15l5-5l5 5z`,decrease:`m7 10l5 5l5-5z`,fan:`M12 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m.5-9c4.5 0 4.61 3.57 2.25 4.75c-.99.49-1.43 1.54-1.62 2.47c.48.2.9.51 1.22.91c3.7-2 7.68-1.21 7.68 2.37c0 4.5-3.57 4.6-4.75 2.23c-.5-.99-1.56-1.43-2.49-1.62c-.2.48-.51.89-.91 1.23c1.99 3.69 1.2 7.66-2.38 7.66c-4.5 0-4.59-3.58-2.23-4.76c.98-.49 1.42-1.53 1.62-2.45c-.49-.2-.92-.52-1.24-.92C5.96 15.85 2 15.07 2 11.5C2 7 5.56 6.89 6.74 9.26c.5.99 1.55 1.42 2.48 1.61c.19-.48.51-.9.92-1.22C8.15 5.96 8.94 2 12.5 2`,swing:`M6 14h3l-4 4l-4-4h3c0-2.7 1.7-7.4 7-7.9v2c-3.4.5-5 3.8-5 5.9m14 0c0-2.7-1.7-7.4-7-7.9v2c3.4.6 5 3.8 5 5.9h-3l4 4l4-4z`,soundNormal:`M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9z`,soundSleep:`m17.75 4.09l-2.53 1.94l.91 3.06l-2.63-1.81l-2.63 1.81l.91-3.06l-2.53-1.94L12.44 4l1.06-3l1.06 3zm3.5 6.91l-1.64 1.25l.59 1.98l-1.7-1.17l-1.7 1.17l.59-1.98L15.75 11l2.06-.05L18.5 9l.69 1.95zm-2.28 4.95c.83-.08 1.72 1.1 1.19 1.85c-.32.45-.66.87-1.08 1.27C15.17 23 8.84 23 4.94 19.07c-3.91-3.9-3.91-10.24 0-14.14c.4-.4.82-.76 1.27-1.08c.75-.53 1.93.36 1.85 1.19c-.27 2.86.69 5.83 2.89 8.02a9.96 9.96 0 0 0 8.02 2.89m-1.64 2.02a12.08 12.08 0 0 1-7.8-3.47c-2.17-2.19-3.33-5-3.49-7.82c-2.81 3.14-2.7 7.96.31 10.98c3.02 3.01 7.84 3.12 10.98.31`,soundMute:`M12 4L9.91 6.09L12 8.18M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.51-1.42.93-2.25 1.17v2.07c1.38-.32 2.63-.95 3.68-1.81L19.73 21L21 19.73l-9-9M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71m-2.5 0c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.05-.2.05-.42.05-.63`,leaf:`M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8`},W={normal:`soundNormal`,sleep:`soundSleep`,mute:`soundMute`};function le(e){let t=`扫风：${e.swing?`开`:`关`}`,n=`声音：${o[e.sound]}`,r=`风速：${l[e.fan??`auto`]}`;return{display:`${e.status?`运行`:`待机`}，${a[e.mode]} ${e.temperature}°C，${r}，${t}，${n}`,power:`电源：${e.status?`开`:`关`}`,mode:a,fan:r,swing:t,sound:n}}let G={grade:1,grades:5,standard:`GB 21455-2019`,top:[{num:4,size:4,mx:1.5,my:0,color:`white`}],detail:[{num:11,size:2,mx:.8,my:2,color:`black`},{num:9,size:1.5,mx:.8,my:2,color:`black`},{num:10,size:1.2,mx:.8,my:0,color:`black`}],footer:{num:8,size:2,mx:.8,my:0,color:`white`},levels:[{background:`lightgreen`,width:`50%`},{background:`#fdd835`,width:`60%`},{background:`orange`,width:`70%`},{background:`red`,width:`80%`}]};function ue(){return`中国能效标识：能效等级 ${G.grade} 级（共 ${G.grades} 级），依据 ${G.standard}`}function K(e){"@babel/helpers - typeof";return K=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},K(e)}function de(e,t){if(K(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(K(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function fe(e){var t=de(e,`string`);return K(t)==`symbol`?t:t+``}function q(e,t,n){return(t=fe(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}let J=`air-conditioner-widget`,Y=`acw-digit-font`;function X(e){return e.replace(/[&<>"']/g,e=>`&#${e.charCodeAt(0)};`)}function pe(e){if(typeof document>`u`||document.getElementById(Y))return;let t=document.createElement(`style`);t.id=Y,t.textContent=`@font-face {
  font-family: "Digital-7 Mono";
  src: url("${e.replace(/\/$/,``)}/fonts/digital-7-mono.ttf") format("truetype");
  font-display: swap;
}`,document.head.appendChild(t)}function Z(e,t,n){return`<svg${n?` class="${n}"`:``} viewBox="0 0 24 24" width="${t}" height="${t}" aria-hidden="true"><path fill="currentColor" d="${U[e]}" /></svg>`}function Q(e){let t=Array.from({length:e.num}).fill(`<span class="acw-dot" style="width: ${e.size}px; height: ${e.size}px; margin: ${e.my}px ${e.mx}px"></span>`).join(``);return`<div class="acw-dot-row" style="--acw-dot-color: ${e.color}">${t}</div>`}function me(){let e=G.levels.map(e=>`<div class="acw-energy-level" style="background-color: ${e.background}; width: ${e.width}"></div>`).join(``);return`<div class="acw-energy-label" role="img" aria-label="${ue()}">
    <div class="acw-energy-header">${G.top.map(e=>Q(e)).join(``)}<span class="acw-energy-qr"></span></div>
    <div class="acw-energy-grades">
      <div class="acw-energy-arrow"><div class="acw-arrow-bar"></div><div class="acw-arrow-tip"></div><div class="acw-arrow-bar acw-arrow-bar-sm"></div></div>
      ${e}
    </div>
    <div class="acw-energy-detail">
      ${G.detail.map((e,t)=>Q(e)+(t===0?`<div class="acw-energy-detail-line"></div>`:``)).join(``)}
    </div>
    ${Q(G.footer)}
  </div>`}function he(e){let t=e.audio?`<audio data-audio="beep" src="${X(e.audio.beep)}" preload="auto"></audio>
      <audio data-audio="start" src="${X(e.audio.start)}" preload="auto"></audio>
      <audio data-audio="work" src="${X(e.audio.work)}" preload="auto"></audio>`:``,n=e.logoUrl?`<div class="acw-logo"><a href="${X(e.logoHref)}" target="_blank" rel="noreferrer noopener"${e.title?` title="${X(e.title)}"`:``} aria-label="${X(e.title??`Air Conditioner`)}"><img src="${X(e.logoUrl)}" alt=""></a></div>`:``;return`
  <style>:host {
  display: inline-block;
  /* 宽度相对宿主容器确定，避免 inline-block 收缩到遥控器宽度把机身挤窄 */
  width: min(420px, 100%);
}

:host {
  --acw-text-color: #141414;
  --acw-border-color: #e0e0e0;
  --acw-display-color: #cccccc;
  --acw-wind-color: #bbbbbb;
  --acw-led-on: #38f709;
  --acw-wind-track: rgba(187, 187, 187, 0.28);
  --acw-wind-cold: #8cc4f2;
  --acw-wind-hot: #f6ad7b;
}

/* 动效 token：时长 / 缓动统一来自 core 的 acMotion */
/* @ac-motion-tokens:start (generated by renderAcMotionCssVars, keep in sync) */
:host {
  --acw-motion-duration-instant: 90ms;
  --acw-motion-duration-fast: 160ms;
  --acw-motion-duration-base: 240ms;
  --acw-motion-duration-slow: 420ms;
  --acw-motion-duration-flow: 1800ms;
  --acw-motion-duration-swing: 5200ms;
  --acw-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --acw-motion-ease-enter: cubic-bezier(0, 0, 0, 1);
  --acw-motion-ease-exit: cubic-bezier(0.3, 0, 1, 1);
  --acw-motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  :host {
    --acw-motion-duration-instant: 0ms;
    --acw-motion-duration-fast: 80ms;
    --acw-motion-duration-base: 120ms;
    --acw-motion-duration-slow: 120ms;
    --acw-motion-duration-flow: 0ms;
    --acw-motion-duration-swing: 0ms;
  }
}
/* @ac-motion-tokens:end */

html.dark .acw-root,
.acw-root.dark {
  --acw-text-color: #fafafa;
}

html.dark .acw-mist,
.acw-root.dark .acw-mist {
  --acw-mist-color: rgba(214, 234, 252, 0.5);
}

@media (prefers-color-scheme: dark) {
  .acw-root:not(.light) .acw-mist {
    --acw-mist-color: rgba(214, 234, 252, 0.5);
  }
}

@media (prefers-color-scheme: dark) {
  .acw-root:not(.light) {
    --acw-text-color: #fafafa;
  }
}

/* 暗色下换成深色纸，仍按模式着色 */
html.dark .acw-note,
.acw-root.dark .acw-note {
  --acw-note-bg: #1d2733;
  --acw-note-text: #e3ecf5;
  --acw-note-accent: #64b5f6;
}

html.dark .acw-note[data-mode="hot"],
.acw-root.dark .acw-note[data-mode="hot"] {
  --acw-note-bg: #2d241d;
  --acw-note-text: #f5e9de;
  --acw-note-accent: #ffb74d;
}

@media (prefers-color-scheme: dark) {
  .acw-root:not(.light) .acw-note {
    --acw-note-bg: #1d2733;
    --acw-note-text: #e3ecf5;
    --acw-note-accent: #64b5f6;
  }

  .acw-root:not(.light) .acw-note[data-mode="hot"] {
    --acw-note-bg: #2d241d;
    --acw-note-text: #f5e9de;
    --acw-note-accent: #ffb74d;
  }
}

/* ---------------------------------- 布局 ---------------------------------- */
.acw-root {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 显式占满可用宽度：在 flex / grid 居中等收缩布局里也不会被遥控器宽度挤窄 */
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  color: var(--acw-text-color);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.acw-root *,
.acw-root *::before,
.acw-root *::after {
  box-sizing: inherit;
}

/* 冷 / 热 色温（仅开机时） */
.acw-root[data-status="on"][data-mode="cold"] {
  filter: saturate(90%);
}

.acw-root[data-status="on"][data-mode="hot"] {
  filter: saturate(110%);
}

.acw-unit {
  width: min(100%, 360px);
  /* 指针跟随的轻微 3D 倾斜（--acw-tilt-* 由组件写入，仅精细指针且未开启减少动效时） */
  transform: perspective(var(--acw-perspective, 800px)) rotateX(var(--acw-tilt-x, 0deg)) rotateY(var(--acw-tilt-y, 0deg));
  transition: transform var(--acw-motion-duration-slow) var(--acw-motion-ease-standard);
}

/*
 * 长款机身（data-size="wide"，600 × 200，3 : 1）：网站主页用。只改尺寸相关的位置，
 * 其余与 360 × 128 的标准款共用；窄容器下同样等比缩小（组件按 acShellSize.wide 计算缩放）。
 */
.acw-unit[data-size="wide"] {
  --acw-shell-height: 200px;
  --acw-perspective: 1200px;
  --acw-energy-scale: 0.9;

  width: min(100%, 600px);
}

.acw-unit[data-size="wide"] .acw-logo {
  top: 156px;
}

.acw-unit[data-size="wide"] .acw-outlet {
  top: 174px;
}

.acw-unit[data-size="wide"] .acw-led {
  top: 178px;
}

/* --------------------------------- 机身 ---------------------------------- */
.acw-shell {
  position: relative;
  height: var(--acw-shell-height, 128px);
  /* 窄容器下整体等比缩小，保持长款比例（--acw-scale 由组件按容器宽度写入）。
     用百分比换算回 360px 设计宽度，避免固定宽度撑大父容器的最小尺寸 */
  width: calc(100% / var(--acw-scale, 1));
  transform: scale(var(--acw-scale, 1));
  transform-origin: 0 0;
  /* 缩放不改变布局尺寸，用负外边距收回多出来的高度 */
  margin-bottom: calc(var(--acw-shell-height, 128px) * (var(--acw-scale, 1) - 1));
  /* 伪 3D：顶部受光、底部弧面渐暗，配合内侧高光与投在墙上的阴影 */
  background: linear-gradient(to bottom, #fff 0%, #fdfdfd 48%, #eef0f3 100%);
  border: 1px solid var(--acw-border-color);
  border-radius: 10px 10px 20px 20px;
  box-shadow:
    inset 0 1px 0 #fff,
    inset 0 -10px 14px -10px rgba(15, 23, 42, 0.16),
    0 1px 2px rgba(15, 23, 42, 0.08),
    0 12px 22px -10px rgba(15, 23, 42, 0.28);
}

/* 面板上半部的柔和光泽 */
.acw-shell::before {
  content: "";
  position: absolute;
  top: 1px;
  right: 6px;
  left: 6px;
  height: 42%;
  border-radius: 8px 8px 50% 50% / 8px 8px 14px 14px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
  pointer-events: none;
}

/* 中央 Logo */
.acw-logo {
  position: absolute;
  top: 84px;
  right: 0;
  left: 0;
  text-align: center;
}

.acw-logo img {
  display: block;
  width: 12px;
  /* 按 Logo 原图比例占好位置：图片加载失败时也不变形、不撑开 */
  aspect-ratio: 845 / 570;
  overflow: hidden;
  margin: 0 auto;
}

/* 出风口线：面板与底部弧面的分界 */
.acw-outlet {
  position: absolute;
  top: 102px;
  right: 0;
  left: 0;
  border-top: 1px solid var(--acw-border-color);
  box-shadow: 0 1px 0 #fff;
}

/* 出风口：开机时缝隙变暗、导风板向外翻开；关机时导风板与机身齐平 */
.acw-vent {
  position: absolute;
  right: 24px;
  bottom: 13px;
  left: 24px;
  overflow: hidden;
  height: 5px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.03));
  opacity: 0;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

.acw-louver {
  position: absolute;
  right: 24px;
  bottom: 6px;
  left: 24px;
  height: 10px;
  border-radius: 0 0 10px 10px;
  /* 与机身底部弧面同色，合上时融为一体 */
  background: linear-gradient(to bottom, #f2f3f6, #eceef1);
  transform-origin: 50% 0;
  /* 关机：等出风淡出后再合上 */
  transition: transform var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

/* 导风板的轮廓与内侧阴影：合上时隐藏 */
.acw-louver::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid var(--acw-border-color);
  border-top: 0;
  border-radius: inherit;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.06), transparent);
  opacity: 0;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-standard) var(--acw-motion-duration-base);
}

.acw-unit[data-status="on"] .acw-vent,
.acw-unit[data-status="on"] .acw-louver,
.acw-unit[data-status="on"] .acw-louver::before {
  transition-delay: 0ms;
}

.acw-unit[data-status="on"] .acw-vent,
.acw-unit[data-status="on"] .acw-louver::before {
  opacity: 1;
}

.acw-unit[data-status="on"] .acw-louver {
  transform: translateY(4px) perspective(80px) rotateX(-38deg);
}

/*
 * 扫风（#50）：导风板上下摆动，出风口里的竖向导风叶片随气流左右摆。
 * 和出风线一样用同一个时长、关闭扫风时暂停，叶片停在当前位置；
 * 导风板摆动放在独立的 rotate 属性上，不影响开关机时 transform 的过渡。
 */
.acw-louver {
  animation: acw-louver-swing var(--acw-motion-duration-swing) ease-in-out infinite;
  animation-play-state: paused;
}

/* 竖向导风叶片：一排细条纹，倾斜（skewX）表示叶片左右摆 */
.acw-vent::before {
  content: "";
  position: absolute;
  inset: 0 6px;
  background: repeating-linear-gradient(to right, transparent 0 9px, rgba(15, 23, 42, 0.22) 9px 10px);
  transform-origin: 50% 0;
  animation: acw-vane-swing var(--acw-motion-duration-swing) linear infinite;
  animation-play-state: paused;
}

.acw-unit[data-status="on"][data-swing="on"] .acw-louver,
.acw-unit[data-status="on"][data-swing="on"] .acw-vent::before {
  animation-play-state: running;
}

/* 关机时导风板合上，摆动角度归零 */
.acw-unit[data-status="off"] .acw-louver {
  animation: none;
}

@keyframes acw-louver-swing {
  0%,
  100% {
    rotate: x 0deg;
  }

  50% {
    rotate: x -26deg;
  }
}

/* 与 acw-wind-swing 同步：出风线向左转时叶片下端向右，方向相反、节奏一致 */
@keyframes acw-vane-swing {
  0% {
    transform: skewX(0deg);
    animation-timing-function: cubic-bezier(0.61, 1, 0.88, 1);
  }

  25% {
    transform: skewX(22deg);
    animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
  }

  75% {
    transform: skewX(-22deg);
    animation-timing-function: cubic-bezier(0.12, 0, 0.39, 0);
  }

  100% {
    transform: skewX(0deg);
  }
}

/*
 * 雾气（#70）：制冷开机时，几团冷雾从导风板下方飘出、边飘边散。
 * 浓度 --acw-mist（0–1）由 core 的 getAcMist 按设定温度和风速算出；风速同时改变飘散的快慢。
 */
.acw-mist {
  --acw-mist-color: rgba(176, 214, 242, 0.85);

  position: absolute;
  top: calc(100% - 8px);
  right: 36px;
  left: 36px;
  height: 56px;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-exit);
}

.acw-unit[data-status="on"][data-mode="cold"] .acw-mist {
  opacity: var(--acw-mist, 0);
  transition-timing-function: var(--acw-motion-ease-enter);
  transition-delay: var(--acw-motion-duration-slow);
}

.acw-mist i {
  position: absolute;
  top: 0;
  left: var(--acw-mist-x);
  width: 76px;
  height: 26px;
  margin-left: -38px;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--acw-mist-color), transparent);
  opacity: 0;
  animation: acw-mist-drift calc(var(--acw-motion-duration-flow) * 2.4 * var(--acw-wind-pace, 1)) ease-out var(--acw-mist-delay) infinite;
  animation-play-state: paused;
}

.acw-unit[data-status="on"][data-mode="cold"] .acw-mist i {
  animation-play-state: running;
}

.acw-mist i:nth-child(1) {
  --acw-mist-x: 10%;
  --acw-mist-dx: -14px;
  --acw-mist-delay: 0ms;
}

.acw-mist i:nth-child(2) {
  --acw-mist-x: 30%;
  --acw-mist-dx: -6px;
  --acw-mist-delay: -1700ms;
}

.acw-mist i:nth-child(3) {
  --acw-mist-x: 50%;
  --acw-mist-dx: 2px;
  --acw-mist-delay: -850ms;
}

.acw-mist i:nth-child(4) {
  --acw-mist-x: 70%;
  --acw-mist-dx: 8px;
  --acw-mist-delay: -2600ms;
}

.acw-mist i:nth-child(5) {
  --acw-mist-x: 90%;
  --acw-mist-dx: 14px;
  --acw-mist-delay: -3500ms;
}

@keyframes acw-mist-drift {
  0% {
    opacity: 0;
    transform: translate(0, -6px) scale(0.4);
  }

  25% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(var(--acw-mist-dx), 34px) scale(1.8);
  }
}

/*
 * 冷凝水（#21）：开得很冷时，导风板边缘慢慢聚起一颗水珠，再「嗒」地落下。
 * 间隔 --acw-drip-cycle 由 core 的 getAcDripInterval 算出；不滴水时根元素是 data-drip="off"。
 * 落下的那一刻（每轮动画结束）视图播放滴水声。
 */
.acw-drip {
  position: absolute;
  top: calc(100% - 7px);
  left: 27%;
  width: 5px;
  height: 7px;
  border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
  background: radial-gradient(circle at 35% 30%, #fff 0 18%, rgba(110, 172, 226, 0.9) 70%);
  box-shadow: 0 0 0 0.5px rgba(70, 130, 190, 0.35);
  transform: scale(0);
  transform-origin: 50% 0;
  opacity: 0;
  pointer-events: none;
}

.acw-unit[data-drip="on"] .acw-drip {
  animation: acw-drip var(--acw-drip-cycle, 12000ms) linear infinite;
}

/* 前 96% 慢慢聚起，最后一小段加速落下 */
@keyframes acw-drip {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }

  12% {
    opacity: 1;
  }

  96% {
    opacity: 1;
    transform: translateY(0) scale(1);
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
  }

  100% {
    opacity: 0;
    transform: translateY(44px) scale(0.85, 1.25);
  }
}

/* 状态指示灯：亮起的光晕放在伪元素上，只过渡 opacity / transform */
.acw-led {
  position: absolute;
  top: 106px;
  right: 8px;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: var(--acw-border-color);
}

.acw-led::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--acw-led-on);
  box-shadow: 0 0 6px rgba(56, 247, 9, 0.7);
  opacity: 0;
  transform: scale(0.4);
  transition:
    opacity var(--acw-motion-duration-fast) var(--acw-motion-ease-standard),
    transform var(--acw-motion-duration-fast) var(--acw-motion-ease-spring);
}

.acw-unit[data-status="on"] .acw-led::after {
  opacity: 1;
  transform: none;
}

/* --------------------------------- 显示屏 -------------------------------- */
.acw-display {
  position: absolute;
  top: 24px;
  right: 32px;
  color: var(--acw-display-color);
  text-align: right;
  opacity: 0;
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-exit);
}

.acw-unit[data-status="on"] .acw-display {
  opacity: 1;
  transition-timing-function: var(--acw-motion-ease-enter);
}

.acw-display-mode {
  font-size: 14px;
  text-align: left;
  line-height: 1;
}

.acw-display-temp {
  position: relative;
  font-size: 36px;
  line-height: 1.1;
}

/* 开机自检：先短暂点亮全部笔段「88」，再显示温度 */
.acw-selftest {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
}

.acw-unit[data-status="on"] .acw-selftest {
  animation: acw-selftest 560ms steps(1, end) both;
}

.acw-unit[data-status="on"] .acw-readout {
  animation: acw-selftest-reveal 560ms steps(1, end) both;
}

@keyframes acw-selftest {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes acw-selftest-reveal {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.acw-digit {
  font-family: "Digital-7 Mono", "Courier New", monospace;
}

.acw-display-temp small {
  font-size: 18px;
}

.acw-temperature {
  display: inline-block;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
}

/* 温度切换：升温从下方滚入、降温从上方滚入 */
.acw-temperature[data-dir="up"] {
  animation: acw-digit-up var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
}

.acw-temperature[data-dir="down"] {
  animation: acw-digit-down var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
}

/* 模式切换：图标轻微回弹弹出 */
.acw-mode-icon {
  display: inline-block;
}

.acw-mode-icon[data-animate] {
  animation: acw-icon-pop var(--acw-motion-duration-base) var(--acw-motion-ease-spring) both;
}

@keyframes acw-digit-up {
  from {
    opacity: 0;
    transform: translateY(40%);
  }
}

@keyframes acw-digit-down {
  from {
    opacity: 0;
    transform: translateY(-40%);
  }
}

@keyframes acw-icon-pop {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-40deg);
  }
}

/* -------------------------------- 能效标签 ------------------------------- */
.acw-energy-label {
  position: absolute;
  top: 10px;
  left: 10px;
  /* 按 50 × 80 设计（接近实物 66 × 109 mm 的比例），再整体缩小：实物约占
     挂机正面高度的 1/3，在 128px 高的机身上约 30 × 48 */
  width: 50px;
  height: 80px;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 2px;
  background: #4ea5f5;
  transform: scale(var(--acw-energy-scale, 0.6));
  transform-origin: 0 0;
}

/* 点阵不换行：放不下时点会被压扁，和主站一致 */
.acw-dot-row {
  display: flex;
  justify-content: center;
}

.acw-dot {
  display: inline-block;
  border-radius: 9999px;
  background: var(--acw-dot-color, #000);
}

/* 顶部：标识名称与能效信息码（二维码：三个定位角加模块） */
.acw-energy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
}

.acw-energy-qr {
  flex: none;
  width: 11px;
  height: 11px;
  border: 1px solid #fff;
  box-sizing: border-box;
  background-color: #fff;
  background-image:
    linear-gradient(#000, #000),
    linear-gradient(#000, #000),
    linear-gradient(#000, #000),
    repeating-conic-gradient(#000 0 25%, #fff 0 50%);
  background-position: 0 0, 100% 0, 0 100%, 0 0;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat;
  background-size: 3px 3px, 3px 3px, 3px 3px, 2px 2px;
}

/* 5 个等级条在等级区内均匀分布 */
.acw-energy-grades {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  box-sizing: border-box;
  height: 28px;
  margin: 4px 0;
  padding: 2px 8px;
  background: #fff;
}

/* 等级指示：左侧色条，右侧朝左的小箭头 + 短条 */
.acw-energy-arrow {
  display: flex;
  height: 3px;
}

.acw-arrow-bar {
  flex: 0 0 40%;
  background: green;
}

.acw-arrow-bar-sm {
  flex-basis: 10%;
}

.acw-arrow-tip {
  flex: none;
  width: 0;
  margin-left: 40%;
  border-style: solid;
  border-width: 1.5px 2px 1.5px 0;
  border-color: transparent green transparent transparent;
}

.acw-energy-level {
  height: 3px;
}

.acw-energy-detail {
  height: 20px;
  margin-bottom: 2px;
  padding-top: 0.8px;
  background: #fff;
}

.acw-energy-detail-line {
  height: 0;
  margin: 0.8px 0;
  border-top: 1px solid #000;
}

/* --------------------------------- 风特效 ------------------------------- */
/* 开机：导风板打开后出风再淡入；关机：出风先淡出 */
.acw-wind {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  opacity: 0;
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-exit);
}

.acw-unit[data-status="on"] .acw-wind {
  opacity: var(--acw-wind-strength, 1);
  transition: opacity var(--acw-motion-duration-slow) var(--acw-motion-ease-enter) var(--acw-motion-duration-base);
}

/* 风速：自动沿用默认节奏；固定风速改变出风的快慢与浓淡 */
.acw-unit[data-fan="low"] {
  --acw-wind-pace: 1.6;
  --acw-wind-strength: 0.55;
}

.acw-unit[data-fan="medium"] {
  --acw-wind-pace: 1.15;
  --acw-wind-strength: 0.8;
}

.acw-unit[data-fan="high"] {
  --acw-wind-pace: 0.7;
  --acw-wind-strength: 1;
}

.acw-wind-line {
  position: relative;
  overflow: hidden;
  width: 4px;
  height: 40px;
  border-radius: 9999px;
  background: var(--acw-wind-track);
  /* 三股气流以各自的出风点为轴，向两侧扇形散开 */
  transform-origin: 50% 0;
  rotate: var(--acw-wind-angle, 0deg);
  /* 扫风：在散开角度上再左右摆动；关闭扫风时停在当前位置，和真的导风板一样 */
  animation: acw-wind-swing var(--acw-motion-duration-swing) linear infinite;
  animation-play-state: paused;
}

.acw-unit[data-status="on"][data-swing="on"] .acw-wind-line {
  animation-play-state: running;
}

/* 气流：冷 / 暖两层渐变条沿出风线向下流动，切换模式时交叉淡化 */
.acw-wind-line::before,
.acw-wind-line::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  border-radius: inherit;
  background: linear-gradient(to bottom, transparent, var(--acw-wind-cold), transparent);
  transform: translateY(-110%);
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
  animation: acw-wind-flow calc(var(--acw-motion-duration-flow) * var(--acw-wind-pace, 1)) cubic-bezier(0.45, 0, 0.55, 1) var(--acw-wind-delay, 0ms) infinite;
  /* 关机时暂停，静止状态不跑循环 */
  animation-play-state: paused;
}

.acw-wind-line::after {
  background: linear-gradient(to bottom, transparent, var(--acw-wind-hot), transparent);
  opacity: 0;
}

.acw-unit[data-mode="hot"] .acw-wind-line::before {
  opacity: 0;
}

.acw-unit[data-mode="hot"] .acw-wind-line::after {
  opacity: 1;
}

.acw-unit[data-status="on"] .acw-wind-line::before,
.acw-unit[data-status="on"] .acw-wind-line::after {
  animation-play-state: running;
}

.acw-wind-line:nth-child(1) {
  --acw-wind-delay: -600ms;
  --acw-wind-angle: 14deg;
}

.acw-wind-line:nth-child(2) {
  margin: 0 80px;
}

.acw-wind-line:nth-child(3) {
  --acw-wind-delay: -1200ms;
  --acw-wind-angle: -14deg;
}

@keyframes acw-wind-flow {
  from {
    transform: translateY(-110%);
  }

  to {
    transform: translateY(180%);
  }
}

/* 从正中出发：经过中间时最快，摆到两端时减速折返（近似正弦） */
@keyframes acw-wind-swing {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0.61, 1, 0.88, 1);
  }

  25% {
    transform: rotate(-22deg);
    animation-timing-function: cubic-bezier(0.37, 0, 0.63, 1);
  }

  75% {
    transform: rotate(22deg);
    animation-timing-function: cubic-bezier(0.12, 0, 0.39, 0);
  }

  100% {
    transform: rotate(0deg);
  }
}

/* --------------------------------- 遥控器 ------------------------------- */
/* 极简白色遥控器：顶部小屏 → 电源键 → 温度 +/- → 一行图标键（模式 / 扫风 / 睡眠） */
.acw-remote {
  --acw-remote-key: #f2f3f5;
  --acw-remote-icon: #5f6368;
  --acw-remote-power: #e5484d;
  --acw-remote-cold: #1e88e5;
  --acw-remote-hot: #fb8c00;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
  width: 200px;
  margin: 24px auto;
  padding: 18px 18px 22px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 40px;
  background: #fff;
  color: var(--acw-remote-icon);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 16px 32px -16px rgba(0, 0, 0, 0.28);
}

.acw-remote svg {
  display: block;
}

/* 小屏：模式图标、设定温度、风量格、扫风 / 睡眠图标 */
.acw-lcd {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 14px 8px;
  border-radius: 18px;
  background: #e9eef0;
  color: #2b3034;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: color var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
}

.acw-lcd-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.acw-lcd-mode {
  color: var(--acw-remote-cold);
  transition: color var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
}

.acw-lcd[data-mode="hot"] .acw-lcd-mode {
  color: var(--acw-remote-hot);
}

.acw-lcd-temp {
  font-size: 40px;
  line-height: 1;
}

.acw-lcd-temp small {
  margin-left: 2px;
  font-size: 16px;
  vertical-align: top;
}

.acw-lcd-status {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 14px;
  margin-top: 4px;
}

.acw-lcd-wind {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
  margin-right: auto;
}

.acw-lcd-wind i {
  width: 4px;
  border-radius: 1px;
  background: currentColor;
}

.acw-lcd-wind i:nth-child(1) {
  height: 40%;
}

.acw-lcd-wind i:nth-child(2) {
  height: 70%;
}

.acw-lcd-wind i:nth-child(3) {
  height: 100%;
}

/* 风速格按档位点亮；自动风速三格全亮，并标出「自动」 */
.acw-lcd-wind i {
  opacity: 0.25;
}

.acw-lcd[data-fan="auto"] .acw-lcd-wind i,
.acw-lcd[data-fan="low"] .acw-lcd-wind i:nth-child(1),
.acw-lcd[data-fan="medium"] .acw-lcd-wind i:nth-child(-n + 2),
.acw-lcd[data-fan="high"] .acw-lcd-wind i {
  opacity: 1;
}

.acw-lcd-wind b {
  display: none;
  align-self: center;
  margin-left: 3px;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}

.acw-lcd[data-fan="auto"] .acw-lcd-wind b {
  display: inline;
}

/* 未亮起的段位保留一道淡影，像真实的液晶屏 */
.acw-lcd-wind,
.acw-lcd-swing,
.acw-lcd-sound {
  opacity: 0.14;
  transition: opacity var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
}

.acw-lcd[data-status="on"] .acw-lcd-wind,
.acw-lcd[data-swing="on"] .acw-lcd-swing,
.acw-lcd-sound:not([data-sound="normal"]) {
  opacity: 1;
}

/* 待机：屏幕变暗，只保留设定值 */
.acw-lcd[data-status="off"] {
  color: #9aa3a8;
}

.acw-lcd[data-status="off"] .acw-lcd-mode {
  color: inherit;
}

/* 按键 */
.acw-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--acw-remote-key);
  color: var(--acw-remote-icon);
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  /* 松开：带一点回弹 */
  transition:
    transform var(--acw-motion-duration-fast) var(--acw-motion-ease-spring),
    background-color var(--acw-motion-duration-base) var(--acw-motion-ease-standard),
    color var(--acw-motion-duration-base) var(--acw-motion-ease-standard),
    box-shadow var(--acw-motion-duration-base) var(--acw-motion-ease-standard);
}

/* 悬停 / 按下的明暗变化放在遮罩层上，只过渡 opacity */
.acw-button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--acw-motion-duration-fast) var(--acw-motion-ease-standard);
}

.acw-button:hover::after {
  opacity: 0.08;
}

.acw-button:active {
  transform: scale(0.92);
  transition-duration: var(--acw-motion-duration-instant);
  transition-timing-function: var(--acw-motion-ease-standard);
}

.acw-button:active::after {
  opacity: 0.16;
  transition-duration: var(--acw-motion-duration-instant);
}

.acw-button:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 3px;
}

/* 电源键：唯一的彩色按键，开机后填满 */
.acw-button-power {
  width: 52px;
  height: 52px;
  border: 1px solid rgba(229, 72, 77, 0.24);
  background: #fff;
  color: var(--acw-remote-power);
}

.acw-button-power.acw-button-on {
  border-color: transparent;
  background: var(--acw-remote-power);
  color: #fff;
  box-shadow: 0 6px 14px -6px rgba(229, 72, 77, 0.7);
}

/* 温度 +/-：竖向胶囊，主操作 */
.acw-remote-temp {
  display: flex;
  flex-direction: column;
  width: 72px;
  border-radius: 36px;
  background: var(--acw-remote-key);
  position: relative;
}

.acw-remote-temp::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 24px;
  right: 24px;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
}

.acw-button-temp {
  width: 72px;
  height: 64px;
  background: transparent;
  color: #3c4043;
  /* 支持长按连续调温：触屏上不选中文字、不弹出菜单、不双击缩放 */
  touch-action: manipulation;
  user-select: none;
  -webkit-touch-callout: none;
}

.acw-button-temp:first-child {
  border-radius: 36px 36px 12px 12px;
}

.acw-button-temp:last-child {
  border-radius: 12px 12px 36px 36px;
}

/* 底部一行图标键 */
.acw-remote-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* 模式键：制冷 / 制热分段，独占一行，当前模式凸起并着色 */
.acw-remote-mode {
  display: flex;
  flex-basis: 100%;
  gap: 2px;
  padding: 3px;
  border-radius: 22px;
  background: var(--acw-remote-key);
}

.acw-button-cold,
.acw-button-hot {
  flex: 1;
  height: 34px;
  border-radius: 17px;
  background: transparent;
  color: #9aa0a6;
}

.acw-button-cold[aria-pressed="true"],
.acw-button-hot[aria-pressed="true"] {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
}

.acw-button-cold[aria-pressed="true"] {
  color: var(--acw-remote-cold);
}

.acw-button-hot[aria-pressed="true"] {
  color: var(--acw-remote-hot);
}

/* 风速键 / 扫风键 / 睡眠（声音）键：风速固定在某一档、扫风开启时着色；
   声音键在标准 → 睡眠 → 静音间切换，图标与颜色随模式变化 */
.acw-button-fan:not([data-fan="auto"]),
.acw-button-swing[aria-pressed="true"] {
  background: #e1f1fb;
  color: #0288d1;
}

.acw-button-sound[data-sound="sleep"] {
  background: #ede7f6;
  color: #5e35b1;
}

.acw-button-sound[data-sound="mute"] {
  color: #9e9e9e;
}

/* -------------------------------- 通知提示 ------------------------------ */
/* 「出风口吹出的小纸条」：提示区紧贴在空调下方，节能建议像一张便签被风从出风口
   吹出来，在风里轻轻摆动，几秒后被吹走。只有节能建议会弹出；设置变化只在遥控器
   小屏上体现，温度到上下限时小屏抖一下（见 .acw-lcd[data-alert]）。 */
.acw-notification-region {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 0;
}

.acw-note {
  --acw-note-bg: #f4f9ff;
  --acw-note-text: #22313f;
  --acw-note-accent: #1e88e5;
  /* 顶边落在出风线的下半截：风线仍在纸条上方，看起来是被风推出来的 */
  position: absolute;
  top: calc(-1 * var(--acw-note-lift, 42px));
  left: 50%;
  /* 只是一闪而过的提示，不挡住下方的按钮 */
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: max-content;
  max-width: min(300px, 92%);
  padding: 9px 14px 8px 9px;
  border-radius: 3px 3px 10px 10px;
  background: var(--acw-note-bg);
  color: var(--acw-note-text);
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.04),
    0 10px 18px -10px rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 1.35;
  translate: -50% 0;
  transform-origin: 50% 0;
  /* 吹出来，然后在风里轻轻摆动 */
  animation:
    acw-note-blow 620ms var(--acw-motion-ease-enter) both,
    acw-note-flutter 2600ms ease-in-out 620ms infinite;
}

.acw-note[data-mode="hot"] {
  --acw-note-bg: #fff6ee;
  --acw-note-text: #3d2a1c;
  --acw-note-accent: #fb8c00;
}

/* 顶边一排小圆齿，像从便签本上撕下来的 */
.acw-note::before {
  content: "";
  position: absolute;
  top: -3px;
  right: 4px;
  left: 4px;
  height: 4px;
  background: radial-gradient(circle at 3px 4px, var(--acw-note-bg) 2.6px, transparent 3px) 0 0 / 6px 4px repeat-x;
}

.acw-note-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--acw-note-accent) 14%, transparent);
  color: var(--acw-note-accent);
}

.acw-note-text {
  display: grid;
  gap: 1px;
}

.acw-note-text strong {
  font-weight: 600;
}

.acw-note-text small {
  font-size: 11px;
  opacity: 0.7;
}

/* 被风吹走：向下飘、转一点、淡出 */
.acw-note-leave-active,
.acw-note[data-leaving] {
  animation: acw-note-away 460ms var(--acw-motion-ease-exit) forwards;
}

@keyframes acw-note-blow {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.6, 0.4) rotate(-6deg);
  }

  60% {
    opacity: 1;
    transform: translateY(4px) scale(1.02, 1.04) rotate(2deg);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes acw-note-flutter {
  0%,
  100% {
    transform: rotate(-1.2deg);
  }

  50% {
    transform: translateY(2px) rotate(1.4deg);
  }
}

@keyframes acw-note-away {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate(18px, 26px) rotate(9deg);
  }
}

/* 读屏专用：设置变化与温度上下限只播报，不显示 */
.acw-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* 温度到上下限：小屏抖一下，数字变红，像真遥控器「嘀嘀」报警 */
.acw-lcd[data-alert] {
  animation: acw-lcd-shake 360ms var(--acw-motion-ease-standard);
}

.acw-lcd[data-alert] .acw-lcd-temp {
  color: var(--acw-remote-power);
}

@keyframes acw-lcd-shake {
  20% {
    transform: translateX(-3px);
  }

  40% {
    transform: translateX(3px);
  }

  60% {
    transform: translateX(-2px);
  }

  80% {
    transform: translateX(1px);
  }
}

/* ------------------------------ 减少动效 ------------------------------- */
/* 时长已由 token 缩短；这里关掉循环与位移类动画，只保留短促的淡入淡出 */
@media (prefers-reduced-motion: reduce) {
  .acw-wind-line {
    animation: none;
  }

  .acw-wind-line::before,
  .acw-wind-line::after {
    height: 100%;
    transform: none;
    animation: none;
  }

  .acw-temperature[data-dir],
  .acw-mode-icon[data-animate] {
    animation: none;
  }

  .acw-unit[data-status="on"] .acw-louver {
    transform: translateY(2px);
  }

  .acw-louver,
  .acw-vent::before {
    animation: none;
  }

  /* 雾气静止地挂在出风口下方；不滴水 */
  .acw-mist i {
    opacity: 0.7;
    transform: translateY(10px) scale(1.3);
    animation: none;
  }

  .acw-unit[data-drip="on"] .acw-drip {
    animation: none;
  }

  .acw-button:active {
    transform: none;
  }

  .acw-unit {
    transform: none;
  }

  .acw-unit[data-status="on"] .acw-selftest,
  .acw-unit[data-status="on"] .acw-readout {
    animation: none;
  }

  /* 小纸条只淡入淡出，不飘不摆；小屏不抖，只变色 */
  .acw-note {
    animation: acw-note-fade var(--acw-motion-duration-base) var(--acw-motion-ease-enter) both;
  }

  .acw-note-leave-active,
  .acw-note[data-leaving] {
    animation: acw-note-fade var(--acw-motion-duration-fast) var(--acw-motion-ease-exit) reverse forwards;
  }

  .acw-lcd[data-alert] {
    animation: none;
  }
}

@keyframes acw-note-fade {
  from {
    opacity: 0;
  }
}

.acw-dock, .acw-remote-panel {
  display: contents;
}

.acw-remote-toggle[hidden], .acw-remote-panel[hidden] {
  display: none;
}

:host([data-ac-placement="top-left"]),
:host([data-ac-placement="top-right"]) {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  width: min(320px, calc(100vw - 32px));
  z-index: var(--acw-floating-z-index, 1000);
  pointer-events: none;
}

:host([data-ac-placement="top-left"]) {
  left: max(16px, env(safe-area-inset-left));
}

:host([data-ac-placement="top-right"]) {
  right: max(16px, env(safe-area-inset-right));
}

/* A filter on the root would make the fixed dock follow the unit, not the viewport. */
:host([data-ac-placement^="top-"]) .acw-root {
  filter: none;
}

:host([data-ac-placement^="top-"]) .acw-shell {
  /* Only the visible housing is interactive; airflow must not cover the page. */
  pointer-events: auto;
}

:host([data-ac-placement^="top-"]) .acw-dock {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 8px;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

:host([data-ac-placement="top-left"]) .acw-dock {
  left: max(16px, env(safe-area-inset-left));
  align-items: flex-start;
}

:host([data-ac-placement="top-right"]) .acw-dock {
  right: max(16px, env(safe-area-inset-right));
}

:host([data-ac-placement^="top-"]) .acw-remote-panel:not([hidden]) {
  pointer-events: auto;
  display: block;
  max-height: calc(100vh - 96px);
  max-height: calc(100dvh - 96px);
  overflow: auto;
  padding: 8px;
}

:host([data-ac-placement^="top-"]) .acw-remote {
  margin: 0;
}

.acw-remote-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: auto;
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--acw-border-color);
  border-radius: 24px;
  background: #fff;
  color: #141414;
  box-shadow: 0 2px 12px #0002;
  font: inherit;
  cursor: pointer;
}

.acw-remote-toggle:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 3px;
}

@media (prefers-color-scheme: dark) {
  .acw-remote-toggle {
    background: #252a31;
    color: #fafafa;
  }
}
</style>
  <div class="acw-root">
    ${t}
    <div class="acw-unit">
      <div class="acw-shell">
        ${e.showEnergyLabel?me():``}
        <div class="acw-display" aria-live="polite">
          <div class="acw-display-mode"><span class="acw-mode-icon"></span></div>
          <div class="acw-display-temp">
            <span class="acw-readout"><span class="acw-digit acw-temperature"></span><small class="acw-digit">°C</small></span>
            <span class="acw-digit acw-selftest" aria-hidden="true">88</span>
          </div>
        </div>
        ${n}
        <div class="acw-outlet"></div>
        <div class="acw-vent" aria-hidden="true"></div>
        <div class="acw-louver" aria-hidden="true"></div>
        <div class="acw-mist" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="acw-drip" aria-hidden="true"></span>
        <span class="acw-led"></span>
      </div>
      <div class="acw-wind">
        <span class="acw-wind-line"></span><span class="acw-wind-line"></span><span class="acw-wind-line"></span>
      </div>
    </div>
    <div class="acw-notification-region" role="status"><span class="acw-sr-only"></span></div>
    <div class="acw-dock">
    <button type="button" class="acw-remote-toggle" aria-expanded="false" aria-controls="acw-remote-panel" hidden><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M9 6h6M9 10h6M9 14h2m2 0h2m-6 4h2m2 0h2"/></svg><span class="acw-toggle-label">打开遥控器</span></button>
    <div class="acw-remote-panel" id="acw-remote-panel">
    <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div class="acw-lcd" role="img">
        <div class="acw-lcd-main">
          <span class="acw-lcd-mode-slot"></span>
          <span class="acw-lcd-temp acw-digit"></span>
        </div>
        <div class="acw-lcd-status" aria-hidden="true">
          <span class="acw-lcd-wind"><i></i><i></i><i></i><b>自动</b></span>
          ${Z(`swing`,14,`acw-lcd-swing`)}
          <span class="acw-lcd-sound-slot"></span>
        </div>
      </div>
      <button type="button" class="acw-button acw-button-power" aria-label="power" data-action="toggleStatus">${Z(`power`,24)}</button>
      <div class="acw-remote-temp">
        <button type="button" class="acw-button acw-button-temp" aria-label="add" title="温度 +（长按连续调）" data-repeat="increment">${Z(`plus`,28)}</button>
        <button type="button" class="acw-button acw-button-temp" aria-label="reduce" title="温度 −（长按连续调）" data-repeat="decrement">${Z(`minus`,28)}</button>
      </div>
      <div class="acw-remote-row">
        <div class="acw-remote-mode" role="group" aria-label="mode">
          <button type="button" class="acw-button acw-button-cold" aria-label="cold" title="${a.cold}" data-action="cold">${Z(`cold`,18)}</button>
          <button type="button" class="acw-button acw-button-hot" aria-label="hot" title="${a.hot}" data-action="hot">${Z(`hot`,18)}</button>
        </div>
        <button type="button" class="acw-button acw-button-fan" aria-label="fan" data-action="cycleFan">${Z(`fan`,20)}</button>
        <button type="button" class="acw-button acw-button-swing" aria-label="swing" data-action="toggleSwing">${Z(`swing`,20)}</button>
        <button type="button" class="acw-button acw-button-sound" aria-label="sound" data-action="cycleSound"></button>
      </div>
    </div>
    </div>
    </div>
  </div>
`}function ge(e,t,n){let r=e.cloneNode(!1);r.textContent=t,r.setAttribute(...n),e.replaceWith(r)}function _e(t,n,r){let i=n.status?`on`:`off`;for(let e of t.querySelectorAll(`.acw-root, .acw-unit`))e.dataset.mode=n.mode,e.dataset.status=i,e.dataset.swing=n.swing?`on`:`off`,e.dataset.fan=n.fan??`auto`;let a=t.querySelector(`.acw-mode-icon`);r?r.mode!==n.mode&&ge(a,e[n.mode],[`data-animate`,``]):a.textContent=e[n.mode];let o=t.querySelector(`.acw-temperature`);r?r.temperature!==n.temperature&&ge(o,String(n.temperature),[`data-dir`,n.temperature>r.temperature?`up`:`down`]):o.textContent=String(n.temperature);let s=t.querySelector(`.acw-unit`),c=T(n);s.dataset.drip=c.drip,s.style.setProperty(`--acw-mist`,String(c.mist)),c.dripCycle?s.style.setProperty(`--acw-drip-cycle`,c.dripCycle):s.style.removeProperty(`--acw-drip-cycle`),t.querySelector(`.acw-led`).setAttribute(`aria-label`,i),t.querySelector(`.acw-wind`).setAttribute(`aria-hidden`,n.status?`false`:`true`),ve(t,n,r)}function ve(e,t,n){let r=le(t),i=e.querySelector(`.acw-lcd`);i.setAttribute(`aria-label`,r.display),i.dataset.status=t.status?`on`:`off`,i.dataset.mode=t.mode,i.dataset.swing=t.swing?`on`:`off`,i.dataset.fan=t.fan??`auto`,e.querySelector(`.acw-lcd-temp`).innerHTML=`${t.temperature}<small>°C</small>`;let a=e.querySelector(`.acw-button-power`);if(a.classList.toggle(`acw-button-on`,t.status),a.setAttribute(`aria-pressed`,String(t.status)),a.title=r.power,n?.mode!==t.mode){e.querySelector(`.acw-lcd-mode-slot`).innerHTML=Z(t.mode,22,`acw-lcd-mode`);for(let n of[`cold`,`hot`])e.querySelector(`.acw-button-${n}`).setAttribute(`aria-pressed`,String(t.mode===n))}if(n?.fan!==t.fan){let n=e.querySelector(`.acw-button-fan`);n.dataset.fan=t.fan??`auto`,n.title=r.fan}if(n?.swing!==t.swing){let n=e.querySelector(`.acw-button-swing`);n.setAttribute(`aria-pressed`,String(t.swing)),n.title=r.swing}if(n?.sound!==t.sound){let n=e.querySelector(`.acw-button-sound`);n.dataset.sound=t.sound,n.title=r.sound,n.innerHTML=Z(W[t.sound],20),e.querySelector(`.acw-lcd-sound-slot`).innerHTML=Z(W[t.sound],14,`acw-lcd-sound`),e.querySelector(`.acw-lcd-sound`).setAttribute(`data-sound`,t.sound)}}function ye(e,t,n,r){if(n===`skip`)return;if(n===`shake`&&be(e),n!==`note`){e.querySelector(`.acw-notification-region .acw-sr-only`).textContent=t.message;return}let i=e.querySelector(`.acw-notification-region`);i.querySelector(`.acw-note`)?.remove();let a=document.createElement(`div`);a.className=`acw-note`,a.dataset.severity=t.severity,a.dataset.mode=r.mode,a.innerHTML=`<span class="acw-note-icon" aria-hidden="true">${Z(`leaf`,14)}</span><span class="acw-note-text"><strong></strong>${t.detail?`<small></small>`:``}</span>`,a.querySelector(`strong`).textContent=t.message,t.detail&&(a.querySelector(`small`).textContent=t.detail),i.prepend(a),setTimeout(()=>{a.dataset.leaving=``,setTimeout(()=>a.remove(),460)},3600)}function be(e){let t=e.querySelector(`.acw-lcd`);t.removeAttribute(`data-alert`),t.offsetWidth,t.setAttribute(`data-alert`,``),setTimeout(()=>t.removeAttribute(`data-alert`),400)}function xe(e,t){return e===null?t:e!==`false`}function Se(e){if(e===null)return;let t=Number(e);return Number.isFinite(t)?t:void 0}function Ce(e){return e===`cold`||e===`hot`?e:void 0}function we(e){return p(e)?e:void 0}function Te(e){return d(e)?e:void 0}function Ee(e,t){let n={...t,mode:Ce(e.getAttribute(`mode`))??t?.mode,status:xe(e.getAttribute(`status`),t?.status),temperature:Se(e.getAttribute(`temperature`))??t?.temperature,sound:we(e.getAttribute(`sound`))??t?.sound,swing:xe(e.getAttribute(`swing`),t?.swing),fan:Te(e.getAttribute(`fan`))??t?.fan};for(let e of Object.keys(n))n[e]===void 0&&delete n[e];return n}function De(e={}){let t=e.tagName??J,n=customElements.get(t);if(n)return n;class i extends HTMLElement{constructor(...e){super(...e),q(this,`store`,void 0),q(this,`unsubscribe`,void 0),q(this,`renderedState`,void 0),q(this,`stopObservers`,[]),q(this,`audio`,void 0),q(this,`present`,F()),q(this,`placement`,void 0),q(this,`onDrip`,e=>{e.target?.classList.contains(`acw-drip`)&&this.audio?.drip()}),q(this,`onWarm`,()=>{let e=this.store?.getState();this.ensureAudio(e?.sound,e?.fan??`auto`)?.unlock()}),q(this,`onClick`,e=>{if(e.target?.closest(`.acw-remote-toggle`)){let e=this.shadowRoot?.querySelector(`.acw-remote-panel`);e&&this.setRemoteOpen(!!e.hidden);return}let t=(e.target?.closest(`[data-action]`))?.dataset.action;t&&this.store&&(t===`cold`||t===`hot`?this.store.dispatch({type:`mode`,mode:t,powerOn:!0}):t===`toggleStatus`?this.store.dispatch({type:`toggleStatus`}):(t===`cycleSound`||t===`toggleSwing`||t===`cycleFan`)&&this.store.dispatch({type:t}))}),q(this,`onKeyDown`,e=>{let t=e;if(t.key!==`Escape`||this.placement===`inline`)return;let n=this.shadowRoot?.querySelector(`.acw-remote-panel`);n&&!n.hidden&&(t.preventDefault(),t.stopPropagation(),this.setRemoteOpen(!1),this.shadowRoot?.querySelector(`.acw-remote-toggle`)?.focus())})}static get observedAttributes(){return[`mode`,`status`,`temperature`,`sound`,`swing`,`fan`,`placement`]}connectedCallback(){let t=e.assetsBaseUrl??`/assets`,n=e.enableAudio??!0;pe(t),this.shadowRoot||(this.attachShadow({mode:`open`}).innerHTML=he({title:this.getAttribute(`title`)??e.title,logoUrl:e.logoUrl??`/yun-logo.svg`,logoHref:e.logoHref??`https://github.com/YunYouJun/air-conditioner`,showEnergyLabel:e.showEnergyLabel??!0,audio:n?g(`${t}/audio`,e.audioExt??`m4a`):void 0})),this.store=H({...e,storageKey:this.getAttribute(`storage-key`)??e.storageKey,initialState:Ee(this,e.initialState),onNotify:(t,n)=>{this.shadowRoot&&ye(this.shadowRoot,t,this.present(t,n.state),n.state),this.dispatchEvent(new CustomEvent(`ac-notify`,{detail:{notification:t,event:n},bubbles:!0,composed:!0})),e.onNotify?.(t,n)}}),this.unsubscribe=this.store.subscribe(e=>{this.render(),this.playAudio(e),this.dispatchEvent(new CustomEvent(`ac-change`,{detail:e,bubbles:!0,composed:!0}))}),this.shadowRoot?.addEventListener(`pointerdown`,this.onWarm,!0),this.shadowRoot?.addEventListener(`keydown`,this.onWarm,!0),this.shadowRoot?.addEventListener(`click`,this.onClick),this.shadowRoot?.addEventListener(`keydown`,this.onKeyDown),this.shadowRoot?.addEventListener(`animationiteration`,this.onDrip);let r=this.store.getState();this.ensureAudio(r.sound,r.fan??`auto`),this.updatePlacement(),this.renderedState=void 0,this.render(),this.stopObservers.forEach(e=>e()),this.stopObservers=[];let i=this.shadowRoot?.querySelector(`.acw-unit`);i&&this.stopObservers.push(O(i,E.compact.width,e=>{i.style.setProperty(`--acw-scale`,String(e))}),se(i,(e,t)=>{i.style.setProperty(`--acw-tilt-x`,`${e}deg`),i.style.setProperty(`--acw-tilt-y`,`${t}deg`)}));let a=()=>this.store?.getState().temperature;for(let e of this.shadowRoot?.querySelectorAll(`[data-repeat]`)??[]){let t=e.dataset.repeat===`increment`?`increment`:`decrement`;this.stopObservers.push(k(e,()=>this.store?.dispatch({type:t}),{value:a}))}}disconnectedCallback(){this.unsubscribe?.(),this.audio?.dispose(),this.audio=void 0,this.stopObservers.forEach(e=>e()),this.stopObservers=[],this.shadowRoot?.removeEventListener(`pointerdown`,this.onWarm,!0),this.shadowRoot?.removeEventListener(`keydown`,this.onWarm,!0),this.shadowRoot?.removeEventListener(`click`,this.onClick),this.shadowRoot?.removeEventListener(`keydown`,this.onKeyDown),this.shadowRoot?.removeEventListener(`animationiteration`,this.onDrip)}attributeChangedCallback(e){e===`placement`?this.updatePlacement():this.store&&this.store.dispatch({type:`update`,payload:Ee(this,this.store.getState())})}updatePlacement(){if(!this.shadowRoot)return;let t=this.getAttribute(`placement`)??e.placement,n=t===`top-left`||t===`top-right`?t:`inline`,r=this.placement&&this.placement!==`inline`;this.placement=n,this.dataset.acPlacement=n;let i=this.shadowRoot.querySelector(`.acw-remote-toggle`),a=n===`inline`&&this.shadowRoot.activeElement===i;i.hidden=n===`inline`,(n===`inline`||!r)&&this.setRemoteOpen(n===`inline`),a&&this.shadowRoot.querySelector(`.acw-button-power`)?.focus()}setRemoteOpen(e){let t=this.shadowRoot?.querySelector(`.acw-remote-panel`),n=this.shadowRoot?.querySelector(`.acw-remote-toggle`);if(!t||!n)return;!e&&this.shadowRoot?.activeElement&&t.contains(this.shadowRoot.activeElement)&&n.focus(),t.hidden=!e,n.setAttribute(`aria-expanded`,String(e));let r=n.querySelector(`.acw-toggle-label`);r&&(r.textContent=e?`收起遥控器`:`打开遥控器`)}ensureAudio(e,t){let n=this.shadowRoot;if(n?.querySelector(`audio`))return this.audio||(this.audio=b({beep:n.querySelector(`[data-audio="beep"]`),start:n.querySelector(`[data-audio="start"]`),work:n.querySelector(`[data-audio="work"]`)},{soundMode:e,fanSpeed:t})),this.audio}playAudio(e){let t=this.ensureAudio(e.state.sound,e.state.fan??`auto`);t&&(e.previousState.sound!==e.state.sound&&t.setSoundMode(e.state.sound),e.previousState.fan!==e.state.fan&&t.setFanSpeed(e.state.fan??`auto`),t.beep(),e.previousState.status!==e.state.status&&t.toggleStatusAudio(e.previousState.status))}render(){let e=this.store?.getState()??r;this.shadowRoot&&_e(this.shadowRoot,e,this.renderedState),this.renderedState=e}}return customElements.define(t,i),i}function Oe(e,t={}){let{placement:n,...r}=t,i=t.tagName??J;De(r);let a=typeof e==`string`?document.querySelector(e):e;if(!a)throw Error(`Unable to find target: ${String(e)}`);if(a.localName===i)return n&&a.setAttribute(`placement`,n),a;let o=document.createElement(i);return t.storageKey&&o.setAttribute(`storage-key`,t.storageKey),t.title&&o.setAttribute(`title`,t.title),n&&o.setAttribute(`placement`,n),a.appendChild(o),o}let $=document.currentScript;if($?.src){let e=new URL(`./assets`,$.src).href,t=$.dataset.placement===`top-left`?`top-left`:`top-right`,n=$.dataset.audio===`true`,r=$.dataset.storageKey||`ac:embed`,i=()=>{document.querySelector(`air-conditioner-embed`)||Oe(document.body,{tagName:`air-conditioner-embed`,placement:t,assetsBaseUrl:e,logoUrl:new URL(`./yun-logo.svg`,$.src).href,enableAudio:n,storageKey:r})};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,i,{once:!0}):i()}})();