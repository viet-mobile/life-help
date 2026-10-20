// Node-only release gate: build a temporary checker, run it, remove only our own temporary directory.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {buildSync} = require('esbuild');
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'life-help-expanded-content-'));
try {
 const outfile = path.join(dir,'check.cjs');
 buildSync({entryPoints:['scripts/i18n/check-expansion-runtime.mts'],outfile,platform:'node',bundle:true,format:'cjs'});
 const result=spawnSync(process.execPath,[outfile],{stdio:'inherit'});
 if(result.error) throw result.error;
 process.exitCode=result.status??1;
} finally {fs.rmSync(dir,{recursive:true,force:true});}
