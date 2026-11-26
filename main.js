// Menu móvel + formulário que abre o WhatsApp (sem backend, sem coleta no servidor)
const m=document.querySelector('.menu'),n=document.querySelector('.nav');
m.addEventListener('click',()=>{const o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});
n.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{n.classList.remove('open');m.setAttribute('aria-expanded',false)}));
document.getElementById('form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);
const t=`Olá! Quero agendar uma reunião.\nNome: ${f.get('nome')}\nEmpresa: ${f.get('empresa')||'-'}\nCidade: ${f.get('cidade')||'-'}\nInteresse: ${f.get('interesse')}\n${f.get('msg')||''}`;
window.open('https://wa.me/5579991988251?text='+encodeURIComponent(t),'_blank','noopener')});
