// =============================================
//  RENDERER — all drawing functions
// =============================================
import { S } from './state.js';
import { BIRD_SIZE, GROUND_HEIGHT, PIPE_WIDTH, SKINS, STATE, ZONES } from './config.js';
import { ctx, fxCanvas, fxCtx, W, H, canvas } from './canvas.js';
import { getSkinColors } from './game.js';

// ── Gradient cache (invalidated on zone change / resize) ──
let _cachedZone = null;
let _cachedW = 0;
let _cachedH = 0;
let _bgGrad = null;
let _groundGrad = null;

export function invalidateGradientCache() { _cachedZone = null; }

function ensureGradientCache() {
  const z = S.currentZone;
  if (z === _cachedZone && W === _cachedW && H === _cachedH) return;
  _cachedZone = z; _cachedW = W; _cachedH = H;
  // Background
  _bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  _bgGrad.addColorStop(0, z.bg1); _bgGrad.addColorStop(0.4, z.bg2);
  _bgGrad.addColorStop(0.7, z.bg3); _bgGrad.addColorStop(1, z.bg1);
  // Ground
  const gy = H - GROUND_HEIGHT;
  _groundGrad = ctx.createLinearGradient(0, gy, 0, H);
  _groundGrad.addColorStop(0, z.ground); _groundGrad.addColorStop(0.15, z.bg1); _groundGrad.addColorStop(1, '#020008');
}

export function drawShopDrone(cvs, s) {
    const c=cvs.getContext('2d'), W=cvs.width, H=cvs.height, cx=W/2, cy=H/2, t=Date.now()*0.001;
    c.clearRect(0,0,W,H);
    const sk={body:s.body==='rainbow'?'#ff00e6':s.body, glow:s.glow, ring:s.ring, thrust:s.thrust};
    c.save(); c.translate(cx,cy);
    const R=14, rR=18;
    if(s.id==='fire'){
      // Delta fighter
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=10;
      c.beginPath(); c.moveTo(R*1.8,0); c.lineTo(-R*0.8,-R*1.7); c.lineTo(-R*0.6,0); c.lineTo(-R*0.8,R*1.7); c.closePath(); c.fill();
      c.strokeStyle=sk.glow; c.lineWidth=1.5; c.globalAlpha=0.7;
      c.beginPath(); c.moveTo(R*1.6,0); c.lineTo(-R*0.8,-R*1.7); c.stroke();
      c.beginPath(); c.moveTo(R*1.6,0); c.lineTo(-R*0.8,R*1.7); c.stroke();
      c.fillStyle='#111'; c.globalAlpha=0.8;
      c.beginPath(); c.moveTo(R*0.6,0); c.lineTo(0,-R*0.3); c.lineTo(-R*0.3,0); c.lineTo(0,R*0.3); c.closePath(); c.fill();
      c.fillStyle=sk.glow; c.globalAlpha=0.5;
      c.beginPath(); c.moveTo(R*0.6,0); c.lineTo(0,-R*0.3); c.lineTo(-R*0.3,0); c.lineTo(0,R*0.3); c.closePath(); c.fill();
      // Weapon pods
      for(const side of[-1,1]){c.fillStyle=sk.ring; c.globalAlpha=0.8; c.beginPath(); c.arc(-R*0.2,side*R*1,2.5,0,Math.PI*2); c.fill();}
      // Afterburner glow
      c.fillStyle=sk.thrust; c.globalAlpha=0.6;
      c.beginPath(); c.moveTo(-R*0.7,-4); c.lineTo(-R*1.6,-6); c.lineTo(-R*1.6,6); c.lineTo(-R*0.7,4); c.closePath(); c.fill();
    } else if(s.id==='toxic'){
      // Organic blob + tentacles
      const breathe=1+Math.sin(t*4)*0.08;
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=12;
      c.beginPath();
      for(let a=0;a<Math.PI*2;a+=0.1){const w=1+Math.sin(a*3+t*5)*0.15; c.lineTo(Math.cos(a)*R*1.2*breathe*w,Math.sin(a)*R*1.2*breathe*w);}
      c.closePath(); c.fill();
      // Tentacles
      c.strokeStyle=sk.body; c.lineWidth=2; c.lineCap='round';
      for(let i=0;i<5;i++){const ta=Math.PI*0.4+i*Math.PI*0.25; c.globalAlpha=0.7;
        c.beginPath(); let tx=Math.cos(ta)*R*1.1,ty=Math.sin(ta)*R*1.1; c.moveTo(tx,ty);
        for(let j=1;j<=4;j++){tx+=Math.cos(ta+Math.sin(t*3+i+j)*0.8)*4;ty+=Math.sin(ta+Math.sin(t*2+i-j)*0.6)*4;c.lineTo(tx,ty);}
        c.stroke(); c.fillStyle=sk.glow; c.globalAlpha=0.6; c.beginPath(); c.arc(tx,ty,2,0,Math.PI*2); c.fill();}
      c.lineCap='butt';
      // Eye
      c.fillStyle='#001100'; c.globalAlpha=0.9; c.beginPath(); c.ellipse(R*0.1,0,R*0.35,R*0.25,0,0,Math.PI*2); c.fill();
      c.fillStyle=sk.glow; c.globalAlpha=0.9; c.beginPath(); c.arc(R*0.15,0,R*0.12,0,Math.PI*2); c.fill();
      c.fillStyle='#000'; c.globalAlpha=0.8; c.beginPath(); c.ellipse(R*0.15,0,R*0.03,R*0.09,0,0,Math.PI*2); c.fill();
    } else if(s.id==='sunset'){
      // Sun disk + wings
      const sunG=c.createRadialGradient(0,0,R*0.2,0,0,R*1.1);
      sunG.addColorStop(0,'#fffbe8'); sunG.addColorStop(0.3,'#ffe0a0'); sunG.addColorStop(0.6,sk.body); sunG.addColorStop(1,sk.glow);
      c.fillStyle=sunG; c.shadowColor=sk.glow; c.shadowBlur=15;
      c.beginPath(); c.arc(0,0,R*1.1,0,Math.PI*2); c.fill();
      // Corona spikes
      c.shadowBlur=8;
      for(let i=0;i<12;i++){const ra=t*0.7+i*(Math.PI/6); const rLen=R*(1.5+Math.sin(t*4+i)*0.4);
        c.strokeStyle=i%3===0?'#fff':sk.thrust; c.lineWidth=1.5; c.globalAlpha=0.35;
        c.beginPath(); c.moveTo(Math.cos(ra)*R,Math.sin(ra)*R); c.lineTo(Math.cos(ra)*rLen,Math.sin(ra)*rLen); c.stroke();}
      // Scarab wings
      c.fillStyle=sk.body; c.globalAlpha=0.7;
      for(const side of[-1,1]){c.beginPath(); c.moveTo(R*0.2,side*R*0.15);
        c.quadraticCurveTo(R*0.1,side*R*0.7,-R*0.3,side*R*0.75);
        c.quadraticCurveTo(-R*0.6,side*R*0.6,-R*0.5,side*R*0.15); c.closePath(); c.fill();}
      // Eye of Ra
      c.fillStyle='#fffbe8'; c.globalAlpha=0.9; c.beginPath(); c.arc(0,0,R*0.25,0,Math.PI*2); c.fill();
    } else if(s.id==='purple'){
      // Black hole
      const bhG=c.createRadialGradient(0,0,0,0,0,R*0.7);
      bhG.addColorStop(0,'#000'); bhG.addColorStop(0.6,'#050010'); bhG.addColorStop(1,'#1a0030');
      c.fillStyle=bhG; c.globalAlpha=0.98; c.beginPath(); c.arc(0,0,R*0.7,0,Math.PI*2); c.fill();
      // Photon ring
      c.strokeStyle='#fff'; c.lineWidth=1.5; c.globalAlpha=0.9; c.shadowColor='#fff'; c.shadowBlur=15;
      c.beginPath(); c.arc(0,0,R*0.7,0,Math.PI*2); c.stroke();
      // Accretion disk
      c.save(); c.scale(1,0.35);
      const dG=c.createLinearGradient(-rR,0,rR,0);
      dG.addColorStop(0,sk.thrust); dG.addColorStop(0.3,'#fff'); dG.addColorStop(0.5,sk.glow); dG.addColorStop(0.7,'#fff'); dG.addColorStop(1,sk.thrust);
      c.strokeStyle=dG; c.lineWidth=5; c.globalAlpha=0.6; c.shadowColor=sk.glow; c.shadowBlur=10;
      c.beginPath(); c.arc(0,0,rR,0,Math.PI*2); c.stroke(); c.restore();
      // Polar jets
      for(const pole of[-1,1]){c.strokeStyle=sk.thrust; c.lineWidth=1.5; c.globalAlpha=0.4;
        c.beginPath(); c.moveTo(0,pole*R*0.5); c.lineTo((Math.random()-0.5)*3,pole*R*2.2); c.stroke();}
    } else if(s.id==='golden'){
      // Dreadnought hull
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=15;
      c.beginPath(); c.moveTo(R*1.5,0); c.lineTo(R*0.5,-R*0.5); c.lineTo(-R*0.8,-R*0.55);
      c.lineTo(-R*0.8,R*0.55); c.lineTo(R*0.5,R*0.5); c.closePath(); c.fill();
      c.strokeStyle='#ffd700'; c.lineWidth=1; c.globalAlpha=0.5;
      c.beginPath(); c.moveTo(R*1.5,0); c.lineTo(-R*0.8,0); c.stroke();
      // Crown spikes
      for(let i=0;i<5;i++){const cx2=-R*0.5+i*R*0.35; const ch=R*(0.6+Math.sin(t*5+i)*0.1);
        c.fillStyle='#ffd700'; c.globalAlpha=0.85; c.shadowBlur=5;
        c.beginPath(); c.moveTo(cx2-2.5,-R*0.5); c.lineTo(cx2,-R*0.5-ch); c.lineTo(cx2+2.5,-R*0.5); c.closePath(); c.fill();
        const jewels=['#ff2244','#2288ff','#22ff44','#aa44ff','#ff8822'];
        c.fillStyle=jewels[i]; c.globalAlpha=0.7; c.beginPath(); c.arc(cx2,-R*0.5-ch*0.5,1.5,0,Math.PI*2); c.fill();}
      // Imperial gem
      const gemG=c.createRadialGradient(0,0,1,0,0,R*0.35);
      gemG.addColorStop(0,'#fff'); gemG.addColorStop(0.3,'#ffee88'); gemG.addColorStop(1,sk.glow);
      c.fillStyle=gemG; c.globalAlpha=0.95; c.beginPath();
      for(let i=0;i<8;i++){const ga=i*(Math.PI/4)+t*0.3; c.lineTo(Math.cos(ga)*R*0.35,Math.sin(ga)*R*0.35);}
      c.closePath(); c.fill();
    } else if(s.id==='rainbow'){
      // Rotating hex crystal
      const hue=(Date.now()*0.12)%360;
      c.save(); c.rotate(t*0.9);
      for(let i=0;i<6;i++){const a1=i*(Math.PI*2/6),a2=(i+1)*(Math.PI*2/6); const fhue=(hue+i*60)%360;
        c.fillStyle='hsl('+fhue+',100%,55%)'; c.globalAlpha=0.8; c.shadowColor='hsl('+fhue+',100%,70%)'; c.shadowBlur=8;
        c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a1)*R*1.2,Math.sin(a1)*R*1.2); c.lineTo(Math.cos(a2)*R*1.2,Math.sin(a2)*R*1.2); c.closePath(); c.fill();
        c.strokeStyle='rgba(255,255,255,0.5)'; c.lineWidth=1;
        c.beginPath(); c.moveTo(Math.cos(a1)*R*1.2,Math.sin(a1)*R*1.2); c.lineTo(Math.cos(a2)*R*1.2,Math.sin(a2)*R*1.2); c.stroke();}
      c.restore();
      // Light beams
      for(let i=0;i<6;i++){const ba=t*0.9+i*(Math.PI/3); const bhue=(hue+i*60)%360;
        c.strokeStyle='hsl('+bhue+',100%,65%)'; c.lineWidth=1.5; c.globalAlpha=0.3;
        c.beginPath(); c.moveTo(Math.cos(ba)*R*0.5,Math.sin(ba)*R*0.5); c.lineTo(Math.cos(ba)*R*1.8,Math.sin(ba)*R*1.8); c.stroke();}
      c.fillStyle='#fff'; c.globalAlpha=0.8; c.shadowColor='#fff'; c.shadowBlur=10;
      c.beginPath(); c.arc(0,0,R*0.25,0,Math.PI*2); c.fill();
    } else if(s.id==='ghost'){
      // Phase wraith
      const phase=0.5+Math.sin(t*2)*0.15;
      // Afterimages
      for(let i=3;i>=1;i--){c.globalAlpha=phase*(0.2-i*0.05); c.strokeStyle='rgba(200,200,255,0.3)'; c.lineWidth=1.5;
        c.setLineDash([3,3]); c.beginPath(); c.arc(-i*4,i*1.5,R*(1-i*0.08),0,Math.PI*2); c.stroke(); c.setLineDash([]);}
      // Main body
      c.strokeStyle='rgba(200,200,255,0.7)'; c.lineWidth=2; c.globalAlpha=phase*2; c.shadowColor='rgba(200,200,255,0.5)'; c.shadowBlur=12;
      c.setLineDash([4,3]); c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.stroke(); c.setLineDash([]);
      const ectoG=c.createRadialGradient(0,0,0,0,0,R);
      ectoG.addColorStop(0,'rgba(200,200,255,0.1)'); ectoG.addColorStop(1,'transparent');
      c.fillStyle=ectoG; c.globalAlpha=phase; c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill();
      // Eyes
      c.fillStyle='rgba(200,200,255,0.9)'; c.globalAlpha=phase*2.5; c.shadowBlur=8;
      c.beginPath(); c.arc(-3,-3,2.2,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(5,-3,2.2,0,Math.PI*2); c.fill();
      // Mouth
      c.strokeStyle='rgba(200,200,255,0.5)'; c.lineWidth=1.5; c.beginPath();
      c.bezierCurveTo(-4,4,0,6,6,3); c.stroke();
      // Tendrils
      c.strokeStyle='rgba(200,200,255,0.2)'; c.lineWidth=1.5; c.lineCap='round';
      for(let i=0;i<4;i++){const wa=t*1.3+i*1.5; const wr=rR*(0.4+Math.sin(t*2+i)*0.3);
        c.globalAlpha=phase; c.beginPath(); const wx=Math.cos(wa)*wr,wy=Math.sin(wa)*wr; c.moveTo(wx,wy);
        c.bezierCurveTo(wx+Math.sin(t*5+i)*10,wy+Math.cos(t*4)*10,wx+15,wy+12,wx+Math.sin(t*2+i)*20,wy+Math.cos(t*3+i)*20); c.stroke();}
      c.lineCap='butt';
    } else if(s.id==='matrix'){
      // Wireframe cube
      const S2=R*0.7,cA=Math.cos(t*1.5),sA=Math.sin(t*1.5),cB=Math.cos(t*1.1),sB=Math.sin(t*1.1);
      const verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      const proj=verts.map(function(v){const x=v[0]*S2,y=v[1]*S2,z=v[2]*S2; const x2=x*cA-z*sA,z2=x*sA+z*cA; return [x2*0.6,(y*cB-z2*sB)*0.6];});
      const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      c.strokeStyle=sk.glow; c.lineWidth=1.5; c.shadowColor=sk.glow; c.shadowBlur=10; c.globalAlpha=0.85;
      for(const e of edges){c.beginPath(); c.moveTo(proj[e[0]][0],proj[e[0]][1]); c.lineTo(proj[e[1]][0],proj[e[1]][1]); c.stroke();}
      c.fillStyle=sk.glow;
      for(const p of proj){c.globalAlpha=0.8; c.beginPath(); c.arc(p[0],p[1],1.8,0,Math.PI*2); c.fill();}
      // Matrix chars
      c.font='bold 6px monospace'; c.fillStyle=sk.glow; c.globalAlpha=0.3;
      for(let i=0;i<5;i++){const mx2=(i-2)*6,my2=((t*30+i*12)%40)-20;
        c.fillText(String.fromCharCode(0x30A0+Math.floor(((t*8+i*7)%1)*96)),mx2,my2);}
      // Glitch bar
      if(Math.random()>0.6){c.fillStyle=sk.glow; c.globalAlpha=0.15;
        c.fillRect(-R,(Math.random()-0.5)*R*2,R*2,2);}
      c.shadowBlur=0;
    } else if(s.id==='cerberus'){
      // CERBERUS — triple-headed hellhound
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=15;
      c.beginPath(); c.moveTo(R*0.2,0); c.lineTo(-R*0.1,-R*1.1); c.lineTo(-R*0.9,-R*0.9);
      c.lineTo(-R*0.9,R*0.9); c.lineTo(-R*0.1,R*1.1); c.closePath(); c.fill();
      // 3 heads
      for(let h=0;h<3;h++){
        const hy=(h-1)*R*0.75; const hx=R*0.15+Math.abs(h-1)*0.2*R;
        const jaw=2+Math.sin(t*8+h*2)*2;
        c.fillStyle='#220000'; c.globalAlpha=0.9;
        c.beginPath(); c.ellipse(hx,hy,R*0.4,R*0.25,0,0,Math.PI*2); c.fill();
        // Upper+lower jaw
        c.fillStyle=sk.body; c.globalAlpha=1;
        c.beginPath(); c.moveTo(hx+R*0.38,hy-jaw); c.lineTo(hx+R*0.55,hy-jaw-1); c.lineTo(hx-R*0.05,hy-jaw); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(hx+R*0.38,hy+jaw); c.lineTo(hx+R*0.55,hy+jaw+1); c.lineTo(hx-R*0.05,hy+jaw); c.closePath(); c.fill();
        // Eyes
        c.fillStyle='#ff0000'; c.globalAlpha=0.7+Math.sin(t*10+h)*0.3;
        c.shadowColor='#ff0000'; c.shadowBlur=8;
        c.beginPath(); c.arc(hx,hy-R*0.08,1.8,0,Math.PI*2); c.fill();
        c.beginPath(); c.arc(hx+R*0.15,hy-R*0.08,1.8,0,Math.PI*2); c.fill();
        c.shadowBlur=0;
      }
      // Hellfire particles
      for(let i=0;i<6;i++){const pa=t*3+i*1.05; const pr=R*(0.5+Math.sin(t*4+i)*0.3);
        c.fillStyle=i%2?'#ff2200':'#ffaa00'; c.globalAlpha=0.4;
        c.beginPath(); c.arc(Math.cos(pa)*pr,Math.sin(pa)*pr,1.5,0,Math.PI*2); c.fill();}
    } else if(s.id==='plague'){
      // PLAGUE — biohazard blob
      const rot=1+Math.sin(t*2.5)*0.1;
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=12;
      c.beginPath();
      for(let a=0;a<Math.PI*2;a+=0.1){const w=1+Math.sin(a*2+t*3)*0.2+Math.sin(a*5-t*4)*0.12;
        const r2=R*1.2*rot*w; a<0.01?c.moveTo(Math.cos(a)*r2,Math.sin(a)*r2):c.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);}
      c.closePath(); c.fill();
      // Pustules
      for(let i=0;i<5;i++){const pa=i*Math.PI*2/5+t*0.3; const pd=R*(0.5+Math.sin(t*2+i)*0.2);
        c.fillStyle='#889900'; c.globalAlpha=0.7;
        c.beginPath(); c.arc(Math.cos(pa)*pd,Math.sin(pa)*pd,2.5+Math.sin(t*4+i),0,Math.PI*2); c.fill();
        c.fillStyle='#ccff44'; c.globalAlpha=0.5;
        c.beginPath(); c.arc(Math.cos(pa)*pd-0.5,Math.sin(pa)*pd-0.5,1,0,Math.PI*2); c.fill();}
      // Biohazard symbol
      c.save(); c.rotate(t*0.5); c.strokeStyle='#ffcc00'; c.lineWidth=1.5; c.globalAlpha=0.35;
      for(let i=0;i<3;i++){const ba=i*Math.PI*2/3;
        c.beginPath(); c.arc(Math.cos(ba)*4,Math.sin(ba)*4,R*0.35,ba-0.8,ba+0.8); c.stroke();}
      c.beginPath(); c.arc(0,0,R*0.15,0,Math.PI*2); c.stroke(); c.restore();
      // Flies
      for(let i=0;i<4;i++){const fa=t*6+i*1.57; const fd=R*(0.8+Math.sin(t*4+i)*0.4);
        c.fillStyle='#222'; c.globalAlpha=0.6;
        c.beginPath(); c.arc(Math.cos(fa)*fd,Math.sin(fa)*fd,1,0,Math.PI*2); c.fill();}
    } else if(s.id==='kraken'){
      // KRAKEN — massive head + tentacles
      const breathe=1+Math.sin(t*3)*0.06;
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=15;
      c.beginPath(); c.ellipse(0,0,R*0.9*breathe,R*1.1*breathe,0,0,Math.PI*2); c.fill();
      // 8 tentacles
      c.shadowBlur=0;
      for(let i=0;i<8;i++){const ta=Math.PI*0.3+i*Math.PI*0.2125;
        c.strokeStyle=i%2?sk.body:'#003344'; c.lineCap='round'; c.globalAlpha=0.85;
        c.beginPath(); let tx=Math.cos(ta)*R*0.9,ty=Math.sin(ta)*R*0.9; c.moveTo(tx,ty);
        for(let j=1;j<=5;j++){tx+=Math.cos(ta+Math.sin(t*2.5+i+j*0.6)*1.2)*4;
          ty+=Math.sin(ta+Math.sin(t*1.8+i-j*0.5)*0.9)*4; c.lineWidth=3-j*0.4; c.lineTo(tx,ty);}
        c.stroke(); c.fillStyle=sk.glow; c.globalAlpha=0.5;
        c.beginPath(); c.arc(tx,ty,1.5,0,Math.PI*2); c.fill();}
      c.lineCap='butt';
      // Eye
      c.fillStyle='#001111'; c.globalAlpha=0.95;
      c.beginPath(); c.ellipse(R*0.1,0,R*0.4,R*0.3,0,0,Math.PI*2); c.fill();
      c.fillStyle=sk.glow; c.globalAlpha=0.95;
      c.beginPath(); c.arc(R*0.15+Math.sin(t*1.3)*2,Math.sin(t*1.1),R*0.2,0,Math.PI*2); c.fill();
      c.fillStyle='#000'; c.globalAlpha=0.9;
      c.beginPath(); c.ellipse(R*0.15+Math.sin(t*1.3)*2,Math.sin(t*1.1),R*0.13,R*0.03,0,0,Math.PI*2); c.fill();
    } else if(s.id==='banshee'){
      // BANSHEE — screaming wraith
      const phase=0.6+Math.sin(t*3)*0.2; const flick=Math.random()>0.9?0.15:1;
      // Tattered cloak
      c.fillStyle='rgba(220,220,255,0.08)'; c.shadowColor='rgba(200,200,255,0.6)'; c.shadowBlur=18;
      c.beginPath(); c.moveTo(R*0.5,0);
      c.bezierCurveTo(R*0.3,-R*1.2,-R*0.5,-R*1.3,-R*0.8,-R*0.8);
      c.lineTo(-R*0.9,0); c.lineTo(-R*0.8,R*0.8);
      c.bezierCurveTo(-R*0.5,R*1.3,R*0.3,R*1.2,R*0.5,0);
      c.closePath(); c.fill(); c.shadowBlur=0;
      // Screaming mouth
      c.fillStyle='#000'; c.globalAlpha=0.8*flick;
      c.beginPath(); c.ellipse(R*0.05,2,R*0.25,4+Math.sin(t*6)*2,0,0,Math.PI*2); c.fill();
      // Hollow eyes
      for(const side of[-1,1]){const ex=R*0.02+side*5,ey=-4;
        c.fillStyle='#000'; c.globalAlpha=0.85*flick;
        c.beginPath(); c.ellipse(ex,ey,3,4,0,0,Math.PI*2); c.fill();
        c.fillStyle='#ccccff'; c.globalAlpha=(0.5+Math.sin(t*8+side*2)*0.4)*flick;
        c.shadowColor='#ccccff'; c.shadowBlur=8;
        c.beginPath(); c.arc(ex,ey,1.5,0,Math.PI*2); c.fill(); c.shadowBlur=0;}
      // Sonic rings
      for(let i=0;i<3;i++){const sr=((t*15+i*8)%30);
        c.strokeStyle='rgba(200,200,255,0.15)'; c.lineWidth=1; c.globalAlpha=(1-sr/30)*0.3*flick;
        c.beginPath(); c.arc(R*0.5+sr,2,sr*0.4+2,Math.PI*-0.3,Math.PI*0.3); c.stroke();}
    } else if(s.id==='abyssal'){
      // ABYSSAL — void demon
      c.fillStyle=sk.body; c.shadowColor=sk.glow; c.shadowBlur=20;
      c.beginPath(); c.moveTo(R*0.8,0);
      c.lineTo(R*0.2,-R*0.6); c.lineTo(-R*0.4,-R*0.8); c.lineTo(-R*0.8,-R*0.5);
      c.lineTo(-R*0.8,R*0.5); c.lineTo(-R*0.4,R*0.8); c.lineTo(R*0.2,R*0.6);
      c.closePath(); c.fill();
      // Energy veins
      c.strokeStyle='#ff0033'; c.lineWidth=1; c.globalAlpha=0.5;
      for(let i=0;i<5;i++){const va=i*Math.PI*2/5+t*0.2;
        c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(va)*R*0.9,Math.sin(va)*R*0.9); c.stroke();}
      c.shadowBlur=0;
      // Horns
      for(const side of[-1,1]){c.fillStyle='#220000'; c.globalAlpha=0.95;
        c.beginPath(); c.moveTo(-R*0.15,side*R*0.5);
        c.quadraticCurveTo(-R*0.5,side*R*1.5,-R*0.85,side*R*1.2);
        c.quadraticCurveTo(-R*0.7,side*R*0.8,-R*0.3,side*R*0.5); c.closePath(); c.fill();
        c.fillStyle=sk.glow; c.globalAlpha=0.5+Math.sin(t*5+side)*0.3;
        c.shadowColor=sk.glow; c.shadowBlur=6;
        c.beginPath(); c.arc(-R*0.85,side*R*1.2,2,0,Math.PI*2); c.fill(); c.shadowBlur=0;}
      // Eyes
      for(const side of[-1,1]){const ex=R*0.15,ey=side*R*0.2;
        c.fillStyle='#000'; c.globalAlpha=0.9;
        c.beginPath(); c.ellipse(ex,ey,4,2.5,side*0.2,0,0,Math.PI*2); c.fill();
        c.fillStyle='#ff0033'; c.globalAlpha=0.9; c.shadowColor='#ff0033'; c.shadowBlur=12;
        c.beginPath(); c.arc(ex,ey,2,0,Math.PI*2); c.fill(); c.shadowBlur=0;}
      // Pentagram
      c.save(); c.rotate(t*0.7); c.strokeStyle='#ff0033'; c.lineWidth=0.8; c.globalAlpha=0.25;
      const pR=R*0.5;
      for(let i=0;i<5;i++){const pa=i*Math.PI*2/5-Math.PI/2; const na=((i+2)%5)*Math.PI*2/5-Math.PI/2;
        c.beginPath(); c.moveTo(Math.cos(pa)*pR,Math.sin(pa)*pR); c.lineTo(Math.cos(na)*pR,Math.sin(na)*pR); c.stroke();}
      c.beginPath(); c.arc(0,0,pR,0,Math.PI*2); c.stroke(); c.restore();
      // Dark core
      const dG=c.createRadialGradient(0,0,0,0,0,R*0.35);
      dG.addColorStop(0,'#ff0033'); dG.addColorStop(0.4,'#440011'); dG.addColorStop(1,'#000');
      c.fillStyle=dG; c.globalAlpha=0.8; c.beginPath(); c.arc(0,0,R*0.35,0,Math.PI*2); c.fill();
    } else {
      // Classic neon drone
      c.shadowColor=sk.glow; c.shadowBlur=12;
      // Hex ring
      c.strokeStyle=sk.ring; c.lineWidth=1.8; c.globalAlpha=1;
      for(let i=0;i<6;i++){const sA2=t*1.8+i*(Math.PI/3); c.beginPath(); c.arc(0,0,rR,sA2+0.1,sA2+Math.PI/3-0.1); c.stroke();}
      // Core orb
      const orbG=c.createRadialGradient(-1,-2,1,0,0,R);
      orbG.addColorStop(0,'rgba(255,255,255,0.9)'); orbG.addColorStop(0.3,sk.body); orbG.addColorStop(0.7,sk.glow); orbG.addColorStop(1,'rgba(0,0,0,0.3)');
      c.fillStyle=orbG; c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill();
      // Chevron
      c.strokeStyle=sk.glow; c.lineWidth=1.8; c.globalAlpha=0.8;
      c.beginPath(); c.moveTo(R*0.8,-4); c.lineTo(R*1.2,0); c.lineTo(R*0.8,4); c.stroke();
      // Sensor pods  
      for(let i=0;i<4;i++){const pa=t*0.7+i*Math.PI*0.5; c.fillStyle=sk.glow; c.globalAlpha=0.8;
        c.beginPath(); c.arc(Math.cos(pa)*rR,Math.sin(pa)*rR,2,0,Math.PI*2); c.fill();}
    }
    c.restore();
  }

