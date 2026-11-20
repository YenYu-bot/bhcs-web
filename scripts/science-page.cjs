// 測試用：讀取教材頁。舊版 assets/science-lab.js 已隨新探究頁一起移除，頁面不再需要注入共用程式。
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function readSciencePage(file){return fs.readFileSync(path.join(root,file),'utf8')}
module.exports={readSciencePage};
