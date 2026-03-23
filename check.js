const fs=require("fs");
const html=fs.readFileSync("public/index.html","utf8");
const m=html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
if(!m){console.log("NO SCRIPT TAGS");process.exit(1);}
let ok=true;
m.forEach((s,i)=>{
  const code=s.replace(/<\/?script[^>]*>/g,"");
  try{new Function(code);}catch(e){console.log("SCRIPT #"+(i+1)+" ERROR:",e.message);ok=false;}
});
if(ok) console.log("ALL "+m.length+" SCRIPTS OK");