export function drawBackground() {
    ensureGradientCache();
    const z=S.currentZone;
    ctx.fillStyle=_bgGrad; ctx.fillRect(0,0,W,H);
    // Stars
    for(const s of S.starParticles) {
      ctx.globalAlpha=0.3+Math.sin(s.flicker)*0.3; ctx.fillStyle="#fff";
      ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    // === FAR LAYER: Nebula clouds (simplified — flat circles, no radial gradients) ===
    const nebulaT=Date.now()*0.0001;
    for(let i=0;i<4;i++) {
      const nx=(nebulaT*20+i*W*0.4)%(W*1.5)-W*0.25;
      const ny=H*0.2+Math.sin(nebulaT+i*2)*H*0.15;
      const nr=80+i*35;
      ctx.globalAlpha=0.035;
      ctx.fillStyle=z.accent;
      ctx.beginPath(); ctx.arc(nx,ny,nr,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    // === MID LAYER: Industrial structures (parallax 0.3x) ===
    const midOff=S.state===STATE.PLAYING?S.groundX*0.3:Date.now()*0.005;
    ctx.globalAlpha=0.15;
    for(let i=0;i<5;i++) {
      const sx=((midOff+i*W*0.28)%(W*1.4))-W*0.2;
      const sBaseY=H-GROUND_HEIGHT-30;
      const tw=8+(i%3)*4, th=60+(i%4)*40;
      ctx.fillStyle=z.bg3; ctx.fillRect(sx,sBaseY-th,tw,th);
      ctx.strokeStyle=z.accent; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sx+tw/2,sBaseY-th); ctx.lineTo(sx+tw/2,sBaseY-th-15); ctx.stroke();
      if(Math.sin(Date.now()*0.003+i*1.5)>0.5) {
        ctx.fillStyle=z.accent;
        ctx.beginPath(); ctx.arc(sx+tw/2,sBaseY-th-15,2,0,Math.PI*2); ctx.fill();
      }
      ctx.strokeStyle=z.bg2;
      for(let by=sBaseY-th+15;by<sBaseY;by+=20) {
        ctx.beginPath(); ctx.moveTo(sx,by); ctx.lineTo(sx+tw,by+10); ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
    // === NEAR LAYER: City skyline (parallax 0.6x) ===
    const cityOff=S.state===STATE.PLAYING?S.groundX*0.6:Date.now()*0.008;
    const cityY=H-GROUND_HEIGHT-50;
    for(let x=0;x<W+30;x+=25+Math.sin(x*0.08)*15) {
      const bx=((x+cityOff)%(W+60))-30;
      const h=15+Math.abs(Math.sin(x*0.04))*55;
      const by=cityY+50-h;
      ctx.fillStyle="rgba(10,10,35,0.8)";
      ctx.fillRect(bx,by,16+Math.sin(x)*6,h);
      ctx.fillStyle="rgba(0,200,255,0.15)";
      for(let wy=by+4;wy<by+h-6;wy+=8) {
        if(Math.sin(x*3+wy*2)>0.3) ctx.fillRect(bx+3,wy,4,3);
        if(Math.sin(x*5+wy)>0.4) ctx.fillRect(bx+9,wy,4,3);
      }
    }
    // Floating hologram rings
    ctx.strokeStyle=z.accent; ctx.lineWidth=1;
    const holoOff=Date.now()*0.008;
    for(let i=0;i<3;i++) {
      const hx=(holoOff*25+i*W/3)%W, hy=H*0.25+Math.sin(holoOff*0.5+i)*40;
      ctx.globalAlpha=0.025+Math.sin(holoOff+i*2)*0.01;
      ctx.beginPath(); ctx.ellipse(hx,hy,30+i*8,8+i*3,0.2+Math.sin(holoOff*0.3+i)*0.3,0,Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha=1;
    // === DATA STREAM LINES (flat color, no per-line gradient) ===
    const dsOff=Date.now()*0.05;
    ctx.strokeStyle=z.accent; ctx.lineWidth=1;
    for(let i=0;i<6;i++) {
      const dy=H*0.15+i*H*0.12, dx=(dsOff+i*200)%(W+300)-150, dLen=40+i*15;
      ctx.globalAlpha=0.06;
      ctx.beginPath(); ctx.moveTo(dx,dy); ctx.lineTo(dx+dLen,dy); ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

export function drawPipe(p) {
    const topH=p.topH, botY=topH+p.gap;
    const z=S.currentZone;
    const PANEL_W=56;
    const px=p.x-(PANEL_W-PIPE_WIDTH)/2; // center visual around hitbox
    const cx=px+PANEL_W/2; // center x
    const beamFlicker=0.7+Math.sin(Date.now()/80+p.x)*0.3;
    // === TOP WALL PANEL (flat color, no gradient) ===
    ctx.fillStyle='#0e1a2a'; ctx.fillRect(px,0,PANEL_W,topH);
    // Panel edge glow
    ctx.strokeStyle='rgba(0,180,255,0.18)'; ctx.lineWidth=1;
    ctx.strokeRect(px+1,0,PANEL_W-2,topH);
    // Horizontal circuit traces
    ctx.strokeStyle='rgba(0,140,220,0.07)'; ctx.lineWidth=1;
    for(let y=18;y<topH-8;y+=24) {
      ctx.beginPath(); ctx.moveTo(px+8,y); ctx.lineTo(px+PANEL_W-8,y); ctx.stroke();
      if(Math.sin(y*0.12+Date.now()*0.003)>0.3) {
        ctx.fillStyle=z.accent+'44';
        ctx.beginPath(); ctx.arc(px+8+(y%3)*14,y,1.5,0,Math.PI*2); ctx.fill();
      }
    }
    // Vertical circuit traces
    ctx.strokeStyle='rgba(0,140,220,0.05)';
    for(let x=px+12;x<px+PANEL_W-8;x+=16) {
      ctx.beginPath(); ctx.moveTo(x,8); ctx.lineTo(x,topH-8); ctx.stroke();
    }
    // Warning stripes near emitter
    for(let sy=topH-28;sy<topH-10;sy+=6) {
      ctx.fillStyle=(sy/6)%2===0?'rgba(255,180,0,0.06)':'transparent';
      ctx.fillRect(px+4,sy,PANEL_W-8,3);
    }
    // TOP EMITTER (gate frame)
    const emH=12;
    ctx.fillStyle='#0c1e30'; ctx.fillRect(px-6,topH-emH,PANEL_W+12,emH);
    ctx.fillStyle=z.laser+'66'; ctx.fillRect(px-2,topH-emH+2,PANEL_W+4,emH-4);
    ctx.fillStyle=z.laser; ctx.fillRect(px+2,topH-3,PANEL_W-4,2);
    // Status LEDs
    for(let lx=px+8;lx<px+PANEL_W-4;lx+=10) {
      ctx.fillStyle=Math.sin(Date.now()*0.005+lx)>0?z.accent:'#0a0a1a';
      ctx.beginPath(); ctx.arc(lx,topH-emH+5,1.2,0,Math.PI*2); ctx.fill();
    }
    // === BOTTOM WALL PANEL (flat color, no gradient) ===
    ctx.fillStyle='#0e1a2a'; ctx.fillRect(px,botY,PANEL_W,H-botY-GROUND_HEIGHT);
    ctx.strokeStyle='rgba(0,180,255,0.18)'; ctx.lineWidth=1;
    ctx.strokeRect(px+1,botY,PANEL_W-2,H-botY-GROUND_HEIGHT);
    // Horizontal circuit traces (bottom)
    ctx.strokeStyle='rgba(0,140,220,0.07)'; ctx.lineWidth=1;
    for(let y=botY+18;y<H-GROUND_HEIGHT-8;y+=24) {
      ctx.beginPath(); ctx.moveTo(px+8,y); ctx.lineTo(px+PANEL_W-8,y); ctx.stroke();
      if(Math.sin(y*0.12+Date.now()*0.003)>0.3) {
        ctx.fillStyle=z.accent+'44';
        ctx.beginPath(); ctx.arc(px+PANEL_W-8-(y%3)*14,y,1.5,0,Math.PI*2); ctx.fill();
      }
    }
    // Vertical circuit traces (bottom)
    ctx.strokeStyle='rgba(0,140,220,0.05)';
    for(let x=px+12;x<px+PANEL_W-8;x+=16) {
      ctx.beginPath(); ctx.moveTo(x,botY+8); ctx.lineTo(x,H-GROUND_HEIGHT-8); ctx.stroke();
    }
    // Warning stripes near emitter (bottom)
    for(let sy=botY+10;sy<botY+28;sy+=6) {
      ctx.fillStyle=(sy/6)%2===0?'rgba(255,180,0,0.06)':'transparent';
      ctx.fillRect(px+4,sy,PANEL_W-8,3);
    }
    // BOTTOM EMITTER
    ctx.fillStyle='#0c1e30'; ctx.fillRect(px-6,botY,PANEL_W+12,emH);
    ctx.fillStyle=z.laser+'66'; ctx.fillRect(px-2,botY+2,PANEL_W+4,emH-4);
    ctx.fillStyle=z.laser; ctx.fillRect(px+2,botY+1,PANEL_W-4,2);
    for(let lx=px+8;lx<px+PANEL_W-4;lx+=10) {
      ctx.fillStyle=Math.sin(Date.now()*0.005+lx+1)>0?z.accent:'#0a0a1a';
      ctx.beginPath(); ctx.arc(lx,botY+emH-5,1.2,0,Math.PI*2); ctx.fill();
    }
    // === ENERGY FIELD IN GAP (simplified — flat fade) ===
    ctx.globalAlpha=beamFlicker*0.05;
    ctx.fillStyle=z.laser; ctx.fillRect(px,topH,PANEL_W,p.gap);
    ctx.globalAlpha=1;
    // Horizontal scan line in gap
    const scanY=topH+(Date.now()*0.05+p.x)%(p.gap);
    ctx.globalAlpha=0.15; ctx.strokeStyle=z.laser; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(px+4,scanY); ctx.lineTo(px+PANEL_W-4,scanY); ctx.stroke();
    ctx.globalAlpha=1;
    // === GATE FRAME (corner brackets) ===
    const cLen=14;
    ctx.strokeStyle=z.accent; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(px-3,topH+cLen); ctx.lineTo(px-3,topH); ctx.lineTo(px+cLen,topH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+PANEL_W+3,topH+cLen); ctx.lineTo(px+PANEL_W+3,topH); ctx.lineTo(px+PANEL_W-cLen,topH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px-3,botY-cLen); ctx.lineTo(px-3,botY); ctx.lineTo(px+cLen,botY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+PANEL_W+3,botY-cLen); ctx.lineTo(px+PANEL_W+3,botY); ctx.lineTo(px+PANEL_W-cLen,botY); ctx.stroke();
    // Gate center crosshair
    const gapMid=topH+p.gap/2;
    ctx.globalAlpha=0.12; ctx.strokeStyle=z.accent; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx-8,gapMid); ctx.lineTo(cx+8,gapMid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,gapMid-8); ctx.lineTo(cx,gapMid+8); ctx.stroke();
    ctx.globalAlpha=1;
    // Score glow on gap
    if(p.glow>0) {
      ctx.fillStyle=`rgba(0,255,200,${p.glow*0.2})`;
      ctx.fillRect(px-6,topH,PANEL_W+12,p.gap);
    }

  }

export function drawFloatingCoins() {
    for(const c of S.floatingCoins) {
      if(c.collected) continue;
      const wobble=Math.sin(c.wobble)*3;
      const r = c.bonus ? 10 : 8;
      ctx.fillStyle=c.bonus?"#ff66ff":"#ffee00";
      ctx.beginPath(); ctx.arc(c.x,c.y+wobble,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=c.bonus?"#cc44cc":"#ffaa00";
      ctx.beginPath(); ctx.arc(c.x,c.y+wobble,r*0.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=c.bonus?"#ff88ff":"#ffee00";
      ctx.font=`bold ${r-1}px sans-serif`; ctx.textAlign="center";
      ctx.fillText(c.bonus?"$":"$",c.x,c.y+wobble+3);
    }
  }

export function drawGround() {
    ensureGradientCache();
    const gy=H-GROUND_HEIGHT;
    const z=S.currentZone;
    ctx.fillStyle=_groundGrad; ctx.fillRect(0,gy,W,GROUND_HEIGHT);
    // Horizon glow line
    ctx.strokeStyle=z.accent; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
    // Secondary glow
    ctx.strokeStyle="rgba(0,200,255,0.1)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,gy+1); ctx.lineTo(W,gy+1); ctx.stroke();
    // Perspective grid
    ctx.strokeStyle="rgba(255,0,230,0.1)"; ctx.lineWidth=1;
    for(let x=S.groundX;x<W;x+=35){ ctx.beginPath(); ctx.moveTo(x,gy+2); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=gy+12;y<H;y+=12){
      const fade=1-((y-gy)/GROUND_HEIGHT)*0.7;
      ctx.strokeStyle=`rgba(255,0,230,${0.1*fade})`;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
    // === FLOWING LIGHT DOTS (data highway) ===
    const dotOff=Date.now()*0.06;
    ctx.fillStyle=z.accent;
    for(let lane=0;lane<3;lane++) {
      const ly=gy+8+lane*16;
      ctx.globalAlpha=0.3-lane*0.07;
      for(let i=0;i<10;i++) {
        const dx=(dotOff*(1.5-lane*0.3)+i*W/8)%W;
        ctx.beginPath(); ctx.arc(dx,ly,1.5,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    // === GROUND STRUCTURES ===
    ctx.globalAlpha=0.35;
    for(let i=0;i<5;i++) {
      const gsx=((S.groundX*0.8+i*W*0.25)%(W+40))-20;
      if(i%2===0) {
        ctx.strokeStyle=z.bg2; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(gsx,gy); ctx.lineTo(gsx,gy-7-(i%3)*4); ctx.stroke();
        ctx.fillStyle=z.accent;
        ctx.beginPath(); ctx.arc(gsx,gy-7-(i%3)*4,1.5,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle='#0a1525'; ctx.fillRect(gsx-4,gy-5,8,5);
        ctx.fillStyle=z.accent+'66'; ctx.fillRect(gsx-2,gy-4,2,2);
      }
    }
    ctx.globalAlpha=1;
  }

export function drawBird() {
    if(S.state===STATE.DEAD) return; // don't draw after explosion
    const sk=getSkinColors();
    ctx.save(); ctx.translate(S.bird.x,S.bird.y); ctx.rotate(S.bird.angle);
    const t=Date.now()*0.001;
    // Trail
    for(const tr of S.bird.trail) {
      if(tr.life<=0) continue;
      ctx.globalAlpha=tr.life*0.35; ctx.fillStyle=sk.thrust;
      ctx.beginPath(); ctx.arc(tr.x-S.bird.x,tr.y-S.bird.y,3*tr.life,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    // === PER-SKIN UNIQUE DRONE CONSTRUCTION ===
    const coreR=BIRD_SIZE*0.36, ringR=BIRD_SIZE*0.58;
    const skinId=S.equippedSkin;

    if(skinId==="fire"){
      // ═══ RAPTOR — angular delta-wing fighter ═══
      const tB=S.isThrusting?1:0.25, tL=S.isThrusting?(20+Math.sin(t*30)*8):4;
      // DUAL AFTERBURNER EXHAUST
      ctx.shadowColor=sk.thrust; ctx.shadowBlur=S.isThrusting?40:8;
      for(const side of[-1,1]){
        // Outer cone
        ctx.fillStyle=sk.thrust; ctx.globalAlpha=tB*0.6;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.35,side*5);
        ctx.lineTo(-BIRD_SIZE*0.35-tL*1.3,side*9); ctx.lineTo(-BIRD_SIZE*0.35-tL*1.3,side*2); ctx.closePath(); ctx.fill();
        // Core flame
        ctx.fillStyle='#ffdd66'; ctx.globalAlpha=tB*0.8;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.35,side*5);
        ctx.lineTo(-BIRD_SIZE*0.35-tL,side*7); ctx.lineTo(-BIRD_SIZE*0.35-tL,side*3); ctx.closePath(); ctx.fill();
        if(S.isThrusting){
          // White hot core
          ctx.fillStyle='#fff'; ctx.globalAlpha=0.65;
          ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.35,side*5);
          ctx.lineTo(-BIRD_SIZE*0.35-tL*0.4,side*6); ctx.lineTo(-BIRD_SIZE*0.35-tL*0.4,side*4.2); ctx.closePath(); ctx.fill();
          // Exhaust sparks
          for(let k=0;k<3;k++){
            ctx.fillStyle='#ffaa00'; ctx.globalAlpha=0.5+Math.random()*0.4;
            ctx.beginPath(); ctx.arc(-BIRD_SIZE*0.35-tL*(0.4+Math.random()*0.6),side*(3+Math.random()*5),0.8+Math.random(),0,Math.PI*2); ctx.fill();
          }
        }
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // DELTA HULL with layered armor
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.7,0);
      ctx.lineTo(BIRD_SIZE*0.08,-BIRD_SIZE*0.2);
      ctx.lineTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.65);
      ctx.lineTo(-BIRD_SIZE*0.38,-BIRD_SIZE*0.08);
      ctx.lineTo(-BIRD_SIZE*0.38,BIRD_SIZE*0.08);
      ctx.lineTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.65);
      ctx.lineTo(BIRD_SIZE*0.08,BIRD_SIZE*0.2);
      ctx.closePath(); ctx.fill();
      // Top armor plate (lighter shade)
      ctx.fillStyle='rgba(255,200,150,0.15)';
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.7,0); ctx.lineTo(BIRD_SIZE*0.08,-BIRD_SIZE*0.2);
      ctx.lineTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.65); ctx.lineTo(-BIRD_SIZE*0.38,0); ctx.closePath(); ctx.fill();
      // Wing edge neon trim
      ctx.strokeStyle=sk.glow; ctx.lineWidth=2; ctx.globalAlpha=0.85;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.65,0); ctx.lineTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.65); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.65,0); ctx.lineTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.65); ctx.stroke();
      // Tail fin edges
      ctx.strokeStyle=sk.ring; ctx.lineWidth=1.2; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.65); ctx.lineTo(-BIRD_SIZE*0.38,-BIRD_SIZE*0.08); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.65); ctx.lineTo(-BIRD_SIZE*0.38,BIRD_SIZE*0.08); ctx.stroke();
      // Center spine line
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1; ctx.globalAlpha=0.35;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.6,0); ctx.lineTo(-BIRD_SIZE*0.38,0); ctx.stroke();
      ctx.shadowBlur=0;
      // COCKPIT — animated HUD diamond
      ctx.fillStyle='#111'; ctx.globalAlpha=0.8;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.3,0); ctx.lineTo(BIRD_SIZE*0.06,-BIRD_SIZE*0.1);
      ctx.lineTo(-BIRD_SIZE*0.12,0); ctx.lineTo(BIRD_SIZE*0.06,BIRD_SIZE*0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle=sk.glow; ctx.globalAlpha=0.3+Math.sin(t*6)*0.15;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.3,0); ctx.lineTo(BIRD_SIZE*0.06,-BIRD_SIZE*0.1);
      ctx.lineTo(-BIRD_SIZE*0.12,0); ctx.lineTo(BIRD_SIZE*0.06,BIRD_SIZE*0.1); ctx.closePath(); ctx.fill();
      // HUD scan line inside cockpit
      const hsx=BIRD_SIZE*0.06+Math.sin(t*12)*BIRD_SIZE*0.08;
      ctx.strokeStyle=sk.glow; ctx.lineWidth=0.6; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.moveTo(hsx,-BIRD_SIZE*0.06); ctx.lineTo(hsx,BIRD_SIZE*0.06); ctx.stroke();
      // WEAPON PODS on wings (pulsing)
      for(const side of[-1,1]){
        const wy=side*BIRD_SIZE*0.38, wx=-BIRD_SIZE*0.12;
        ctx.fillStyle=sk.ring; ctx.globalAlpha=0.75;
        ctx.beginPath(); ctx.moveTo(wx+7,wy); ctx.lineTo(wx-5,wy-side*2.5); ctx.lineTo(wx-5,wy+side*2.5); ctx.closePath(); ctx.fill();
        // Weapon charging glow
        const wpulse=0.4+Math.sin(t*10+side*3)*0.4;
        ctx.fillStyle=sk.glow; ctx.globalAlpha=wpulse;
        ctx.shadowColor=sk.glow; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(wx+8,wy,2,0,Math.PI*2); ctx.fill();
        // Laser sight line (while thrusting)
        if(S.isThrusting){
          ctx.strokeStyle=sk.glow; ctx.lineWidth=0.5; ctx.globalAlpha=wpulse*0.4;
          ctx.setLineDash([2,3]);
          ctx.beginPath(); ctx.moveTo(wx+8,wy); ctx.lineTo(wx+BIRD_SIZE*1.5,wy+side*3); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.shadowBlur=0;
      }
      // ORBITING EMBER shower — fire trails
      for(let i=0;i<14;i++){
        const ea=t*3.5+i*0.45, er=BIRD_SIZE*(0.25+Math.sin(t*5+i)*0.35);
        const es=1+Math.sin(t*8+i)*0.8;
        ctx.fillStyle=i%3===0?'#ff2200':i%3===1?'#ff6622':'#ffcc00';
        ctx.globalAlpha=0.35+Math.sin(t*8+i)*0.3;
        ctx.beginPath(); ctx.arc(Math.cos(ea)*er,Math.sin(ea)*er,es,0,Math.PI*2); ctx.fill();
      }
      // HEAT DISTORTION WAVES
      ctx.strokeStyle='#ff4400'; ctx.lineWidth=0.8; ctx.globalAlpha=0.1;
      for(let i=0;i<4;i++){
        const sy2=(Math.sin(t*14+i*1.7)-0.5)*BIRD_SIZE*1.2;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.7,sy2);
        ctx.bezierCurveTo(-BIRD_SIZE*0.2,sy2+5,BIRD_SIZE*0.2,sy2-5,BIRD_SIZE*0.7,sy2); ctx.stroke();
      }
      // WING TIP FLARES (trailing fire)
      for(const side of[-1,1]){
        const ftx=-BIRD_SIZE*0.5, fty=side*BIRD_SIZE*0.65;
        for(let fi=0;fi<4;fi++){
          const ff=fi*0.15;
          ctx.fillStyle='#ff6600'; ctx.globalAlpha=0.3-fi*0.06;
          ctx.beginPath(); ctx.arc(ftx-fi*5-Math.sin(t*20+fi)*2,fty+Math.sin(t*15+fi)*3,2-fi*0.3,0,Math.PI*2); ctx.fill();
        }
      }

    } else if(skinId==="toxic"){
      // ═══ LEECH — organic bio-parasite ═══
      const tB=S.isThrusting?1:0.3;
      // TOXIC SPORE EXHAUST
      ctx.shadowColor=sk.glow; ctx.shadowBlur=S.isThrusting?25:5;
      for(let i=0;i<(S.isThrusting?8:3);i++){
        const bx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?28:6), by=(Math.random()-0.5)*12;
        const bs=1.5+Math.random()*4;
        ctx.fillStyle=i%2?sk.thrust:'#88ff44'; ctx.globalAlpha=tB*(0.3+Math.random()*0.3);
        ctx.beginPath(); ctx.arc(bx,by,bs,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // PULSING ORGANIC MEMBRANE with tumors
      const breathe=1+Math.sin(t*4)*0.12+Math.sin(t*7)*0.04;
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=22;
      ctx.beginPath();
      for(let a=0;a<Math.PI*2;a+=0.06){
        const w=1+Math.sin(a*3+t*5)*0.18+Math.sin(a*5-t*3)*0.1+Math.sin(a*7+t*2)*0.06+Math.sin(a*11+t*8)*0.03;
        const r2=coreR*1.4*breathe*w;
        a<0.01?ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2):ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
      }
      ctx.closePath(); ctx.fill();
      // Inner cytoplasm layer
      ctx.fillStyle=sk.ring; ctx.globalAlpha=0.25;
      ctx.beginPath();
      for(let a=0;a<Math.PI*2;a+=0.08){
        const w=1+Math.sin(a*4-t*4)*0.12;
        const r2=coreR*0.85*breathe*w;
        a<0.01?ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2):ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
      }
      ctx.closePath(); ctx.fill();
      // BIOLUMINESCENT VEIN NETWORK (pulsing)
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1.2; ctx.lineCap='round';
      for(let i=0;i<8;i++){
        const va=i*Math.PI*2/8+t*0.4;
        ctx.globalAlpha=0.25+Math.sin(t*3+i*0.7)*0.15;
        ctx.beginPath(); ctx.moveTo(0,0);
        const mid=coreR*0.7*breathe;
        ctx.quadraticCurveTo(Math.cos(va+0.5)*mid,Math.sin(va+0.5)*mid,
          Math.cos(va)*coreR*1.4*breathe,Math.sin(va)*coreR*1.4*breathe); ctx.stroke();
      }
      // 6 WAVING TENTACLES with segments
      for(let i=0;i<6;i++){
        const ta=Math.PI*0.45+i*Math.PI*0.22;
        ctx.globalAlpha=0.8; ctx.strokeStyle=sk.body; ctx.lineCap='round';
        ctx.beginPath();
        let tx=Math.cos(ta)*coreR*1.3, ty=Math.sin(ta)*coreR*1.3;
        ctx.moveTo(tx,ty);
        for(let j=1;j<=7;j++){
          tx+=Math.cos(ta+Math.sin(t*3.5+i+j*0.8)*1.1)*5;
          ty+=Math.sin(ta+Math.sin(t*2.7+i-j*0.6)*0.8)*5;
          ctx.lineWidth=3.2-j*0.35;
          ctx.lineTo(tx,ty);
        }
        ctx.stroke();
        // Glowing sucker at tip
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.55+Math.sin(t*6+i)*0.3;
        ctx.shadowColor=sk.glow; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.arc(tx,ty,2.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
        // Mini poison drops from tentacle tips
        const dp=(t*1.5+i*0.4)%1;
        ctx.fillStyle=sk.glow; ctx.globalAlpha=(1-dp)*0.45;
        ctx.beginPath(); ctx.arc(tx,ty+dp*15,1.5-dp,0,Math.PI*2); ctx.fill();
      }
      ctx.lineCap='butt';
      // CENTRAL ALIEN EYE (tracking, dilating)
      const eyeDilate=0.14+Math.sin(t*2)*0.06;
      ctx.fillStyle='#001100'; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.ellipse(BIRD_SIZE*0.06,0,coreR*0.42,coreR*0.3+Math.sin(t*1.8)*coreR*eyeDilate,0,0,Math.PI*2); ctx.fill();
      // Iris
      ctx.fillStyle=sk.glow; ctx.globalAlpha=0.95;
      const irisx=BIRD_SIZE*0.1+Math.sin(t*1.5)*2.5, irisy=Math.sin(t*1.2)*2;
      ctx.beginPath(); ctx.arc(irisx,irisy,coreR*0.18,0,Math.PI*2); ctx.fill();
      // Pupil slit (vertical)
      ctx.fillStyle='#000'; ctx.globalAlpha=0.85;
      ctx.beginPath(); ctx.ellipse(irisx,irisy,coreR*0.04,coreR*0.14,0,0,Math.PI*2); ctx.fill();
      // Eye highlight
      ctx.fillStyle='#fff'; ctx.globalAlpha=0.55;
      ctx.beginPath(); ctx.arc(irisx+1.5,irisy-1.5,coreR*0.06,0,Math.PI*2); ctx.fill();
      // Eye veins
      ctx.strokeStyle='#ff2200'; ctx.lineWidth=0.5; ctx.globalAlpha=0.2;
      for(let i=0;i<4;i++){
        const va2=i*Math.PI*0.5+t*0.2;
        ctx.beginPath(); ctx.moveTo(irisx+Math.cos(va2)*coreR*0.15,irisy+Math.sin(va2)*coreR*0.15);
        ctx.lineTo(irisx+Math.cos(va2)*coreR*0.35,irisy+Math.sin(va2)*coreR*0.35); ctx.stroke();
      }
      // ACID RAIN — dripping toxic slime
      for(let i=0;i<7;i++){
        const dx=(i-3)*5, dripP=(t*2.5+i*0.5)%1;
        ctx.fillStyle=i%2?sk.glow:'#88ff44'; ctx.globalAlpha=(1-dripP)*0.5;
        ctx.beginPath(); ctx.arc(dx,coreR*1.4+dripP*25,2.5-dripP*1.8,0,Math.PI*2); ctx.fill();
        // Splash at bottom of drip
        if(dripP>0.85){
          const sp=(dripP-0.85)/0.15;
          for(let s=0;s<3;s++){
            ctx.fillStyle=sk.glow; ctx.globalAlpha=(1-sp)*0.3;
            ctx.beginPath(); ctx.arc(dx+(s-1)*3*sp,coreR*1.4+25-sp*4,1,0,Math.PI*2); ctx.fill();
          }
        }
      }
      // TOXIC AURA (radiating rings)
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1; ctx.globalAlpha=0.06;
      for(let i=0;i<3;i++){
        const ar=coreR*1.6+i*5+Math.sin(t*2+i)*3;
        ctx.beginPath(); ctx.arc(0,0,ar,0,Math.PI*2); ctx.stroke();
      }
      ctx.shadowBlur=0;

    } else if(skinId==="sunset"){
      // ═══ HELIOS — solar deity ═══
      const tB=S.isThrusting?1:0.25, tL2=S.isThrusting?(26+Math.sin(t*25)*10):5;
      // PLASMA JET ENGINE
      ctx.shadowColor='#ffaa00'; ctx.shadowBlur=S.isThrusting?35:8;
      ctx.fillStyle=sk.thrust; ctx.globalAlpha=tB*0.5;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.4,-5); ctx.lineTo(-BIRD_SIZE*0.4-tL2,-12);
      ctx.lineTo(-BIRD_SIZE*0.4-tL2,12); ctx.lineTo(-BIRD_SIZE*0.4,5); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#ffe8aa'; ctx.globalAlpha=tB*0.7;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.4,0); ctx.lineTo(-BIRD_SIZE*0.4-tL2*0.6,-5);
      ctx.lineTo(-BIRD_SIZE*0.4-tL2*0.6,5); ctx.closePath(); ctx.fill();
      if(S.isThrusting){
        ctx.fillStyle='#fff'; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.4,0); ctx.lineTo(-BIRD_SIZE*0.4-tL2*0.25,-2);
        ctx.lineTo(-BIRD_SIZE*0.4-tL2*0.25,2); ctx.closePath(); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // SCARAB WING PLATES (animated flap)
      const wingFlap=Math.sin(t*6)*0.05;
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=18;
      for(const side of[-1,1]){
        ctx.globalAlpha=0.88; ctx.save();
        ctx.rotate(side*wingFlap);
        ctx.beginPath();
        ctx.moveTo(BIRD_SIZE*0.18,side*BIRD_SIZE*0.13);
        ctx.quadraticCurveTo(BIRD_SIZE*0.08,side*BIRD_SIZE*0.6,-BIRD_SIZE*0.22,side*BIRD_SIZE*0.65);
        ctx.quadraticCurveTo(-BIRD_SIZE*0.48,side*BIRD_SIZE*0.55,-BIRD_SIZE*0.44,side*BIRD_SIZE*0.13);
        ctx.closePath(); ctx.fill();
        // Wing hieroglyph lines
        ctx.strokeStyle=sk.thrust; ctx.lineWidth=0.8; ctx.globalAlpha=0.35;
        ctx.beginPath(); ctx.moveTo(0,side*BIRD_SIZE*0.24);
        ctx.lineTo(-BIRD_SIZE*0.34,side*BIRD_SIZE*0.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.06,side*BIRD_SIZE*0.18);
        ctx.quadraticCurveTo(-BIRD_SIZE*0.12,side*BIRD_SIZE*0.5,-BIRD_SIZE*0.3,side*BIRD_SIZE*0.55); ctx.stroke();
        // Extra wing vein
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.1,side*BIRD_SIZE*0.15);
        ctx.lineTo(-BIRD_SIZE*0.38,side*BIRD_SIZE*0.35); ctx.stroke();
        // Wing tip fire
        ctx.fillStyle=sk.thrust; ctx.globalAlpha=0.45+Math.sin(t*5+side)*0.35;
        ctx.shadowColor=sk.thrust; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(-BIRD_SIZE*0.22,side*BIRD_SIZE*0.65,3,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
        ctx.restore();
      }
      // CENTRAL SUN DISK (layered gradients)
      ctx.globalAlpha=1;
      // Outer sun haze
      const hazeG=ctx.createRadialGradient(0,0,coreR*0.8,0,0,coreR*2);
      hazeG.addColorStop(0,'rgba(255,150,50,0.2)'); hazeG.addColorStop(1,'transparent');
      ctx.fillStyle=hazeG; ctx.beginPath(); ctx.arc(0,0,coreR*2,0,Math.PI*2); ctx.fill();
      // Main sun
      const sunG=ctx.createRadialGradient(-1,-1,coreR*0.15,0,0,coreR*1.2);
      sunG.addColorStop(0,'#fffbe8'); sunG.addColorStop(0.2,'#ffe0a0'); sunG.addColorStop(0.5,sk.body);
      sunG.addColorStop(0.75,sk.glow); sunG.addColorStop(1,'rgba(80,30,0,0.4)');
      ctx.fillStyle=sunG; ctx.beginPath(); ctx.arc(0,0,coreR*1.2,0,Math.PI*2); ctx.fill();
      // Sun surface texture (granulation)
      for(let i=0;i<8;i++){
        const ga=i*Math.PI*2/8+t*0.3;
        const gr=coreR*(0.4+Math.sin(t*2+i)*0.3);
        ctx.fillStyle='rgba(255,200,100,0.12)';
        ctx.beginPath(); ctx.arc(Math.cos(ga)*gr,Math.sin(ga)*gr,coreR*0.25,0,Math.PI*2); ctx.fill();
      }
      // Eye of Ra
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.8; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.5,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='#fffbe8'; ctx.globalAlpha=0.8;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.22,0,Math.PI*2); ctx.fill();
      // CORONA MEGA SPIKES (animated length)
      ctx.shadowColor='#ff6600'; ctx.shadowBlur=20;
      for(let i=0;i<16;i++){
        const ra=t*0.7+i*(Math.PI/8);
        const rLen=coreR*(1.8+Math.sin(t*4+i*0.85)*0.8+Math.sin(t*7+i*1.3)*0.3);
        const thick=2.5-Math.abs(Math.sin(ra))*1;
        ctx.strokeStyle=i%4===0?'#fff':sk.thrust; ctx.lineWidth=thick;
        ctx.globalAlpha=0.3+Math.sin(t*5+i)*0.2;
        ctx.beginPath(); ctx.moveTo(Math.cos(ra)*coreR,Math.sin(ra)*coreR);
        ctx.lineTo(Math.cos(ra)*rLen,Math.sin(ra)*rLen); ctx.stroke();
      }
      // SOLAR FLARE ARCS (multiple orbits)
      ctx.strokeStyle='#ffcc44'; ctx.lineWidth=2; ctx.globalAlpha=0.22;
      for(let i=0;i<5;i++){
        const fa=t*0.3+i*Math.PI*0.4;
        const fr=coreR*1.8+i*4;
        ctx.beginPath(); ctx.arc(0,0,fr,fa,fa+Math.PI*(0.2+i*0.05)); ctx.stroke();
      }
      // ORBITING SOLAR PROMINENCES (flame streaks)
      for(let i=0;i<6;i++){
        const pa=t*1.2+i*1.05, pr=coreR*(1.5+Math.sin(t*3+i)*0.4);
        ctx.fillStyle=i%2?'#ffdd44':'#ff8844'; ctx.globalAlpha=0.4+Math.sin(t*5+i)*0.25;
        ctx.beginPath(); ctx.arc(Math.cos(pa)*pr,Math.sin(pa)*pr,2+Math.sin(t*8+i),0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0;

    } else if(skinId==="purple"){
      // ═══ EVENT HORIZON — black hole singularity ═══
      const tB=S.isThrusting?1:0.2;
      // VOID LIGHTNING EXHAUST
      ctx.shadowColor=sk.glow; ctx.shadowBlur=S.isThrusting?22:5;
      ctx.strokeStyle=sk.thrust; ctx.lineWidth=1.8;
      for(let i=0;i<(S.isThrusting?8:3);i++){
        ctx.globalAlpha=tB*(0.25+Math.random()*0.35);
        let vx=-BIRD_SIZE*0.4, vy=(Math.random()-0.5)*10;
        ctx.beginPath(); ctx.moveTo(vx,vy);
        for(let j=0;j<3;j++){
          vx-=4+Math.random()*6; vy+=(Math.random()-0.5)*8;
          ctx.lineTo(vx,vy);
        }
        ctx.stroke();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // ACCRETION DISK (tilted, multi-layer)
      ctx.save(); ctx.scale(1,0.35);
      const diskR=BIRD_SIZE*0.9;
      // Outer gravitational lens glow
      ctx.shadowColor=sk.glow; ctx.shadowBlur=35;
      ctx.strokeStyle=sk.glow; ctx.lineWidth=5; ctx.globalAlpha=0.1;
      ctx.beginPath(); ctx.arc(0,0,diskR*1.4,0,Math.PI*2); ctx.stroke();
      // Hot outer ring
      ctx.strokeStyle=sk.thrust; ctx.lineWidth=3; ctx.globalAlpha=0.25;
      ctx.beginPath(); ctx.arc(0,0,diskR*1.15,0,Math.PI*2); ctx.stroke();
      // Main accretion disk gradient
      const dG=ctx.createLinearGradient(-diskR,0,diskR,0);
      dG.addColorStop(0,sk.thrust); dG.addColorStop(0.2,'#fff'); dG.addColorStop(0.4,sk.glow);
      dG.addColorStop(0.6,'#fff'); dG.addColorStop(0.8,sk.body); dG.addColorStop(1,sk.thrust);
      ctx.strokeStyle=dG; ctx.lineWidth=7; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.arc(0,0,diskR,0,Math.PI*2); ctx.stroke();
      // Inner white-hot ring
      ctx.strokeStyle='#eeddff'; ctx.lineWidth=2.5; ctx.globalAlpha=0.75;
      ctx.beginPath(); ctx.arc(0,0,coreR*1.3,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // SWIRLING MATTER PARTICLES (faster, more)
      for(let i=0;i<12;i++){
        const pa=t*2.2+i*0.52, pr=diskR*(0.55+i*0.04);
        const px=Math.cos(pa)*pr, py=Math.sin(pa)*pr*0.35;
        ctx.fillStyle=i%3===0?'#fff':i%3===1?sk.glow:sk.thrust;
        ctx.globalAlpha=0.35+Math.sin(t*5+i)*0.3;
        ctx.beginPath(); ctx.arc(px,py,1.2+Math.sin(t*3+i)*0.6,0,Math.PI*2); ctx.fill();
      }
      // BLACK CORE (event horizon with light bending)
      const bhGrad=ctx.createRadialGradient(0,0,0,0,0,coreR*0.8);
      bhGrad.addColorStop(0,'#000'); bhGrad.addColorStop(0.6,'#050010'); bhGrad.addColorStop(1,'#1a0030');
      ctx.fillStyle=bhGrad; ctx.globalAlpha=0.98;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.8,0,Math.PI*2); ctx.fill();
      // PHOTON RING (bright white, pulsing)
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.globalAlpha=0.85+Math.sin(t*4)*0.1;
      ctx.shadowColor='#fff'; ctx.shadowBlur=28;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.8,0,Math.PI*2); ctx.stroke();
      // Inner photon ring
      ctx.strokeStyle=sk.glow; ctx.lineWidth=0.8; ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.55,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
      // SPIRALING ENERGY STREAMS (gravitational lensing)
      for(let i=0;i<4;i++){
        ctx.strokeStyle=i%2?sk.glow:sk.thrust; ctx.lineWidth=1.2; ctx.globalAlpha=0.22;
        ctx.beginPath();
        for(let a=0;a<Math.PI*3;a+=0.1){
          const sr=BIRD_SIZE*0.95-a*coreR*0.06;
          const sx=Math.cos(a+t*2.5+i*1.57)*sr, sy=Math.sin(a+t*2.5+i*1.57)*sr*0.35;
          a<0.01?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
        }
        ctx.stroke();
      }
      // POLAR JETS (relativistic)
      for(const pole of[-1,1]){
        // Main jet beam
        ctx.shadowColor=sk.glow; ctx.shadowBlur=12;
        ctx.strokeStyle=sk.thrust; ctx.lineWidth=2; ctx.globalAlpha=0.4;
        ctx.beginPath(); ctx.moveTo(0,pole*coreR*0.5);
        let jx=0, jy=pole*coreR*0.5;
        for(let j=0;j<7;j++){
          jx+=(Math.random()-0.5)*5; jy+=pole*(5+Math.random()*5);
          ctx.lineTo(jx,jy);
        }
        ctx.stroke();
        // Jet S.particles
        for(let jp=0;jp<3;jp++){
          const jpa=t*3+jp*2.1+pole;
          ctx.fillStyle=sk.glow; ctx.globalAlpha=0.3+Math.sin(jpa)*0.2;
          ctx.beginPath(); ctx.arc((Math.random()-0.5)*4,pole*(coreR*(1+jp*0.5)+Math.sin(jpa)*5),1.5,0,Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur=0;
      }
      // GRAVITATIONAL LENS DISTORTION RING
      ctx.strokeStyle='rgba(150,100,255,0.08)'; ctx.lineWidth=8;
      ctx.beginPath(); ctx.arc(0,0,BIRD_SIZE*0.95,0,Math.PI*2); ctx.stroke();

    } else if(skinId==="golden"){
      // ═══ IMPERIAL — golden battlecruiser dreadnought ═══
      const tB=S.isThrusting?1:0.25, tL=S.isThrusting?(24+Math.sin(t*28)*9):4;
      // ROYAL EXHAUST (twin golden flames)
      ctx.shadowColor='#ffd700'; ctx.shadowBlur=S.isThrusting?45:10;
      for(const side of[-1,1]){
        ctx.fillStyle='#ffcc44'; ctx.globalAlpha=tB*0.5;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.44,side*4);
        ctx.lineTo(-BIRD_SIZE*0.44-tL,side*8); ctx.lineTo(-BIRD_SIZE*0.44-tL,side*1); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#fff'; ctx.globalAlpha=tB*0.4;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.44,side*4);
        ctx.lineTo(-BIRD_SIZE*0.44-tL*0.3,side*5.5); ctx.lineTo(-BIRD_SIZE*0.44-tL*0.3,side*2.5); ctx.closePath(); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // SHIP HULL (majestic elongated dreadnought)
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=25;
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE*0.65,0);
      ctx.lineTo(BIRD_SIZE*0.3,-BIRD_SIZE*0.2);
      ctx.lineTo(-BIRD_SIZE*0.08,-BIRD_SIZE*0.32);
      ctx.lineTo(-BIRD_SIZE*0.44,-BIRD_SIZE*0.22);
      ctx.lineTo(-BIRD_SIZE*0.44,BIRD_SIZE*0.22);
      ctx.lineTo(-BIRD_SIZE*0.08,BIRD_SIZE*0.32);
      ctx.lineTo(BIRD_SIZE*0.3,BIRD_SIZE*0.2);
      ctx.closePath(); ctx.fill();
      // Bridge deck (lighter)
      ctx.fillStyle='#ffdd44'; ctx.globalAlpha=0.2;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.65,0); ctx.lineTo(BIRD_SIZE*0.3,-BIRD_SIZE*0.2);
      ctx.lineTo(-BIRD_SIZE*0.44,-BIRD_SIZE*0.22); ctx.lineTo(-BIRD_SIZE*0.44,0); ctx.lineTo(BIRD_SIZE*0.65,0); ctx.closePath(); ctx.fill();
      // Gold trim lines
      ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.5; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.3,-BIRD_SIZE*0.2); ctx.lineTo(-BIRD_SIZE*0.44,-BIRD_SIZE*0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.3,BIRD_SIZE*0.2); ctx.lineTo(-BIRD_SIZE*0.44,BIRD_SIZE*0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.65,0); ctx.lineTo(-BIRD_SIZE*0.44,0); ctx.stroke();
      // Side panel engravings
      ctx.strokeStyle='#ffaa00'; ctx.lineWidth=0.6; ctx.globalAlpha=0.2;
      for(const side of[-1,1]){
        for(let i=0;i<3;i++){
          const ex=-BIRD_SIZE*0.3+i*BIRD_SIZE*0.2;
          ctx.beginPath(); ctx.moveTo(ex,side*BIRD_SIZE*0.08); ctx.lineTo(ex+BIRD_SIZE*0.08,side*BIRD_SIZE*0.15); ctx.stroke();
        }
      }
      ctx.shadowBlur=0;
      // CROWN OF GLORY (floating above ship)
      for(let i=0;i<7;i++){
        const cx2=-BIRD_SIZE*0.25+i*BIRD_SIZE*0.13;
        const ch=BIRD_SIZE*(0.32+Math.sin(t*5+i*0.8)*0.08);
        const hover=Math.sin(t*3+i*0.5)*1.5;
        // Crown spike
        ctx.fillStyle='#ffd700'; ctx.globalAlpha=0.8;
        ctx.shadowColor='#ffd700'; ctx.shadowBlur=8;
        ctx.beginPath();
        ctx.moveTo(cx2-3.5,-BIRD_SIZE*0.25+hover);
        ctx.lineTo(cx2,-BIRD_SIZE*0.25-ch+hover);
        ctx.lineTo(cx2+3.5,-BIRD_SIZE*0.25+hover);
        ctx.closePath(); ctx.fill();
        // Crown jewel (alternating ruby/sapphire/emerald)
        const jewels=['#ff2244','#2288ff','#22ff44','#ff2244','#aa44ff','#2288ff','#ff8822'];
        ctx.fillStyle=jewels[i]; ctx.globalAlpha=0.7+Math.sin(t*6+i)*0.25;
        ctx.beginPath(); ctx.arc(cx2,-BIRD_SIZE*0.25-ch*0.55+hover,2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // Crown base band
      ctx.strokeStyle='#ffd700'; ctx.lineWidth=2; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.28,-BIRD_SIZE*0.24+Math.sin(t*3)*1.5);
      ctx.lineTo(BIRD_SIZE*0.35,-BIRD_SIZE*0.24+Math.sin(t*3+Math.PI)*1.5); ctx.stroke();
      // CENTRAL IMPERIAL GEM (octagonal brilliant cut)
      const gemR=coreR*0.6;
      const gemG=ctx.createRadialGradient(-1,-1,1,0,0,gemR);
      gemG.addColorStop(0,'#fff'); gemG.addColorStop(0.15,'#ffee88'); gemG.addColorStop(0.5,sk.body); gemG.addColorStop(1,sk.glow);
      ctx.fillStyle=gemG; ctx.globalAlpha=0.95;
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const ga=i*(Math.PI/4)+Math.PI/8+t*0.3;
        ctx.lineTo(Math.cos(ga)*gemR,Math.sin(ga)*gemR);
      }
      ctx.closePath(); ctx.fill();
      // Gem internal refraction
      ctx.strokeStyle='#fff'; ctx.lineWidth=0.5; ctx.globalAlpha=0.3;
      for(let i=0;i<4;i++){
        const ra=i*(Math.PI/2)+t*0.3;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ra)*gemR*0.8,Math.sin(ra)*gemR*0.8); ctx.stroke();
      }
      // Gem sparkle cross (animated rotation)
      ctx.save(); ctx.rotate(t*2);
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.globalAlpha=0.45+Math.sin(t*12)*0.35;
      ctx.beginPath(); ctx.moveTo(-gemR,0); ctx.lineTo(gemR,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-gemR); ctx.lineTo(0,gemR); ctx.stroke();
      ctx.restore();
      // DIAMOND SPARKLE PARTICLES (orbiting constellation)
      for(let i=0;i<10;i++){
        const sa=t*1.3+i*0.63, sr=ringR*(0.5+Math.sin(t*2.5+i)*0.45);
        const sx=Math.cos(sa)*sr, sy=Math.sin(sa)*sr;
        const sz=1.5+Math.sin(t*8+i)*1.5;
        ctx.fillStyle=i%3===0?'#fffce0':i%3===1?'#ffd700':'#fff';
        ctx.globalAlpha=0.5+Math.sin(t*6+i)*0.4;
        ctx.beginPath(); ctx.moveTo(sx,sy-sz*3); ctx.lineTo(sx+sz*0.7,sy);
        ctx.lineTo(sx,sy+sz*3); ctx.lineTo(sx-sz*0.7,sy); ctx.closePath(); ctx.fill();
      }
      // ROYAL AURA (golden mist)
      ctx.fillStyle='rgba(255,215,0,0.03)';
      ctx.beginPath(); ctx.arc(0,0,BIRD_SIZE*1.2,0,Math.PI*2); ctx.fill();

    } else if(skinId==="rainbow"){
      // ═══ PRISM — reality-bending crystalline entity ═══
      const tB=S.isThrusting?1:0.25, tL=S.isThrusting?(18+Math.sin(t*30)*7):3;
      // RAINBOW EXHAUST (spectral split)
      for(let i=0;i<6;i++){
        const hue2=(i*60+Date.now()*0.3)%360;
        ctx.fillStyle='hsl('+hue2+',100%,60%)'; ctx.globalAlpha=tB*0.35;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.4,i*1.8-4.5);
        ctx.lineTo(-BIRD_SIZE*0.4-tL*(0.7+i*0.06),i*3-7.5);
        ctx.lineTo(-BIRD_SIZE*0.4-tL*(0.7+i*0.06),i*3-5); ctx.closePath(); ctx.fill();
      }
      if(S.isThrusting){
        ctx.fillStyle='#fff'; ctx.globalAlpha=0.35;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.4,0); ctx.lineTo(-BIRD_SIZE*0.4-tL*0.3,-2);
        ctx.lineTo(-BIRD_SIZE*0.4-tL*0.3,2); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha=1;
      // ROTATING HEXAGONAL CRYSTAL (layered, refracting light)
      const hue=(Date.now()*0.12)%360;
      ctx.save(); ctx.rotate(t*0.9);
      const crystR=coreR*1.4;
      // Crystal facets with depth illusion
      for(let i=0;i<6;i++){
        const a1=i*(Math.PI*2/6), a2=(i+1)*(Math.PI*2/6);
        const fhue=(hue+i*60)%360;
        // Facet fill
        ctx.fillStyle='hsl('+fhue+',100%,55%)'; ctx.globalAlpha=0.75;
        ctx.shadowColor='hsl('+fhue+',100%,70%)'; ctx.shadowBlur=15;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a1)*crystR,Math.sin(a1)*crystR);
        ctx.lineTo(Math.cos(a2)*crystR,Math.sin(a2)*crystR);
        ctx.closePath(); ctx.fill();
        // Edge highlight
        ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(Math.cos(a1)*crystR,Math.sin(a1)*crystR);
        ctx.lineTo(Math.cos(a2)*crystR,Math.sin(a2)*crystR); ctx.stroke();
        // Internal edge (depth)
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=0.7;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a1)*crystR,Math.sin(a1)*crystR); ctx.stroke();
      }
      // Inner counter-rotating crystal
      ctx.save(); ctx.rotate(-t*1.4);
      for(let i=0;i<6;i++){
        const a1=i*(Math.PI*2/6)+Math.PI/6, a2=(i+1)*(Math.PI*2/6)+Math.PI/6;
        const fhue=(hue+i*60+30)%360;
        ctx.fillStyle='hsl('+fhue+',100%,75%)'; ctx.globalAlpha=0.35;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a1)*crystR*0.5,Math.sin(a1)*crystR*0.5);
        ctx.lineTo(Math.cos(a2)*crystR*0.5,Math.sin(a2)*crystR*0.5);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.restore(); ctx.shadowBlur=0;
      // LIGHT REFRACTION BEAMS (longer, more dramatic)
      for(let i=0;i<8;i++){
        const ba=t*0.9+i*(Math.PI/4);
        const bhue=(hue+i*45+Date.now()*0.25)%360;
        const bLen=BIRD_SIZE*(1.1+Math.sin(t*3+i)*0.45);
        ctx.strokeStyle='hsl('+bhue+',100%,65%)'; ctx.lineWidth=2.5; ctx.globalAlpha=0.35;
        ctx.shadowColor='hsl('+bhue+',100%,70%)'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.moveTo(Math.cos(ba)*coreR*0.6,Math.sin(ba)*coreR*0.6);
        ctx.lineTo(Math.cos(ba)*bLen,Math.sin(ba)*bLen); ctx.stroke();
        ctx.shadowBlur=0;
      }
      // ORBITING CRYSTAL SHARD CONSTELLATION
      for(let i=0;i<8;i++){
        const oa=t*2.2+i*0.79, od=ringR*(0.6+Math.sin(t*3+i)*0.4);
        const ox=Math.cos(oa)*od, oy=Math.sin(oa)*od;
        const ohue=(hue+i*45)%360;
        ctx.fillStyle='hsl('+ohue+',100%,70%)'; ctx.globalAlpha=0.65;
        ctx.save(); ctx.translate(ox,oy); ctx.rotate(t*4+i);
        ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(2.5,0); ctx.lineTo(0,4); ctx.lineTo(-2.5,0); ctx.closePath(); ctx.fill();
        // Shard glow
        ctx.fillStyle='hsl('+ohue+',100%,85%)'; ctx.globalAlpha=0.2;
        ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // RGB CHROMATIC SPLIT (3 offset circles)
      var chromColors=['#ff0044','#00ff44','#4488ff'];
      for(var ci=0;ci<3;ci++){
        ctx.strokeStyle=chromColors[ci]; ctx.lineWidth=1.8; ctx.globalAlpha=0.16;
        ctx.beginPath(); ctx.arc(ci*2-2,ci*0.8-0.8,coreR*1.4+ci*3,0,Math.PI*2); ctx.stroke();
      }
      // RAINBOW TRAIL PARTICLES
      for(let i=0;i<6;i++){
        const rta=t*1.8+i*1.05;
        const rtd=BIRD_SIZE*(0.3+i*0.08);
        const rthue=(Date.now()*0.3+i*60)%360;
        ctx.fillStyle='hsl('+rthue+',100%,65%)'; ctx.globalAlpha=0.3;
        ctx.beginPath(); ctx.arc(-rtd-Math.sin(rta)*3,Math.sin(rta+i)*rtd*0.3,1.5,0,Math.PI*2); ctx.fill();
      }
      // Central white core (pulsing bright)
      ctx.fillStyle='#fff'; ctx.globalAlpha=0.7+Math.sin(t*6)*0.25;
      ctx.shadowColor='#fff'; ctx.shadowBlur=15;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.32,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;

    } else if(skinId==="ghost"){
      // ═══ SPECTER — dimensional phase wraith ═══
      const tB=S.isThrusting?0.6:0.1;
      // SPECTRAL EXHAUST (fading wisps)
      for(let i=0;i<(S.isThrusting?6:2);i++){
        const gx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?22:5), gy=(Math.random()-0.5)*12;
        ctx.fillStyle='rgba(200,200,255,'+String(tB*(0.15+Math.random()*0.2))+')';
        ctx.beginPath(); ctx.arc(gx,gy,3+Math.random()*5,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
      // Phase shift oscillation
      const phase=0.2+Math.sin(t*2)*0.12+Math.sin(t*5.3)*0.06;
      // TRAILING AFTERIMAGE GHOSTS (more copies, fading)
      for(let i=5;i>=1;i--){
        const gof=i*7;
        ctx.globalAlpha=phase*(0.35-i*0.055);
        // Ghost body
        ctx.fillStyle='rgba(180,180,240,0.06)';
        ctx.beginPath(); ctx.arc(-gof,i*2,coreR*(1.2-i*0.06),0,Math.PI*2); ctx.fill();
        // Ghost outline
        ctx.strokeStyle='rgba(200,200,255,0.25)'; ctx.lineWidth=1.5;
        ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.arc(-gof,i*2,coreR*(1.2-i*0.06),0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      }
      // MAIN BODY — flickering semi-transparent shell
      ctx.shadowColor='rgba(200,200,255,0.6)'; ctx.shadowBlur=22;
      // Flicker effect
      const flick=Math.random()>0.92?0.1:1;
      ctx.strokeStyle='rgba(200,200,255,0.7)'; ctx.lineWidth=2.5;
      ctx.globalAlpha=phase*2.5*flick;
      ctx.setLineDash([5,3]);
      ctx.beginPath(); ctx.arc(0,0,coreR*1.2,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      // Inner ectoplasm fill
      const ectoG=ctx.createRadialGradient(0,0,0,0,0,coreR*1.2);
      ectoG.addColorStop(0,'rgba(200,200,255,0.08)'); ectoG.addColorStop(0.5,'rgba(180,180,240,0.04)'); ectoG.addColorStop(1,'transparent');
      ctx.fillStyle=ectoG; ctx.globalAlpha=phase*2*flick;
      ctx.beginPath(); ctx.arc(0,0,coreR*1.2,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // HAUNTED FACE (glowing eyes, eerie mouth)
      ctx.globalAlpha=phase*3*flick;
      // Eye sockets (dark)
      ctx.fillStyle='rgba(20,10,50,0.5)';
      ctx.beginPath(); ctx.arc(-3.5,-3.5,3.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5.5,-3.5,3.5,0,Math.PI*2); ctx.fill();
      // Glowing eye cores
      ctx.fillStyle='rgba(200,200,255,0.85)';
      ctx.shadowColor='rgba(200,200,255,0.5)'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(-3.5+Math.sin(t*1.3),-3.5+Math.sin(t*1.7)*0.5,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5.5+Math.sin(t*1.3),- 3.5+Math.sin(t*1.7)*0.5,2,0,Math.PI*2); ctx.fill();
      // Eye pupils
      ctx.fillStyle='rgba(100,50,200,0.7)'; ctx.shadowBlur=0;
      ctx.beginPath(); ctx.arc(-3.5+Math.sin(t*1.3),-3.5+Math.sin(t*1.7)*0.5,0.8,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(5.5+Math.sin(t*1.3),-3.5+Math.sin(t*1.7)*0.5,0.8,0,Math.PI*2); ctx.fill();
      // Eerie wavy mouth
      ctx.strokeStyle='rgba(200,200,255,0.55)'; ctx.lineWidth=1.8; ctx.globalAlpha=phase*2.5*flick;
      ctx.beginPath(); ctx.moveTo(-5,4);
      ctx.bezierCurveTo(-2,4+Math.sin(t*4)*3.5,4,4-Math.sin(t*3.5)*3,8,4+Math.sin(t*5)*2); ctx.stroke();
      // WISPY ETHEREAL TENDRILS (longer, more dramatic)
      ctx.lineCap='round';
      for(let i=0;i<7;i++){
        const wa=t*1.3+i*0.9, wr=ringR*(0.5+Math.sin(t*2+i)*0.5);
        ctx.strokeStyle='rgba(200,200,255,0.2)'; ctx.lineWidth=2; ctx.globalAlpha=phase*(0.7+Math.sin(t*3+i)*0.5)*flick;
        ctx.beginPath();
        const wx=Math.cos(wa)*wr, wy=Math.sin(wa)*wr;
        ctx.moveTo(wx,wy);
        ctx.bezierCurveTo(wx+Math.sin(t*5+i)*15,wy+Math.cos(t*4+i)*15,
          wx+Math.sin(t*3)*20,wy+Math.cos(t*2)*20,
          wx+Math.sin(t*2+i)*28,wy+Math.cos(t*3+i)*28);
        ctx.stroke();
      }
      ctx.lineCap='butt';
      // DIMENSIONAL RIFT RINGS (phasing in/out)
      for(let i=0;i<3;i++){
        const rr=ringR*(1.1+i*0.25)+Math.sin(t*2.5+i)*4;
        ctx.strokeStyle='rgba(200,200,255,0.12)'; ctx.lineWidth=1;
        ctx.globalAlpha=phase*(0.5+Math.sin(t*3+i*2)*0.3)*flick;
        ctx.setLineDash([2+i,5+i*2]);
        ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      }
      // SOUL ORBS (floating around wraith)
      for(let i=0;i<4;i++){
        const soa=t*0.8+i*Math.PI*0.5;
        const sor=BIRD_SIZE*(0.6+Math.sin(t*1.5+i)*0.3);
        ctx.fillStyle='rgba(200,200,255,0.25)'; ctx.globalAlpha=phase*(0.8+Math.sin(t*4+i)*0.5)*flick;
        ctx.beginPath(); ctx.arc(Math.cos(soa)*sor,Math.sin(soa)*sor,2.5,0,Math.PI*2); ctx.fill();
        // Soul trail
        for(let st=1;st<=3;st++){
          ctx.fillStyle='rgba(200,200,255,0.08)';
          ctx.beginPath(); ctx.arc(Math.cos(soa-st*0.2)*sor,Math.sin(soa-st*0.2)*sor,2.5-st*0.5,0,Math.PI*2); ctx.fill();
        }
      }

    } else if(skinId==="matrix"){
      // ═══ PROCESS — sentient glitching data construct ═══
      const tB=S.isThrusting?1:0.2;
      // BINARY EXHAUST
      ctx.fillStyle=sk.thrust; ctx.font='bold 6px monospace'; ctx.textAlign='center';
      for(let i=0;i<(S.isThrusting?10:3);i++){
        const dx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?28:6), dy=(Math.random()-0.5)*14;
        ctx.globalAlpha=tB*(0.25+Math.random()*0.45);
        ctx.fillText(Math.random()>0.5?'1':'0',dx,dy);
      }
      ctx.globalAlpha=1;
      // ROTATING 3D WIREFRAME CUBE (dual nested)
      const S=BIRD_SIZE*0.38;
      const cA=Math.cos(t*1.5),sA=Math.sin(t*1.5),cB=Math.cos(t*1.1),sB=Math.sin(t*1.1);
      const verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      function proj3d(v,s){
        var x=v[0]*s,y=v[1]*s,z=v[2]*s;
        var x2=x*cA-z*sA, z2=x*sA+z*cA;
        var y2=y*cB-z2*sB;
        return [x2*0.6,y2*0.6];
      }
      var proj=verts.map(function(v){return proj3d(v,S);});
      var edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      // Outer cube
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1.8; ctx.shadowColor=sk.glow; ctx.shadowBlur=15;
      ctx.globalAlpha=0.8;
      for(var ei=0;ei<edges.length;ei++){
        var e=edges[ei];
        ctx.beginPath(); ctx.moveTo(proj[e[0]][0],proj[e[0]][1]); ctx.lineTo(proj[e[1]][0],proj[e[1]][1]); ctx.stroke();
      }
      // Inner cube (counter-rotating)
      var cA2=Math.cos(-t*2),sA2=Math.sin(-t*2),cB2=Math.cos(-t*1.4),sB2=Math.sin(-t*1.4);
      var proj2=verts.map(function(v){
        var x=v[0]*S*0.45,y=v[1]*S*0.45,z=v[2]*S*0.45;
        var x2=x*cA2-z*sA2, z2=x*sA2+z*cA2;
        var y2=y*cB2-z2*sB2;
        return [x2*0.6,y2*0.6];
      });
      ctx.strokeStyle='#88ffaa'; ctx.lineWidth=1; ctx.globalAlpha=0.45;
      for(var ei2=0;ei2<edges.length;ei2++){
        var e2=edges[ei2];
        ctx.beginPath(); ctx.moveTo(proj2[e2[0]][0],proj2[e2[0]][1]); ctx.lineTo(proj2[e2[1]][0],proj2[e2[1]][1]); ctx.stroke();
      }
      // Connection lines between cubes
      ctx.strokeStyle=sk.glow; ctx.lineWidth=0.5; ctx.globalAlpha=0.2;
      for(var ci2=0;ci2<8;ci2++){
        ctx.beginPath(); ctx.moveTo(proj[ci2][0],proj[ci2][1]); ctx.lineTo(proj2[ci2][0],proj2[ci2][1]); ctx.stroke();
      }
      // Vertex dots (pulsing)
      ctx.fillStyle=sk.glow;
      for(var vi=0;vi<proj.length;vi++){
        ctx.globalAlpha=0.7+Math.sin(t*6+vi)*0.25;
        ctx.beginPath(); ctx.arc(proj[vi][0],proj[vi][1],2.2,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0;
      // Face fill (semi-transparent panels)
      ctx.fillStyle=sk.glow; ctx.globalAlpha=0.05;
      var faces=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6]];
      for(var fi=0;fi<faces.length;fi++){
        var f=faces[fi];
        ctx.beginPath(); ctx.moveTo(proj[f[0]][0],proj[f[0]][1]);
        for(var fj=1;fj<4;fj++) ctx.lineTo(proj[f[fj]][0],proj[f[fj]][1]);
        ctx.closePath(); ctx.fill();
      }
      // MATRIX RAIN (falling code columns)
      ctx.font='bold 7px monospace';
      for(var mi=0;mi<8;mi++){
        var mx=(mi-3.5)*5;
        // Column of 3 characters
        for(var mc=0;mc<3;mc++){
          var cc=0x30A0+Math.floor(((t*8+mi*3+mc*7)%1)*96);
          var ch=String.fromCharCode(cc);
          var my=((t*35+mi*13+mc*15)%55)-27;
          ctx.fillStyle=mc===0?'#fff':'#00ff41';
          ctx.globalAlpha=mc===0?(0.6+Math.random()*0.3):(0.25+Math.random()*0.25);
          ctx.fillText(ch,mx,my);
        }
      }
      // GLITCH CORRUPTION BARS (more frequent, varied)
      for(var gb=0;gb<2;gb++){
        if(Math.random()>0.7){
          var gy=(Math.random()-0.5)*BIRD_SIZE*1.4;
          var gw=BIRD_SIZE*(0.4+Math.random()*1.2);
          ctx.fillStyle=Math.random()>0.5?'#00ff41':'#88ffaa';
          ctx.globalAlpha=0.15+Math.random()*0.1;
          ctx.fillRect(-gw/2,gy,gw,1.5+Math.random()*2.5);
        }
      }
      // HORIZONTAL SCAN LINE (sweeping)
      var scanY=((t*22)%2-1)*ringR*1.2;
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1.2; ctx.globalAlpha=0.35;
      ctx.beginPath(); ctx.moveTo(-ringR*1.2,scanY); ctx.lineTo(ringR*1.2,scanY); ctx.stroke();
      // BLINKING CURSOR (terminal style)
      ctx.fillStyle=sk.glow; ctx.globalAlpha=Math.sin(t*8)>0?0.8:0;
      ctx.fillRect(BIRD_SIZE*0.4,-1,3,9);
      // DATA STREAM PARTICLES (flowing along cube edges)
      for(var dpi=0;dpi<6;dpi++){
        var de=edges[dpi%edges.length];
        var dprog=(t*2+dpi*0.5)%1;
        var dpx=proj[de[0]][0]+(proj[de[1]][0]-proj[de[0]][0])*dprog;
        var dpy=proj[de[0]][1]+(proj[de[1]][1]-proj[de[0]][1])*dprog;
        ctx.fillStyle='#fff'; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.arc(dpx,dpy,1.5,0,Math.PI*2); ctx.fill();
      }
      // PROCESS ID TEXT
      ctx.font='5px monospace'; ctx.fillStyle=sk.glow; ctx.globalAlpha=0.2;
      ctx.fillText('PID:'+Math.floor(t*10%999),BIRD_SIZE*0.3,-BIRD_SIZE*0.45);

    } else if(skinId==="cerberus"){
      // ═══ CERBERUS — trójgłowy piekielny pies ═══
      const tB=S.isThrusting?1:0.3;
      // HELLFIRE EXHAUST — chaotic flames from all 3 heads
      ctx.shadowColor='#ff2200'; ctx.shadowBlur=S.isThrusting?40:8;
      for(let i=0;i<(S.isThrusting?12:4);i++){
        const fx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?30:8);
        const fy=(Math.random()-0.5)*18;
        ctx.fillStyle=i%3===0?'#ff0000':i%3===1?'#ff6600':'#ffcc00';
        ctx.globalAlpha=tB*(0.3+Math.random()*0.4);
        ctx.beginPath(); ctx.arc(fx,fy,2+Math.random()*4,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // MAIN BODY — armored hellhound torso
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=18;
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE*0.2,0);
      ctx.lineTo(-BIRD_SIZE*0.1,-BIRD_SIZE*0.35);
      ctx.lineTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.3);
      ctx.lineTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.3);
      ctx.lineTo(-BIRD_SIZE*0.1,BIRD_SIZE*0.35);
      ctx.closePath(); ctx.fill();
      // Armor cracks (lava veins)
      ctx.strokeStyle='#ff4400'; ctx.lineWidth=1; ctx.globalAlpha=0.5;
      for(let i=0;i<5;i++){
        const cx2=-BIRD_SIZE*0.3+Math.random()*BIRD_SIZE*0.4;
        const cy2=(Math.random()-0.5)*BIRD_SIZE*0.5;
        ctx.beginPath(); ctx.moveTo(cx2,cy2);
        ctx.lineTo(cx2+Math.random()*8-4,cy2+Math.random()*8-4); ctx.stroke();
      }
      ctx.shadowBlur=0;
      // THREE HEADS — snapping jaws
      for(let h=0;h<3;h++){
        const hy=(h-1)*BIRD_SIZE*0.38;
        const hx=BIRD_SIZE*0.15+Math.abs(h-1)*BIRD_SIZE*0.15;
        const jawOpen=3+Math.sin(t*8+h*2.1)*3;
        // Skull
        ctx.fillStyle='#220000'; ctx.globalAlpha=0.9;
        ctx.beginPath(); ctx.ellipse(hx,hy,BIRD_SIZE*0.22,BIRD_SIZE*0.14,0,0,Math.PI*2); ctx.fill();
        // Upper jaw
        ctx.fillStyle=sk.body; ctx.globalAlpha=1;
        ctx.beginPath(); ctx.moveTo(hx+BIRD_SIZE*0.22,hy-jawOpen);
        ctx.lineTo(hx+BIRD_SIZE*0.35,hy-jawOpen-2);
        ctx.lineTo(hx-BIRD_SIZE*0.05,hy-jawOpen); ctx.closePath(); ctx.fill();
        // Lower jaw
        ctx.beginPath(); ctx.moveTo(hx+BIRD_SIZE*0.22,hy+jawOpen);
        ctx.lineTo(hx+BIRD_SIZE*0.35,hy+jawOpen+2);
        ctx.lineTo(hx-BIRD_SIZE*0.05,hy+jawOpen); ctx.closePath(); ctx.fill();
        // TEETH — jagged
        ctx.fillStyle='#ffeecc'; ctx.globalAlpha=0.9;
        for(let ti=0;ti<4;ti++){
          const tx=hx+BIRD_SIZE*0.05+ti*BIRD_SIZE*0.065;
          ctx.beginPath(); ctx.moveTo(tx,hy-jawOpen); ctx.lineTo(tx+2,hy-jawOpen+4); ctx.lineTo(tx-2,hy-jawOpen+4); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(tx,hy+jawOpen); ctx.lineTo(tx+2,hy+jawOpen-4); ctx.lineTo(tx-2,hy+jawOpen-4); ctx.closePath(); ctx.fill();
        }
        // HELLFIRE EYES — pulsing red
        ctx.fillStyle='#ff0000'; ctx.globalAlpha=0.7+Math.sin(t*10+h)*0.3;
        ctx.shadowColor='#ff0000'; ctx.shadowBlur=12;
        ctx.beginPath(); ctx.arc(hx-BIRD_SIZE*0.02,hy-BIRD_SIZE*0.05,2.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx+BIRD_SIZE*0.08,hy-BIRD_SIZE*0.05,2.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // CHAINS — swinging between heads
      ctx.strokeStyle='#666'; ctx.lineWidth=2; ctx.globalAlpha=0.6;
      for(let c=0;c<2;c++){
        const cy1=(c-0.5)*BIRD_SIZE*0.38;
        ctx.beginPath();
        for(let cl=0;cl<8;cl++){
          const clx=-BIRD_SIZE*0.3+cl*BIRD_SIZE*0.08;
          const cly=cy1+Math.sin(t*3+cl*0.8+c)*3;
          cl===0?ctx.moveTo(clx,cly):ctx.lineTo(clx,cly);
        }
        ctx.stroke();
      }
      // BRIMSTONE PARTICLES — raining fire
      for(let i=0;i<8;i++){
        const pa=t*2.5+i*0.79;
        const pr=BIRD_SIZE*(0.4+Math.sin(t*3+i)*0.3);
        ctx.fillStyle=i%2?'#ff2200':'#ffaa00'; ctx.globalAlpha=0.4+Math.sin(t*6+i)*0.3;
        ctx.beginPath(); ctx.arc(Math.cos(pa)*pr,Math.sin(pa)*pr,1.5+Math.sin(t*8+i),0,Math.PI*2); ctx.fill();
      }
      // HELL AURA — pulsing rings of fire
      ctx.strokeStyle='#ff2200'; ctx.lineWidth=1.5; ctx.globalAlpha=0.08;
      for(let i=0;i<3;i++){
        const ar=BIRD_SIZE*(0.8+i*0.2)+Math.sin(t*3+i)*3;
        ctx.beginPath(); ctx.arc(0,0,ar,0,Math.PI*2); ctx.stroke();
      }

    } else if(skinId==="plague"){
      // ═══ PLAGUE — zaraza, rozkład, śmierć ═══
      const tB=S.isThrusting?1:0.3;
      // SPORE CLOUD EXHAUST
      ctx.shadowColor='#88aa00'; ctx.shadowBlur=S.isThrusting?25:5;
      for(let i=0;i<(S.isThrusting?10:3);i++){
        const fx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?25:6);
        const fy=(Math.random()-0.5)*14;
        ctx.fillStyle=i%3===0?'#aacc22':i%3===1?'#667700':'#ccff44';
        ctx.globalAlpha=tB*(0.2+Math.random()*0.3);
        ctx.beginPath(); ctx.arc(fx,fy,2+Math.random()*5,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // ROTTING ORGANIC MASS (amorphous, pulsating)
      const rot=1+Math.sin(t*2.5)*0.1+Math.sin(t*6)*0.05;
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=15;
      ctx.beginPath();
      for(let a=0;a<Math.PI*2;a+=0.05){
        const w=1+Math.sin(a*2+t*3)*0.2+Math.sin(a*5-t*4)*0.12+Math.sin(a*9+t*7)*0.06;
        const r2=coreR*1.5*rot*w;
        a<0.01?ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2):ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
      }
      ctx.closePath(); ctx.fill();
      // PUSTULES (bulging boils)
      for(let i=0;i<7;i++){
        const pa=i*Math.PI*2/7+t*0.3;
        const pd=coreR*(0.6+Math.sin(t*2+i)*0.3);
        const ps=3+Math.sin(t*4+i)*2;
        ctx.fillStyle='#889900'; ctx.globalAlpha=0.7;
        ctx.beginPath(); ctx.arc(Math.cos(pa)*pd,Math.sin(pa)*pd,ps,0,Math.PI*2); ctx.fill();
        // Pus highlight
        ctx.fillStyle='#ccff44'; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.arc(Math.cos(pa)*pd-1,Math.sin(pa)*pd-1,ps*0.4,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0;
      // TOXIC DRIP — oozing slime
      for(let i=0;i<6;i++){
        const dx=(i-2.5)*6;
        const drip=(t*1.8+i*0.6)%1;
        ctx.fillStyle=i%2?'#aacc22':'#667700';
        ctx.globalAlpha=(1-drip)*0.6;
        // Drip stretching
        ctx.beginPath();
        ctx.moveTo(dx-2,coreR*1.3); ctx.lineTo(dx+2,coreR*1.3);
        ctx.lineTo(dx+1,coreR*1.3+drip*30); ctx.lineTo(dx-1,coreR*1.3+drip*30);
        ctx.closePath(); ctx.fill();
      }
      // BIOHAZARD SYMBOL (rotating, ominous)
      ctx.save(); ctx.rotate(t*0.5);
      ctx.strokeStyle='#ffcc00'; ctx.lineWidth=2; ctx.globalAlpha=0.35;
      // Three crescents of biohazard
      for(let i=0;i<3;i++){
        const ba=i*Math.PI*2/3;
        ctx.beginPath(); ctx.arc(Math.cos(ba)*5,Math.sin(ba)*5,coreR*0.4,ba-0.8,ba+0.8); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0,0,coreR*0.2,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // DEATH FLIES — buzzing around
      for(let i=0;i<5;i++){
        const fa=t*6+i*1.26;
        const fd=coreR*(0.8+Math.sin(t*4+i)*0.5);
        ctx.fillStyle='#222'; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.arc(Math.cos(fa)*fd,Math.sin(fa)*fd,1.2,0,Math.PI*2); ctx.fill();
        // Wing
        ctx.strokeStyle='#555'; ctx.lineWidth=0.5; ctx.globalAlpha=0.4;
        ctx.beginPath(); ctx.arc(Math.cos(fa)*fd+1,Math.sin(fa)*fd-1,2,0,Math.PI); ctx.stroke();
      }
      // MIASMA CLOUD (expanding toxic fog)
      ctx.fillStyle='rgba(100,130,0,0.04)';
      ctx.beginPath(); ctx.arc(0,0,BIRD_SIZE*1.5+Math.sin(t*2)*5,0,Math.PI*2); ctx.fill();

    } else if(skinId==="kraken"){
      // ═══ KRAKEN — potwór z otchłani oceanu ═══
      const tB=S.isThrusting?1:0.3;
      // INK JET EXHAUST
      ctx.shadowColor='#00ccdd'; ctx.shadowBlur=S.isThrusting?30:6;
      for(let i=0;i<(S.isThrusting?8:2);i++){
        const fx=-BIRD_SIZE*0.4-Math.random()*(S.isThrusting?28:5);
        const fy=(Math.random()-0.5)*12;
        ctx.fillStyle=i%2?'#002233':'#005566';
        ctx.globalAlpha=tB*(0.3+Math.random()*0.3);
        ctx.beginPath(); ctx.arc(fx,fy,3+Math.random()*5,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // MASSIVE HEAD (bulging, terrifying)
      const breathe=1+Math.sin(t*3)*0.08;
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=20;
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE*0.4,0);
      ctx.bezierCurveTo(BIRD_SIZE*0.4,-BIRD_SIZE*0.5,-BIRD_SIZE*0.1,-BIRD_SIZE*0.6*breathe,-BIRD_SIZE*0.4,-BIRD_SIZE*0.35*breathe);
      ctx.bezierCurveTo(-BIRD_SIZE*0.55,-BIRD_SIZE*0.15,-BIRD_SIZE*0.55,BIRD_SIZE*0.15,-BIRD_SIZE*0.4,BIRD_SIZE*0.35*breathe);
      ctx.bezierCurveTo(-BIRD_SIZE*0.1,BIRD_SIZE*0.6*breathe,BIRD_SIZE*0.4,BIRD_SIZE*0.5,BIRD_SIZE*0.4,0);
      ctx.closePath(); ctx.fill();
      // Barnacles / texture bumps
      ctx.fillStyle='#005566'; ctx.globalAlpha=0.3;
      for(let i=0;i<8;i++){
        const ba=i*0.79+t*0.1;
        const br=coreR*(0.5+Math.sin(i)*0.3);
        ctx.beginPath(); ctx.arc(Math.cos(ba)*br,Math.sin(ba)*br,2+Math.sin(t+i)*1,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0;
      // 8 MASSIVE TENTACLES — writhing, crushing
      for(let i=0;i<8;i++){
        const ta=Math.PI*0.3+i*Math.PI*0.175;
        ctx.globalAlpha=0.85; ctx.strokeStyle=i%2?sk.body:'#003344'; ctx.lineCap='round';
        ctx.beginPath();
        let tx=Math.cos(ta)*coreR*1.1, ty=Math.sin(ta)*coreR*1.1;
        ctx.moveTo(tx,ty);
        for(let j=1;j<=9;j++){
          tx+=Math.cos(ta+Math.sin(t*2.5+i+j*0.6)*1.2)*6;
          ty+=Math.sin(ta+Math.sin(t*1.8+i-j*0.5)*0.9)*6;
          ctx.lineWidth=4.5-j*0.4;
          ctx.lineTo(tx,ty);
        }
        ctx.stroke();
        // SUCKERS on tentacles
        if(i%2===0){
          for(let s=2;s<8;s+=2){
            const sx=Math.cos(ta+Math.sin(t*2.5+i+s*0.6)*1.2)*s*5.5;
            const sy=Math.sin(ta+Math.sin(t*1.8+i-s*0.5)*0.9)*s*5.5;
            ctx.fillStyle='#00aacc'; ctx.globalAlpha=0.4;
            ctx.beginPath(); ctx.arc(Math.cos(ta)*coreR*1.1+sx*0.3,Math.sin(ta)*coreR*1.1+sy*0.3,1.5,0,Math.PI*2); ctx.fill();
          }
        }
        // Glowing tip
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.5+Math.sin(t*5+i)*0.3;
        ctx.shadowColor=sk.glow; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(tx,ty,2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.lineCap='butt';
      // GIANT EYE — terrifying, tracking
      ctx.fillStyle='#001111'; ctx.globalAlpha=0.95;
      ctx.beginPath(); ctx.ellipse(BIRD_SIZE*0.08,0,coreR*0.5,coreR*0.35,0,0,Math.PI*2); ctx.fill();
      // Iris (bioluminescent)
      ctx.fillStyle=sk.glow; ctx.globalAlpha=0.95;
      const ix=BIRD_SIZE*0.12+Math.sin(t*1.3)*3, iy=Math.sin(t*1.1)*2;
      ctx.beginPath(); ctx.arc(ix,iy,coreR*0.22,0,Math.PI*2); ctx.fill();
      // Pupil (horizontal slit — fish-like)
      ctx.fillStyle='#000'; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.ellipse(ix,iy,coreR*0.16,coreR*0.04,0,0,Math.PI*2); ctx.fill();
      // Eye glow
      ctx.fillStyle='#fff'; ctx.globalAlpha=0.4;
      ctx.beginPath(); ctx.arc(ix+2,iy-2,coreR*0.07,0,Math.PI*2); ctx.fill();
      // BIOLUMINESCENT SPOTS
      for(let i=0;i<10;i++){
        const ba=t*0.5+i*0.63;
        const br=BIRD_SIZE*(0.25+Math.sin(t*1.5+i)*0.2);
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.15+Math.sin(t*3+i)*0.1;
        ctx.shadowColor=sk.glow; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.arc(Math.cos(ba)*br,Math.sin(ba)*br,2+Math.sin(t*4+i),0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // BUBBLES — deep sea
      for(let i=0;i<4;i++){
        const by=-coreR*(1+i*0.4)-((t*20+i*17)%40);
        const bx=(i-1.5)*5+Math.sin(t*2+i)*3;
        ctx.strokeStyle=sk.glow; ctx.lineWidth=0.8; ctx.globalAlpha=0.2;
        ctx.beginPath(); ctx.arc(bx,by,2+Math.random(),0,Math.PI*2); ctx.stroke();
      }

    } else if(skinId==="banshee"){
      // ═══ BANSHEE — krzycząca śmierć ═══
      const tB=S.isThrusting?0.7:0.15;
      const phase=0.6+Math.sin(t*3)*0.2;
      // SOUNDWAVE EXHAUST
      ctx.strokeStyle='#ccccff'; ctx.lineWidth=1.5;
      for(let i=0;i<(S.isThrusting?6:2);i++){
        const sw=-BIRD_SIZE*0.5-i*8;
        ctx.globalAlpha=tB*(0.3-i*0.04);
        ctx.beginPath(); ctx.arc(sw,0,4+i*3,Math.PI*0.3,Math.PI*1.7); ctx.stroke();
      }
      ctx.globalAlpha=1;
      // SCREAMING WRAITH BODY — distorted, flickering
      const flick=Math.random()>0.9?0.15:1;
      // Tattered cloak shape
      ctx.fillStyle='rgba(220,220,255,0.08)';
      ctx.shadowColor='rgba(200,200,255,0.6)'; ctx.shadowBlur=25;
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE*0.3,0);
      ctx.bezierCurveTo(BIRD_SIZE*0.2,-BIRD_SIZE*0.5,-BIRD_SIZE*0.3,-BIRD_SIZE*0.6,-BIRD_SIZE*0.5,-BIRD_SIZE*0.4);
      ctx.lineTo(-BIRD_SIZE*0.6,0);
      ctx.lineTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.4);
      ctx.bezierCurveTo(-BIRD_SIZE*0.3,BIRD_SIZE*0.6,BIRD_SIZE*0.2,BIRD_SIZE*0.5,BIRD_SIZE*0.3,0);
      ctx.closePath(); ctx.fill();
      // Tattered bottom strips
      for(let i=0;i<5;i++){
        const sx=-BIRD_SIZE*0.4+i*BIRD_SIZE*0.15;
        const sl=BIRD_SIZE*(0.3+Math.sin(t*4+i)*0.15);
        ctx.strokeStyle='rgba(220,220,255,0.1)'; ctx.lineWidth=2;
        ctx.globalAlpha=phase*flick;
        ctx.beginPath(); ctx.moveTo(sx,BIRD_SIZE*0.35);
        ctx.bezierCurveTo(sx+Math.sin(t*3+i)*5,BIRD_SIZE*0.35+sl*0.5,sx+Math.sin(t*5+i)*8,BIRD_SIZE*0.35+sl,sx,BIRD_SIZE*0.35+sl);
        ctx.stroke();
      }
      ctx.shadowBlur=0;
      // SCREAMING MOUTH — wide open, horrifying
      ctx.globalAlpha=phase*2*flick;
      const mouthOpen=5+Math.sin(t*6)*3;
      // Dark void of mouth
      ctx.fillStyle='#000'; ctx.globalAlpha=0.8*flick;
      ctx.beginPath(); ctx.ellipse(BIRD_SIZE*0.05,2,BIRD_SIZE*0.15,mouthOpen,0,0,Math.PI*2); ctx.fill();
      // Inner scream glow
      ctx.fillStyle='rgba(200,200,255,0.3)';
      ctx.beginPath(); ctx.ellipse(BIRD_SIZE*0.05,2,BIRD_SIZE*0.08,mouthOpen*0.5,0,0,Math.PI*2); ctx.fill();
      // HOLLOW EYES — empty, soul-devouring
      for(const side of[-1,1]){
        const ex=BIRD_SIZE*0.02+side*6, ey=-5;
        // Socket
        ctx.fillStyle='#000'; ctx.globalAlpha=0.85*flick;
        ctx.beginPath(); ctx.ellipse(ex,ey,4,5,0,0,Math.PI*2); ctx.fill();
        // Burning pupil deep inside
        ctx.fillStyle='#ccccff'; ctx.globalAlpha=(0.5+Math.sin(t*8+side*2)*0.4)*flick;
        ctx.shadowColor='#ccccff'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(ex+Math.sin(t*1.5)*1,ey+Math.sin(t*1.8)*0.5,1.8,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // SONIC SHOCKWAVE RINGS — expanding from mouth
      for(let i=0;i<4;i++){
        const sr=((t*15+i*8)%40);
        ctx.strokeStyle='rgba(200,200,255,0.15)'; ctx.lineWidth=1.5;
        ctx.globalAlpha=(1-sr/40)*0.25*flick;
        ctx.beginPath(); ctx.arc(BIRD_SIZE*0.3+sr,2,sr*0.5+3,Math.PI*-0.3,Math.PI*0.3); ctx.stroke();
      }
      // WAILING TRAILS — spectral wisps
      for(let i=0;i<6;i++){
        const wa=t*1.5+i*1.05;
        const wd=BIRD_SIZE*(0.3+Math.sin(t*2+i)*0.4);
        ctx.strokeStyle='rgba(220,220,255,0.15)'; ctx.lineWidth=1.5; ctx.globalAlpha=phase*flick;
        ctx.beginPath();
        ctx.moveTo(Math.cos(wa)*wd,Math.sin(wa)*wd);
        ctx.bezierCurveTo(Math.cos(wa)*wd+Math.sin(t*4+i)*15,Math.sin(wa)*wd+10,
          Math.cos(wa)*wd+20,Math.sin(wa)*wd+Math.cos(t*3)*15,
          Math.cos(wa)*wd+Math.sin(t*2+i)*25,Math.sin(wa)*wd+Math.cos(t*2+i)*25);
        ctx.stroke();
      }
      // HAIR — long spectral strands flowing back
      ctx.strokeStyle='rgba(220,220,255,0.12)'; ctx.lineWidth=1; ctx.lineCap='round';
      for(let i=0;i<8;i++){
        const hx=-BIRD_SIZE*0.1+i*BIRD_SIZE*0.04-BIRD_SIZE*0.12;
        ctx.globalAlpha=phase*0.8*flick;
        ctx.beginPath(); ctx.moveTo(hx,-BIRD_SIZE*0.45);
        ctx.bezierCurveTo(hx-10,-BIRD_SIZE*0.5+Math.sin(t*3+i)*5,hx-20,-BIRD_SIZE*0.3,hx-25+Math.sin(t*2.5+i)*8,-BIRD_SIZE*0.2+Math.sin(t*4+i)*10);
        ctx.stroke();
      }
      ctx.lineCap='butt';

    } else if(skinId==="abyssal"){
      // ═══ ABYSSAL — demon z otchłani, najdroższy skin ═══
      const tB=S.isThrusting?1:0.3;
      // HELLFIRE EXHAUST — dark energy
      ctx.shadowColor='#ff0033'; ctx.shadowBlur=S.isThrusting?45:10;
      for(let i=0;i<(S.isThrusting?10:3);i++){
        const fx=-BIRD_SIZE*0.5-Math.random()*(S.isThrusting?35:8);
        const fy=(Math.random()-0.5)*16;
        ctx.fillStyle=i%3===0?'#ff0033':i%3===1?'#880011':'#ff0066';
        ctx.globalAlpha=tB*(0.3+Math.random()*0.4);
        ctx.beginPath(); ctx.arc(fx,fy,2+Math.random()*5,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      // DEMON BODY — angular, armored, massive
      ctx.fillStyle=sk.body; ctx.shadowColor=sk.glow; ctx.shadowBlur=25;
      ctx.beginPath();
      ctx.moveTo(BIRD_SIZE*0.5,0);
      ctx.lineTo(BIRD_SIZE*0.15,-BIRD_SIZE*0.3);
      ctx.lineTo(-BIRD_SIZE*0.2,-BIRD_SIZE*0.45);
      ctx.lineTo(-BIRD_SIZE*0.5,-BIRD_SIZE*0.3);
      ctx.lineTo(-BIRD_SIZE*0.5,BIRD_SIZE*0.3);
      ctx.lineTo(-BIRD_SIZE*0.2,BIRD_SIZE*0.45);
      ctx.lineTo(BIRD_SIZE*0.15,BIRD_SIZE*0.3);
      ctx.closePath(); ctx.fill();
      // Dark energy veins (red cracks)
      ctx.strokeStyle='#ff0033'; ctx.lineWidth=1.2; ctx.globalAlpha=0.5+Math.sin(t*4)*0.2;
      for(let i=0;i<6;i++){
        const va=i*Math.PI*2/6+t*0.2;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(va)*coreR*1.2,Math.sin(va)*coreR*1.2); ctx.stroke();
      }
      ctx.shadowBlur=0;
      // DEMON HORNS — massive curved
      for(const side of[-1,1]){
        ctx.fillStyle='#220000'; ctx.globalAlpha=0.95;
        ctx.beginPath();
        ctx.moveTo(-BIRD_SIZE*0.1,side*BIRD_SIZE*0.3);
        ctx.quadraticCurveTo(-BIRD_SIZE*0.35,side*BIRD_SIZE*0.9,-BIRD_SIZE*0.55,side*BIRD_SIZE*0.7);
        ctx.quadraticCurveTo(-BIRD_SIZE*0.45,side*BIRD_SIZE*0.5,-BIRD_SIZE*0.2,side*BIRD_SIZE*0.3);
        ctx.closePath(); ctx.fill();
        // Horn tip glow
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.5+Math.sin(t*5+side)*0.3;
        ctx.shadowColor=sk.glow; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(-BIRD_SIZE*0.55,side*BIRD_SIZE*0.7,2.5,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // HELLFIRE EYES — burning with malice
      for(const side of[-1,1]){
        const ex=BIRD_SIZE*0.1, ey=side*BIRD_SIZE*0.12;
        // Eye socket
        ctx.fillStyle='#000'; ctx.globalAlpha=0.9;
        ctx.beginPath(); ctx.ellipse(ex,ey,5,3.5,side*0.2,0,Math.PI*2); ctx.fill();
        // Burning iris
        ctx.fillStyle='#ff0033'; ctx.globalAlpha=0.9;
        ctx.shadowColor='#ff0033'; ctx.shadowBlur=15;
        ctx.beginPath(); ctx.arc(ex+Math.sin(t*1.5),ey+Math.sin(t*1.2)*0.5,2.5,0,Math.PI*2); ctx.fill();
        // Inner fire
        ctx.fillStyle='#ff6600'; ctx.globalAlpha=0.7;
        ctx.beginPath(); ctx.arc(ex+Math.sin(t*1.5),ey+Math.sin(t*1.2)*0.5,1.2,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      // SIGIL — demonic pentagram (rotating)
      ctx.save(); ctx.rotate(t*0.7);
      ctx.strokeStyle='#ff0033'; ctx.lineWidth=1; ctx.globalAlpha=0.2;
      // Pentagon + star
      const pR=coreR*0.55;
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const pa=i*Math.PI*2/5-Math.PI/2;
        const na=((i+2)%5)*Math.PI*2/5-Math.PI/2;
        ctx.moveTo(Math.cos(pa)*pR,Math.sin(pa)*pR);
        ctx.lineTo(Math.cos(na)*pR,Math.sin(na)*pR);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,pR,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // DARK ENERGY ORB — core
      const demonG=ctx.createRadialGradient(0,0,0,0,0,coreR*0.5);
      demonG.addColorStop(0,'#ff0033'); demonG.addColorStop(0.4,'#440011'); demonG.addColorStop(1,'#000');
      ctx.fillStyle=demonG; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.5,0,Math.PI*2); ctx.fill();
      // SOUL CHAINS — reaching out to grab
      for(let i=0;i<4;i++){
        const ca=t*1.2+i*Math.PI*0.5;
        const cr=BIRD_SIZE*(0.6+Math.sin(t*2+i)*0.3);
        ctx.strokeStyle='#440000'; ctx.lineWidth=2; ctx.globalAlpha=0.4;
        ctx.beginPath();
        let cx2=Math.cos(ca)*coreR*0.5, cy2=Math.sin(ca)*coreR*0.5;
        ctx.moveTo(cx2,cy2);
        for(let j=0;j<6;j++){
          cx2+=Math.cos(ca+Math.sin(t*3+j)*0.5)*5;
          cy2+=Math.sin(ca+Math.sin(t*2+j)*0.5)*5;
          ctx.lineTo(cx2,cy2);
        }
        ctx.stroke();
        // Chain end hook
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.arc(cx2,cy2,2,0,Math.PI*2); ctx.fill();
      }
      // FIRE AURA — pulsing hellfire ring
      ctx.strokeStyle=sk.glow; ctx.lineWidth=3; ctx.globalAlpha=0.06+Math.sin(t*3)*0.03;
      ctx.beginPath(); ctx.arc(0,0,BIRD_SIZE*1.1,0,Math.PI*2); ctx.stroke();
      // ORBITING SKULLS — tiny death symbols
      for(let i=0;i<3;i++){
        const sa=t*1.5+i*Math.PI*2/3;
        const sr=BIRD_SIZE*0.75;
        const sx=Math.cos(sa)*sr, sy=Math.sin(sa)*sr;
        ctx.fillStyle='#220000'; ctx.globalAlpha=0.6;
        ctx.beginPath(); ctx.arc(sx,sy,3,0,Math.PI*2); ctx.fill();
        // Skull eyes
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.7;
        ctx.beginPath(); ctx.arc(sx-1,sy-1,0.8,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx+1,sy-1,0.8,0,Math.PI*2); ctx.fill();
      }

    } else {
      // ═══ NEON RECON DRONE — default classic design ═══
      // Standard thrust engine
      const thrustBase=S.isThrusting?1:0.25;
      const thrustLen=S.isThrusting?(18+Math.sin(t*28)*7):(3+Math.sin(t*8)*1.5);
      const thrustSpread=S.isThrusting?11:4;
      ctx.shadowColor=sk.thrust; ctx.shadowBlur=S.isThrusting?35:8;
      ctx.fillStyle=sk.thrust; ctx.globalAlpha=thrustBase*0.5;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.5,0);
      ctx.lineTo(-BIRD_SIZE*0.5-thrustLen*1.3,-thrustSpread*1.4);
      ctx.lineTo(-BIRD_SIZE*0.5-thrustLen*1.3,thrustSpread*1.4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle=sk.thrust; ctx.globalAlpha=thrustBase*0.9;
      ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.5,0);
      ctx.lineTo(-BIRD_SIZE*0.5-thrustLen,-thrustSpread);
      ctx.lineTo(-BIRD_SIZE*0.5-thrustLen,thrustSpread);
      ctx.closePath(); ctx.fill();
      if(S.isThrusting){
        ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.7;
        ctx.beginPath(); ctx.moveTo(-BIRD_SIZE*0.5,0);
        ctx.lineTo(-BIRD_SIZE*0.5-thrustLen*0.45,-thrustSpread*0.25);
        ctx.lineTo(-BIRD_SIZE*0.5-thrustLen*0.45,thrustSpread*0.25);
        ctx.closePath(); ctx.fill();
        for(let i=0;i<3;i++){
          const sx=-BIRD_SIZE*0.5-thrustLen*(0.5+Math.random()*0.5);
          const sy=(Math.random()-0.5)*thrustSpread*0.8;
          ctx.fillStyle='#ffffff'; ctx.globalAlpha=0.4+Math.random()*0.4;
          ctx.beginPath(); ctx.arc(sx,sy,0.8+Math.random()*1.2,0,Math.PI*2); ctx.fill();
        }
      }
      ctx.globalAlpha=1; ctx.shadowBlur=0;
      // Hex ring segments
      const rotSpeed=t*1.8;
      ctx.shadowColor=sk.glow; ctx.shadowBlur=12;
      ctx.strokeStyle=sk.ring; ctx.lineWidth=2;
      for(let i=0;i<6;i++){
        const sA2=rotSpeed+i*(Math.PI/3), gap=0.08;
        ctx.beginPath(); ctx.arc(0,0,ringR,sA2+gap,sA2+Math.PI/3-gap); ctx.stroke();
      }
      const innerRingR=BIRD_SIZE*0.46;
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1; ctx.globalAlpha=0.35;
      ctx.setLineDash([4,6]);
      for(let i=0;i<3;i++){
        const sA3=-rotSpeed*0.6+i*(Math.PI*2/3);
        ctx.beginPath(); ctx.arc(0,0,innerRingR,sA3,sA3+Math.PI*0.5); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha=1;
      // Orbital sensor pods
      ctx.shadowBlur=0;
      const podR=BIRD_SIZE*0.62;
      for(let i=0;i<4;i++){
        const pa=rotSpeed*0.7+i*Math.PI*0.5+0.3;
        const px=Math.cos(pa)*podR, py=Math.sin(pa)*podR;
        ctx.strokeStyle=sk.ring; ctx.lineWidth=0.8; ctx.globalAlpha=0.4;
        ctx.beginPath(); ctx.moveTo(Math.cos(pa)*innerRingR,Math.sin(pa)*innerRingR); ctx.lineTo(px,py); ctx.stroke();
        ctx.globalAlpha=0.9; ctx.fillStyle=sk.glow;
        ctx.beginPath(); ctx.arc(px,py,2.2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=sk.glow; ctx.globalAlpha=0.15+Math.sin(t*6+i*1.5)*0.1;
        ctx.beginPath(); ctx.arc(px,py,4.5,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
      // Core orb
      ctx.shadowColor=sk.glow; ctx.shadowBlur=22;
      const auraGrad=ctx.createRadialGradient(0,0,coreR*0.5,0,0,coreR*1.5);
      auraGrad.addColorStop(0,sk.glow); auraGrad.addColorStop(1,'transparent');
      ctx.fillStyle=auraGrad; ctx.globalAlpha=0.15+Math.sin(t*3)*0.05;
      ctx.beginPath(); ctx.arc(0,0,coreR*1.5,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      const orbGrad=ctx.createRadialGradient(-2,-3,1,0,0,coreR);
      orbGrad.addColorStop(0,"rgba(255,255,255,0.95)"); orbGrad.addColorStop(0.25,sk.body);
      orbGrad.addColorStop(0.7,sk.glow); orbGrad.addColorStop(1,'rgba(0,0,0,0.3)');
      ctx.fillStyle=orbGrad; ctx.beginPath(); ctx.arc(0,0,coreR,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.ellipse(-3,-4,BIRD_SIZE*0.12,BIRD_SIZE*0.08,0.3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=sk.glow; ctx.lineWidth=1; ctx.globalAlpha=0.3;
      ctx.beginPath(); ctx.arc(0,0,coreR*0.65,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
      // Chevron emitter
      ctx.shadowBlur=0;
      ctx.strokeStyle=sk.glow; ctx.lineWidth=2; ctx.globalAlpha=0.8;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.32,-5); ctx.lineTo(BIRD_SIZE*0.48,0); ctx.lineTo(BIRD_SIZE*0.32,5); ctx.stroke();
      ctx.globalAlpha=0.4;
      ctx.beginPath(); ctx.moveTo(BIRD_SIZE*0.24,-3.5); ctx.lineTo(BIRD_SIZE*0.35,0); ctx.lineTo(BIRD_SIZE*0.24,3.5); ctx.stroke();
      const pulseDot=0.5+Math.sin(t*10)*0.5;
      ctx.fillStyle=sk.glow; ctx.globalAlpha=pulseDot;
      ctx.beginPath(); ctx.arc(BIRD_SIZE*0.52,0,1.5,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.setLineDash([]);

    // === HEX SCANNER LINE (only while alive) ===
    if(S.state===STATE.PLAYING||S.state===STATE.MENU||S.state===STATE.PAUSED) {
      const scanAngle=(t*0.8)%(Math.PI*2);
      ctx.strokeStyle=sk.glow; ctx.lineWidth=0.8; ctx.globalAlpha=0.25;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(scanAngle)*coreR,Math.sin(scanAngle)*coreR);
      ctx.stroke(); ctx.globalAlpha=1;
    }

    ctx.restore();
  }

export function drawPowerUpOrbs() {
    for(const pu of S.powerUpOrbs) {
      if(pu.collected) continue;
      const w=Math.sin(pu.wobble)*4;
      ctx.save();
      ctx.shadowColor=pu.type.color; ctx.shadowBlur=18;
      // Outer glow ring
      ctx.strokeStyle=pu.type.color; ctx.lineWidth=2; ctx.globalAlpha=0.5+Math.sin(pu.wobble*2)*0.3;
      ctx.beginPath(); ctx.arc(pu.x,pu.y+w,14,0,Math.PI*2); ctx.stroke();
      // Inner
      ctx.globalAlpha=1;
      ctx.fillStyle=pu.type.color;
      ctx.beginPath(); ctx.arc(pu.x,pu.y+w,9,0,Math.PI*2); ctx.fill();
      // Icon
      ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fff';
      ctx.fillText(pu.type.icon,pu.x,pu.y+w+4);
      ctx.restore();
    }
  }

export function drawSpeedLines() {
    for(const sl of S.speedLines) {
      ctx.globalAlpha=sl.life*0.15;
      ctx.strokeStyle=S.currentZone.accent; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(sl.x,sl.y); ctx.lineTo(sl.x+sl.len,sl.y); ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

export function drawShieldBubble() {
    if(!S.activePowerUp || S.activePowerUp.id!=='shield') return;
    const pulse=0.7+Math.sin(Date.now()/150)*0.3;
    ctx.save(); ctx.globalAlpha=pulse*0.3;
    ctx.strokeStyle='#00ffaa'; ctx.lineWidth=2; ctx.shadowColor='#00ffaa'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(S.bird.x,S.bird.y,BIRD_SIZE*0.7,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

export function drawParticles() {
    for(const p of S.particles) {
      ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

export function drawFlash() {
    if(S.flash>0.01){ ctx.fillStyle=`rgba(255,68,102,${S.flash*0.3})`; ctx.fillRect(0,0,W,H); }
    // Screen pulse (bass drop glow from edges)
    if(S.screenPulse>0.01) {
      const pg=ctx.createRadialGradient(W/2,H/2,W*0.2, W/2,H/2,W*0.8);
      pg.addColorStop(0,'transparent');
      pg.addColorStop(1,`rgba(255,0,230,${S.screenPulse*0.2})`);
      ctx.fillStyle=pg; ctx.fillRect(0,0,W,H);
    }
  }

export function drawEnvDebris() {
    for(const d of S.envDebris) {
      ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(d.rot);
      ctx.globalAlpha=d.life; ctx.fillStyle=d.color;
      ctx.fillRect(-d.size/2,-d.size/2,d.size,d.size*0.4);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }

export function postProcess() {
    if(S.chromAb<0.3 && S.timeScale>0.9) { fxCanvas.classList.remove('active'); return; }
    fxCanvas.classList.add('active');
    fxCtx.clearRect(0,0,W,H);
    const ab=S.chromAb;
    // Red channel shift left
    fxCtx.globalCompositeOperation='source-over';
    fxCtx.globalAlpha=0.3;
    fxCtx.drawImage(canvas,-ab*2,0,W,H);
    // Cyan channel shift right
    fxCtx.globalCompositeOperation='lighter';
    fxCtx.globalAlpha=0.15;
    fxCtx.drawImage(canvas,ab*2,0,W,H);
    fxCtx.globalAlpha=1; fxCtx.globalCompositeOperation='source-over';
  }

