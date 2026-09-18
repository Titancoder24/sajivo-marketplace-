// Run: node scripts/test-callback-form.cjs. Mocked React hooks/network, no live writes.
process.chdir(require('node:path').resolve(__dirname, '..'));
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const states=[],effects=[];let cursor=0,mounted=false,done=0,requests=[],outcome='success';
const componentExports={};
const reactMock={...require('react'),useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v}]},useEffect(fn){if(!mounted)effects.push(fn)}};
const code=ts.transpileModule(fs.readFileSync('src/components/v2/support/AngelSupport.tsx','utf8')+'\nexport { CallbackForm };',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const fetch=async(url,options)=>{
 if(url==='/api/auth/me')return {ok:true,json:async()=>({profile:{full_name:'Saved Name',phone:'+91 9876543210',email:'saved@example.com'}})};
 requests.push(JSON.parse(options.body));if(outcome==='network')throw Error('offline');return {ok:outcome==='success',json:async()=>outcome==='success'?{callback:{public_id:'CB-1'}}:{error:'Validation rejected'}};
};
vm.runInNewContext(code,{exports:componentExports,require:name=>name==='react'?reactMock:name==='sonner'?{toast:{success:()=>{}}}:require(name),AbortController,Intl,console,FormData:class{constructor(values){this.values=values}get(key){return this.values[key]}},fetch});
const render=()=>{cursor=0;const tree=componentExports.CallbackForm({conversationId:null,onDone:()=>done++});mounted=true;return tree};
const all=(node)=>!node||typeof node!=='object'?[]:[node,...(Array.isArray(node.props?.children)?node.props.children:[node.props?.children]).flatMap(all)];
const field=(tree,name)=>all(tree).find(n=>n.props?.name===name);
let checks=0;const check=v=>{assert.ok(v);checks++};
(async()=>{
 let tree=render();check(all(tree).find(n=>n.type==='fieldset').props.disabled);
 effects[0]();await new Promise(resolve=>setImmediate(resolve));tree=render();
 check(field(tree,'contactName').props.value==='Saved Name');check(field(tree,'contactPhone').props.value==='+91 9876543210');check(!all(tree).find(n=>n.type==='fieldset').props.disabled);
 check(field(tree,'contactPhone').props.required&&!field(tree,'contactEmail').props.required);
 for(const method of ['email','video','whatsapp']){
  field(tree,'method').props.onChange({target:{value:method}});tree=render();check(field(tree,'contactPhone').props.required===(method==='whatsapp'));check(field(tree,'contactEmail').props.required===(method!=='whatsapp'));
 }
 field(tree,'contactName').props.onChange({target:{value:'  Submitted Name  '}});tree=render();
 const event={preventDefault(){},currentTarget:{reason:'Contact support',date:'2099-01-01',window:'09:00-12:00'}};
 await tree.props.onSubmit(event);check(requests[0].contactName==='Submitted Name'&&requests[0].contactPhone==='+91 9876543210');check(done===1);
 outcome='network';tree=render();await tree.props.onSubmit(event);tree=render();check(all(tree).some(n=>n.props?.role==='alert'));check(field(tree,'contactName').props.value==='  Submitted Name  ');check(!all(tree).find(n=>n.type==='fieldset').props.disabled);
 outcome='rejected';await tree.props.onSubmit(event);tree=render();check(all(tree).some(n=>n.props?.role==='alert'&&n.props.children==='Validation rejected'));check(done===1);
 const before=requests.length;field(tree,'contactName').props.onChange({target:{value:'   '}});tree=render();await tree.props.onSubmit(event);check(requests.length===before);
 field(tree,'contactName').props.onChange({target:{value:'Valid Name'}});field(tree,'contactPhone').props.onChange({target:{value:'abc'}});tree=render();await tree.props.onSubmit(event);check(requests.length===before);
 console.log('PASS: '+checks+' callback form checks (mocked hooks/network).');
})().catch(e=>{console.error(e);process.exitCode=1});
