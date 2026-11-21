import {readFile,writeFile,mkdir,cp,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const edits=[
['href="https://wa.me/919025658178?text=Hi+Coach%2C+I+want+to+book+a+free+call" class="nav-cta">Book Free Call</a>','href="/enquiry" class="nav-cta">Enquire Now</a>'],
['href="https://wa.me/919025658178?text=Hi+Coach%2C+I+want+to+book+a+slot" class="btn-red">Book Your Slot</a>','href="/enquiry" class="btn-red">Enquire About Training</a>'],
['href="https://wa.me/919025658178?text=Hi+Coach%2C+I+want+to+book+a+free+call" class="btn-white">Book Free Call on WhatsApp</a>','href="/enquiry" class="btn-white">Send a Training Enquiry</a>']
];
export function addEnquiryLinks(home){
for(const [from,to] of edits){if(home.split(from).length!==2)throw new Error('Expected one original homepage CTA');home=home.replace(from,to);}
return home;
}
async function build(){
const home=addEnquiryLinks(await readFile('index.html','utf8')).replace('<head>', '<head>\n<meta name="google-site-verification" content="lIFTsmSSdM-NWTrGU37ONtsRRUns_ekniUn8GPPekSc" />');
const assets=['blog','llms.txt','robots.txt','sitemap.xml','women-poster.jpg','women-video.mp4'];
await mkdir('dist/enquiry',{recursive:true});
for(const asset of assets){await stat(asset);await cp(asset,'dist/'+asset,{recursive:true});}
await writeFile('dist/index.html',home);
await cp('enquiry/page.html','dist/enquiry/index.html');
await cp('enquiry/form.js','dist/enquiry/form.js');
if(home.includes('/src/index.tsx')||!home.includes('href="/enquiry"'))throw new Error('Wrong website source');
console.log('Marketing website preserved; three lead-enquiry CTAs added. All blog and media assets copied unchanged.');
}
if(fileURLToPath(import.meta.url)===resolve(process.argv[1]||''))await build();






