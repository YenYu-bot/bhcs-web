// 測試用：把頁面引用的 assets/science-lab.js 內容注入回 HTML，讓 jsdom 能直接執行（jsdom 預設不載入外部 script）。
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const re=/<script src="(?:\.\.\/)+assets\/science-lab\.js\?v=[0-9a-f]+"><\/script>/;
function inlineScienceLab(html){if(!re.test(html))return html;const code=fs.readFileSync(path.join(root,'assets/science-lab.js'),'utf8');return html.replace(re,()=>'<script>'+code+'</script>')}
function readSciencePage(file){return inlineScienceLab(fs.readFileSync(path.join(root,file),'utf8'))}
// Only shared researcher-shell regressions may opt into this frozen historical page.
// readSciencePage always reads the current product, including the replaced reaction-rate URL.
const LEGACY_SCIENCE_FIXTURE=Object.freeze(require('./marble-acid-desk/legacy-public-reaction-rate.json'));
function readLegacySciencePage(file,{inlineRuntime=true}={}){
 if(file!==LEGACY_SCIENCE_FIXTURE.publicPath)throw new Error('No historical science fixture registered for '+file);
 const bytes=fs.readFileSync(path.join(root,LEGACY_SCIENCE_FIXTURE.fixturePath));
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(hash!==LEGACY_SCIENCE_FIXTURE.sha256)throw new Error('Historical reaction-rate fixture changed; preserve the pinned source bytes');
 const html=bytes.toString('utf8');
 return inlineRuntime?inlineScienceLab(html):html;
}
// Test-server-only opt-in. Preserve the public pathname for relative assets and storage keys.
// No query means no fixture, and unknown IDs / other routes cannot select archived HTML.
function readLegacySciencePageRequest(url){
 if(!url.searchParams.has('legacyFixture'))return null;
 if(url.pathname!=='/'+LEGACY_SCIENCE_FIXTURE.publicPath||url.searchParams.getAll('legacyFixture').length!==1||url.searchParams.get('legacyFixture')!==LEGACY_SCIENCE_FIXTURE.id){
  const error=new Error('Invalid historical science fixture request');error.statusCode=400;throw error;
 }
 return readLegacySciencePage(LEGACY_SCIENCE_FIXTURE.publicPath,{inlineRuntime:false});
}
module.exports={inlineScienceLab,readSciencePage,readLegacySciencePage,readLegacySciencePageRequest,LEGACY_SCIENCE_FIXTURE};
