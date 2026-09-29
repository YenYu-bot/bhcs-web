// 測試用：把頁面引用的 assets/science-lab.js 內容注入回 HTML，讓 jsdom 能直接執行（jsdom 預設不載入外部 script）。
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const re=/<script src="(?:\.\.\/)+assets\/science-lab\.js\?v=[0-9a-f]+"><\/script>/;
function inlineScienceLab(html){if(!re.test(html))return html;const code=fs.readFileSync(path.join(root,'assets/science-lab.js'),'utf8');return html.replace(re,()=>'<script>'+code+'</script>')}
function readSciencePage(file){return inlineScienceLab(fs.readFileSync(path.join(root,file),'utf8'))}
module.exports={inlineScienceLab,readSciencePage};
