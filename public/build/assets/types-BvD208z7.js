const r=()=>document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")??"",n=(e,t)=>e<=0?"text-red-600":e<t*.2?"text-amber-600":"text-green-600";export{r as c,n as g};
