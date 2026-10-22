import http from 'k6/http';
import { check, sleep } from 'k6';
export const options={stages:[{duration:'30s',target:10},{duration:'1m',target:25},{duration:'30s',target:0}],thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1500']}};
const BASE=__ENV.BASE_URL||'http://127.0.0.1:8080';
const paths=['/index.html','/html/tips.html','/html/pago.html','/html/propuesta.html','/html/financiamiento.html','/html/login.html'];
export default function(){const path=paths[Math.floor(Math.random()*paths.length)];const res=http.get(`${BASE}${path}`);check(res,{'status 200':r=>r.status===200,'html recibido':r=>(r.headers['Content-Type']||'').includes('text/html')});sleep(1);}
