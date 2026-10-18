// Same authorized CI input and unchanged40 flow assertions, in its own bounded process.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {captureStagedPublication} from './catalogue-scope.mjs';
import {acceptApplyScreening} from './apply-screening.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true');
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE);
const artifact=resolve(process.env.PAGES_ARTIFACT),out=resolve(process.env.BROWSER_REPORT);
await mkdir(out,{recursive:true});
const checkout=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const staged=captureStagedPublication(process.cwd(),artifact,checkout);
const root=await mkdtemp(join(tmpdir(),'primserv-screening-'));await symlink(artifact,join(root,'kiris-jobs'),'dir');
const base='http://127.0.0.1:4173/kiris-jobs/',origin=staticOrigin(root);
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout,phase:'apply-screening',
  publicationSHA256:staged.sha256,started:new Date().toISOString(),blockedMutations:[],external:[]};
let browser,active;
try{
  await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();
  async function context(viewport){
    const ctx=await browser.newContext({viewport,locale:'pl-PL',serviceWorkers:'allow'});ctx.setDefaultTimeout(15000);
    await ctx.route('**/*',r=>{
      if(!['GET','HEAD'].includes(r.request().method())){report.blockedMutations.push({method:r.request().method(),url:r.request().url().split('?')[0]});return r.abort();}
      if(new URL(r.request().url()).origin!==new URL(base).origin){report.external.push(r.request().url().split('?')[0]);return r.abort();}
      return r.continue();
    });return ctx;
  }
  await acceptApplyScreening({context,base,reportDir:out,report,active:p=>{active=p;}});
  assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.external,[]);
  assert.equal(captureStagedPublication(process.cwd(),artifact,checkout).sha256,staged.sha256);
  report.status='passed';
}catch(error){report.status='failed';report.error=String(error.stack||error);if(active&&!active.isClosed())await active.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;
}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(out,'acceptance.json'),JSON.stringify(report,null,2));}
