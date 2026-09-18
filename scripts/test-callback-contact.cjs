// Run: node scripts/test-callback-contact.cjs (mocked database; no live writes).
process.chdir(require("node:path").resolve(__dirname, ".."));
const assert = require('node:assert/strict'), ts = require('typescript'), fs = require('node:fs'), vm = require('node:vm');
let profile={full_name:'Profile Name',phone:'+91 98765 43210',email:'profile@example.com'}, profileError=null, denied=false, storageError=null, inserted=[], reads=0, audit=[], owner=null;
const supabase={from(table){
 if(table==='profiles')return {select(){return this},eq(key,value){owner=value;return this},async maybeSingle(){reads++;return {data:profile,error:profileError}}};
 if(table==='ai_support_conversations')return {select(){return this},eq(){return this},async maybeSingle(){return {data:null}}};
 if(table==='support_callback_requests')return {
   insert(row) {
     inserted.push(row);
     return {select(){return this}, async single(){return {data:storageError?null:{...row,id:'callback-id',public_id:'CALL-1'},error:storageError}}};
   }
 };
 if(table==='ai_action_audit_logs')return {async insert(row){audit.push(row);return {error:null}}};
 throw Error('Unexpected table '+table);
}};
const routeExports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/v2/angel/callbacks/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports: routeExports,require:name=>name==='@/lib/server/angel'?{getAngelAuth:async()=>denied?null:{userId:'user-1',supabase}}:require(name),Request,Response,console});
let checks=0;const check=(value)=>{assert.ok(value);checks++};
const base={reason:'Support requested',preferredDate:'2099-01-01',timeWindow:'09:00-12:00',timezone:'Asia/Kolkata',communicationMethod:'phone'};
const post=body=>routeExports.POST(new Request('http://localhost/api/v2/angel/callbacks',{method:'POST',body:JSON.stringify(body)}));
(async()=>{
 let res=await post(base);check(res.status===201);check(owner==='user-1');check(inserted.at(-1).contact_name==='Profile Name'&&inserted.at(-1).contact_phone===profile.phone&&inserted.at(-1).contact_email===profile.email);
 const savedReads=reads;
 const submitted={...base,contactName:'  New Contact  ',contactPhone:'+44 7700 900123',contactEmail:'new@example.com'};
 res=await post(submitted);check(res.status===201);check(reads===savedReads);let payload=await res.json();check(payload.callback.contact_name==='New Contact'&&payload.callback.contact_phone==='+44 7700 900123'&&payload.callback.contact_email==='new@example.com');
 profile.full_name='Changed Profile';check(inserted.at(-1).contact_name==='New Contact');
 check(!JSON.stringify(audit).includes('new@example.com'));
 for(const contactName of ['', ' ', 'A', 'a'.repeat(121), null])check((await post({...submitted,contactName})).status===400);
 for(const contactPhone of ['', '123', 'abc12345678', '1'.repeat(16), '+91<script>9876543210'])check((await post({...submitted,contactPhone})).status===400);
 check((await post({...submitted,communicationMethod:'whatsapp',contactPhone:''})).status===400);
 for(const communicationMethod of ['email','video']){
  check((await post({...submitted,communicationMethod,contactPhone:'',contactEmail:''})).status===400);
  check((await post({...submitted,communicationMethod,contactPhone:'',contactEmail:'invalid'})).status===400);
  check((await post({...submitted,communicationMethod,contactPhone:''})).status===201);
  check(inserted.at(-1).contact_phone===null);
 }
 check((await post({...submitted,contactEmail:''})).status===201);check(inserted.at(-1).contact_email===null);
 profile=null;check((await post(base)).status===400);
 profileError={message:'unavailable'};check((await post(base)).status===503);
 check((await post(submitted)).status===201);
 storageError={message:'column contact_name not found'};check((await post(submitted)).status===503);
 storageError=null;denied=true;check((await post(submitted)).status===401);
 denied=false;check((await post({...submitted,preferredDate:'2000-01-01'})).status===400);
 check((await post({...submitted,conversationId:'5d49ec21-14a5-41d4-8c36-e29f2cf6f5b2'})).status===404);
 for (const field of ['projectId','paymentId']) check((await post({...submitted,[field]:'5d49ec21-14a5-41d4-8c36-e29f2cf6f5b2'})).status===400);
 check(inserted.every(row=>!('project_id' in row)&&!('payment_id' in row)));
 console.log('PASS: '+checks+' callback API checks. Mocked database; no live writes.');
})().catch(error=>{console.error(error);process.exitCode=1});

