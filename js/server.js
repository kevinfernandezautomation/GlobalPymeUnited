import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
dotenv.config();
const app=express(); const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:'30kb'})); app.use(express.static(__dirname));
const limiter=rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:true,legacyHeaders:false,message:{error:'Límite horario alcanzado'}});
app.use(['/api/send','/api/queue'],limiter);
const allowed=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'allowed-emails.json'),'utf8')).map(x=>x.toLowerCase()));
const queues=new Map();
function clean(s,n=5000){return String(s||'').replace(/[<>]/g,'').trim().slice(0,n)}
function validate(body){const {email,recipients,consent}=body||{};if(consent!==true) return 'Debe confirmar la pertinencia del contacto';if(!/^\S+@\S+\.\S+$/.test(email||'')) return 'Correo del remitente inválido';if(!Array.isArray(recipients)||recipients.length<1||recipients.length>10) return 'Seleccione entre 1 y 10 destinatarios por cola';if(new Set(recipients.map(x=>String(x).toLowerCase())).size!==recipients.length) return 'Hay destinatarios duplicados';if(recipients.some(r=>!allowed.has(String(r).toLowerCase()))) return 'Destinatario no autorizado o no verificado';return null}
function transporter(){return nodemailer.createTransport({host:process.env.SMTP_HOST,port:+(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}})}
async function sendOne(tx,b,to){await tx.sendMail({from:`${clean(b.name,100)} via Global PYME United <${process.env.FROM_EMAIL}>`,replyTo:clean(b.email,150),to,subject:clean(b.subject,140),text:`${clean(b.message)}\n\nRemitente: ${clean(b.name,100)}${b.organization?` · ${clean(b.organization,150)}`:''}\nCorreo de respuesta: ${clean(b.email,150)}\n\nMensaje preparado mediante Global PYME United, directorio independiente.`})}
async function processQueue(id,b){const q=queues.get(id);const tx=transporter();q.status='processing';for(const to of b.recipients){try{await sendOne(tx,b,to);q.sent++;q.items.push({to,status:'sent',at:new Date().toISOString()})}catch(e){q.failed++;q.items.push({to,status:'failed',at:new Date().toISOString()})}await new Promise(r=>setTimeout(r,Number(process.env.QUEUE_DELAY_MS||5000)))}q.status='done';q.finishedAt=new Date().toISOString()}
app.post('/api/queue',async(req,res)=>{if(process.env.ENABLE_SEND!=='true')return res.status(503).json({error:'El envío SMTP está desactivado. Configure .env y ENABLE_SEND=true'});const err=validate(req.body);if(err)return res.status(400).json({error:err});const queueId=crypto.randomUUID();queues.set(queueId,{status:'queued',queued:req.body.recipients.length,sent:0,failed:0,items:[],createdAt:new Date().toISOString()});res.status(202).json({ok:true,queueId,queued:req.body.recipients.length});processQueue(queueId,{...req.body,recipients:req.body.recipients.map(x=>String(x).toLowerCase())}).catch(()=>{const q=queues.get(queueId);if(q)q.status='failed'})});
app.get('/api/queue/:id',(req,res)=>{const q=queues.get(req.params.id);if(!q)return res.status(404).json({error:'Cola no encontrada'});res.json(q)});
app.post('/api/send',async(req,res)=>{try{if(process.env.ENABLE_SEND!=='true')return res.status(503).json({error:'Envío desactivado'});const err=validate(req.body);if(err)return res.status(400).json({error:err});const tx=transporter();for(const to of req.body.recipients)await sendOne(tx,req.body,to);res.json({ok:true,sent:req.body.recipients.length})}catch(e){console.error(e);res.status(500).json({error:'Falló el envío'})}});
app.listen(process.env.PORT||3000,()=>console.log(`Global PYME United running on http://localhost:${process.env.PORT||3000}`));
