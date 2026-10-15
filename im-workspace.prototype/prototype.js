// Disposable synthetic interactions, deliberately independent of the future application stack.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
// Traditional Chinese, Simplified Chinese, English. Forum fixture text is never translated.
const labels={
 boards:['版塊','版块','Boards'],search:['搜尋','搜索','Search'],favorites:['收藏','收藏','Saved'],notifications:['通知','通知','Notices'],drafts:['草稿','草稿','Drafts'],settings:['外觀與語言','外观与语言','Appearance'],member:['示範使用者','示例用户','Demo member'],explore:['逛逛版塊','逛逛版块','Explore boards'],boardNote:['一個主題，一段完整的討論。慢慢讀，也慢慢回覆。','一个主题，一段完整的讨论。慢慢读，也慢慢回复。','One thread. A whole conversation. Make room to read, and time to reply.'],synthetic:['虛構內容','虚构内容','Synthetic content'],allBoards:['所有版塊','所有版块','All boards'],newThread:['發表主題','发表主题','New thread'],searchHint:['搜尋示例標題或作者','搜索示例标题或作者','Find a sample title or author'],refresh:['手動重新整理','手动刷新','Refresh manually'],listNote:['合成示例。排序、筆數與搜尋不代表論壇能力。','合成示例。排序、条数与搜索不代表论坛能力。','Synthetic examples. Ordering, counts and search do not imply server capabilities.'],browse:['切換主題','切换主题','Browse threads'],reply:['回覆主題','回复主题','Reply to thread'],favorite:['收藏主題','收藏主题','Save thread'],last:['最後回覆','最后回复','Last reply'],readingNote:['完整文章、樓層與分頁，讓討論保留上下文。','完整文章、楼层与分页，让讨论保留上下文。','Full posts, stable identities and explicit pages keep the conversation in context.'],endnote:['閱讀可繼續，討論有自己的節奏。','阅读可以继续，讨论有自己的节奏。','A conversation can take its time.'],title:['主題標題','主题标题','Thread title'],category:['分類','分类','Category'],discussion:['討論','讨论','Discussion'],sharing:['分享','分享','Sharing'],body:['回覆內容','回复内容','Reply body'],placeholder:['寫下你的想法…','写下你的想法…','Add your thoughts…'],editorNote:['工具列為位置示意；此處僅輸入文字。富文字、BBCode 與附件行為另行決定。','工具栏为位置示意；此处仅输入文字。富文本、BBCode 与附件行为另行决定。','Toolbar placement only; plain text here. Rich editing, BBCode and attachments await the behavior decision.'],send:['示範送出','示例提交','Simulate submit'],save:['示範存草稿','示例存草稿','Simulate draft save'],discard:['捨棄','丢弃','Discard'],localOnly:['僅合成內容 · 不連接論壇','仅合成内容 · 不连接论坛','Synthetic content · no forum connection'],studyNotes:['原型說明','原型说明','Study notes'],settingsHelp:['四個配色共用同一佈局。偏好只在這次示範中保留。','四种配色共用同一布局。偏好只在本次演示中保留。','Four palettes share one layout. Preferences last for this demo session only.'],theme:['配色','配色','Color theme'],density:['閱讀密度','阅读密度','Reading density'],default:['Default · 18px，寬鬆文章','Default · 18px，宽松文章','Default · spacious 18px posts'],compact:['Compact · 16px，緊湊文章','Compact · 16px，紧凑文章','Compact · tighter 16px posts'],language:['介面語言','界面语言','Interface language'],languageHelp:['只翻譯介面。文章、引用與正在編寫的內容保持原樣。','只翻译界面。文章、引用与正在编写的内容保持原样。','Only interface labels change. Posts, quotes and your writing stay as written.'],unsent:['你還有未送出的內容','你还有未提交的内容','You have unsent writing'],unsentHelp:['切換撰寫目標或捨棄會清除目前輸入。瀏覽其他主題不會改變原本的撰寫目標。','切换撰写目标或丢弃会清除当前输入。浏览其他主题不会改变原来的撰写目标。','Changing the writing target or discarding clears the current input. Browsing another thread never changes its submission target.'],keep:['保留目前撰寫','保留当前撰写','Keep current writing'],replace:['捨棄並繼續','丢弃并继续','Discard and continue'],limits:['一次性互動原型，沒有網路請求或永久儲存。重新整理會清除輸入。成功、草稿與錯誤皆為示例，不代表論壇結果。','一次性互动原型，没有网络请求或永久存储。刷新会清除输入。成功、草稿与错误都是示例，不代表论坛结果。','Disposable interaction study. No network requests or persistent storage. Reload clears writing. Success, drafts and failures are simulated, with no forum effects.'],scenario:['閱讀情境','阅读情境','Reading scenario'],normal:['一般閱讀','一般阅读','Normal reading'],permission:['沒有閱讀權限','没有阅读权限','Permission required'],challenge:['需要網站驗證','需要网站验证','Site verification required'],missing:['文章不存在','文章不存在','Missing post'],outcome:['示範送出結果','示例提交结果','Simulated submission outcome'],success:['模擬成功','模拟成功','Simulated success'],unknown:['結果不明，保留輸入','结果不明，保留输入','Unknown outcome; retain input'],accountHelp:['使用瀏覽器目前登入的論壇帳號。此處是身份與原站登入入口的位置示意；不提供多帳號切換。','使用浏览器当前登录的论坛账号。此处是身份与原站登录入口的位置示意；不提供多账号切换。','Use the forum account currently signed into the browser. This illustrates identity and native login access, without saved-account switching.'],pinned:['置頂','置顶','Pinned'],replies:['篇回覆','篇回复','replies'],page:['頁','页','Page'],quote:['引用回覆','引用回复','Quote reply'],edit:['編輯','编辑','Edit'],author:['作者','作者','Author'],own:['我的文章','我的文章','My post'],join:['加入這段討論','加入这段讨论','Join the discussion'],write:['撰寫回覆','撰写回复','Write a reply'],fold:['收起輸入區','收起输入区','Fold composer'],target:['撰寫目標','撰写目标','Writing target'],editing:['編輯自己的文章','编辑自己的文章','Edit your post'],empty:['沒有符合的示例內容','没有符合的示例内容','No matching synthetic content'],resume:['繼續草稿','继续草稿','Resume draft'],notice:['回覆提到你 · 開啟第 5 樓','回复提到你 · 打开第 5 楼','A reply mentions you · Open post 5'],saved:['已更新本次示範的收藏。','已更新本次演示的收藏。','Updated this demo’s saved threads.'],refreshed:['已手動更新合成通知；不模擬論壇已讀效果。','已手动更新合成通知；不模拟论坛已读效果。','Synthetic notices refreshed manually. No server read effects are simulated.'],download:['下載示例','下载示例','Sample download'],downloadHelp:['合成附件；此原型不下載論壇檔案。','合成附件；此原型不下载论坛文件。','Sample attachment; this prototype does not download forum files.'],native:['原站恢復入口（示意）','原站恢复入口（示意）','Original-site recovery (illustration)'],nativeHelp:['恢復入口只展示位置；合成編號不會開啟真實論壇。','恢复入口仅展示位置；合成编号不会打开真实论坛。','This illustrates the recovery location. Synthetic IDs never open the real forum.'],recover:['恢復一般閱讀示例','恢复一般阅读示例','Restore normal reading example'],backList:['返回主題列表','返回主题列表','Back to thread list'],recoveryHelp:['保留主題身份、分頁與恢復目標。正在撰寫的文字仍留在這裡。','保留主题身份、分页与恢复目标。正在撰写的文字仍留在这里。','Retain thread identity, page and recovery target. Your writing stays here.'],noText:['請先輸入示例文字。','请先输入示例文字。','Type some sample writing first.'],sent:['示範完成，沒有送出至論壇。以下為合成結果預覽：','演示完成，没有提交至论坛。以下为合成结果预览：','Simulation complete. Nothing was sent to the forum. Synthetic result preview:'],draftSaved:['示例草稿已更新於記憶體，非真實論壇草稿。','示例草稿已更新于内存，非真实论坛草稿。','Sample draft updated in memory, not on the forum.'],uncertain:['送出結果不明（示例）。請先確認結果，避免重複送出。文字仍在此處。','提交结果不明（示例）。请先确认结果，避免重复提交。文字仍在此处。','Unknown outcome (simulation). Check the result before sending again. Your writing is retained.'],check:['示範確認結果','示例确认结果','Simulate result check'],checked:['示範確認：未建立文章，可以再次送出。','示例确认：未创建文章，可以再次提交。','Simulated check: no post was created; sending again is available.'],close:['關閉','关闭','Close'],lastTab:['至少保留目前主題。','至少保留当前主题。','Keep at least the current thread open.'],layoutA:['A · 並排工作區','A · 并排工作区','A · Workspace'],layoutB:['B · 專注閱讀','B · 专注阅读','B · Reading'],layoutC:['C · 多主題書桌','C · 多主题书桌','C · Desk'],descriptionA:['同時看見版塊、主題列表與文章。切換很直接，代價是閱讀寬度。中等視窗收起版塊欄；窄螢幕逐層返回。','同时看见版块、主题列表与文章。切换很直接，代价是阅读宽度。中等窗口收起版块栏；窄屏幕逐层返回。','Boards, threads and posts stay visible together. Immediate browsing costs reading width. Medium windows collapse the board column; narrow screens drill down.'],descriptionB:['將空間留給文章，以選擇器切換版塊及主題。回覆在文章底部；更專注，但瀏覽需要多一步。','将空间留给文章，以选择器切换版块及主题。回复在文章底部；更专注，但浏览需要多一步。','Give the reader the space. Browse through a picker and compose below the posts. Fewer distractions, but browsing takes an extra step.'],descriptionC:['以暫存分頁保留開啟的主題，寬螢幕可在旁邊回覆。方便交叉參照，代價是更多狀態和較窄文章。分頁不永久保存。','以临时分页保留开启的主题，宽屏幕可以在旁边回复。方便交叉参照，代价是更多状态和较窄文章。分页不永久保存。','Session tabs retain open threads; wide screens place composition beside reading. Easier cross-reference costs state and reading width. Tabs do not persist.']
};
Object.assign(labels, {
 searchScope:['搜尋範圍','搜索范围','Search scope'],
 searchContext:['在選定的示例版塊中搜尋標題或作者。實際搜尋條件另行決定。','在选定的示例版块中搜索标题或作者。实际搜索条件另行决定。','Search sample titles or authors within this scope. Actual forum search behavior remains undecided.'],
 savedThreads:['主題收藏','主题收藏','Saved threads'],
 savedBoards:['版塊收藏','版块收藏','Saved boards'],
 favoritesContext:['選擇主題或版塊收藏，再從旁邊的列表繼續閱讀。','选择主题或版块收藏，再从旁边的列表继续阅读。','Choose saved threads or boards, then continue from the adjacent list.'],
 inbox:['通知收件匣','通知收件箱','Notification inbox'],
 noticesContext:['目前帳號的合成通知。手動更新，不模擬已讀分類或背景同步。','当前账号的合成通知。手动更新，不模拟已读分类或后台同步。','Synthetic notices for the current account. Manual refresh, with no read-state categories or background sync.'],
 unpublished:['未發佈主題','未发布主题','Unpublished threads'],
 draftsContext:['論壇草稿的入口示意，只包括未發佈主題。','论坛草稿的入口示意，只包括未发布主题。','Forum-draft placement for unpublished threads only.'],
 contextNav:['區段導覽','分区导航','Section navigation'],
 overview:['區段總覽','分区概览','Section overview'],
 overviewBoards:['選擇版塊，找一段想加入的討論。','选择版块，找一段想加入的讨论。','Choose a board and find a discussion to join.'],
 overviewSearch:['縮小範圍，再從搜尋結果開啟完整討論。','缩小范围，再从搜索结果打开完整讨论。','Narrow the scope, then open a full discussion from the results.'],
 overviewFavorites:['回到收藏的主題與版塊，繼續上次的發現。','回到收藏的主题与版块，继续上次的发现。','Return to the threads and boards you saved.'],
 overviewNotifications:['查看目前帳號的通知，從列表前往相關文章。','查看当前账号的通知，从列表前往相关文章。','Review this account’s notices and open the related posts.'],
 overviewDrafts:['從未發佈的主題繼續撰寫。','从未发布的主题继续撰写。','Continue writing an unpublished thread.'],
 scope:['目前範圍','当前范围','Current scope'],
 sampleResults:['示例結果','示例结果','Sample results'],
 chooseResult:['從列表選擇一項，即可在這裡開啟。','从列表选择一项，即可在这里打开。','Choose an item from the list to open it here.'],
 viewResults:['查看列表','查看列表','View results'],
 writingInProgress:['正在撰寫','正在撰写','Writing in progress'],
 returnWriting:['返回撰寫','返回撰写','Return to writing']
});
const boards=[{id:'music',name:'音樂交流',symbol:'♫',color:'cool',desc:'交換旋律，也交換聆聽的日常。'},{id:'anime',name:'動畫討論',symbol:'◇',color:'pink',desc:'每個故事，都值得好好聊。'},{id:'creative',name:'創作工坊',symbol:'✎',color:'alt',desc:'分享草稿，記下靈感的形狀。'},{id:'community',name:'生活閒談',symbol:'☷',color:'base',desc:'留一點空間，給日常的小事。'}];
const threads=[{id:'autumn',board:'music',title:'秋日聆聽筆記：從一段配樂開始，把值得重聽的旋律慢慢收藏',author:'澄月',count:5,pinned:true,time:'10:24'},{id:'piano',board:'music',title:'雨天的鋼琴，與一張還沒寫完的歌單',author:'紙飛機',count:2,time:'09:18'},{id:'headphones',board:'music',title:'分享你的入門耳機：先談感受，再談規格',author:'山雀',count:2,time:'昨天'},{id:'soundtrack',board:'music',title:'Soundtrack notes / 從片尾的一小段旋律，重新看見整個故事',author:'橘燈',count:2,time:'昨天'},{id:'animation',board:'anime',title:'把一個鏡頭多看一次：聊聊手繪背景裡的光',author:'雲岫',count:2,pinned:true,time:'11:02'},{id:'ending',board:'anime',title:'這個結局之後，我們還想知道什麼？',author:'紙飛機',count:2,time:'08:32'},{id:'sketch',board:'creative',title:'十月速寫交換：把窗外的風留在紙上',author:'山雀',count:2,time:'10:40'},{id:'weekend',board:'community',title:'週末留白計畫：不趕路的一天',author:'橘燈',count:2,time:'昨天'}];
const picture=`<figure><svg viewBox="0 0 720 260" role="img" aria-label="合成插圖：淡紫天空、綠色山丘與黑色唱片"><rect width="720" height="260" fill="#a29bba"/><circle cx="560" cy="78" r="42" fill="#f5e9d1"/><path d="M0 180Q180 50 360 180T720 180V260H0" fill="#ceddc8"/><circle cx="188" cy="132" r="92" fill="#000"/><circle cx="188" cy="132" r="35" fill="#dda49f"/><circle cx="188" cy="132" r="7" fill="#000"/><path d="M320 178h52m16-28h42m14-48h72" stroke="#000" stroke-width="3"/><text x="352" y="228" fill="#000" font-family="system-ui,sans-serif" font-size="18" letter-spacing="5">A QUIET AFTERNOON</text></svg><figcaption>合成封面插圖 · A quiet afternoon</figcaption></figure>`;
const firstBody=`<p>有些配樂，第一次聽見時只是故事的背景。隔了一段時間再聽，才發現它已經替那個下午留了一個位置。</p><p>這次想把「值得重聽」的原因寫得更具體一點：是低音進場的時機、呼吸一樣的停頓，還是某個不急著解決的和弦？歡迎帶著自己的例子慢慢回覆。</p>${picture}<h2>先從三個片段開始</h2><p>下面的曲名與時間都為示例。我把自己的聆聽筆記整理成表格，也保留完整文字，方便引用某一段，而不是只留下一句短評。</p><div class="table-wrap" tabindex="0" aria-label="可橫向捲動的聆聽筆記表格"><table><thead><tr><th>片段</th><th>時間</th><th>樂器</th><th>聆聽重點</th></tr></thead><tbody><tr><td>午後窗邊</td><td>00:42–01:18</td><td>鋼琴、低音提琴</td><td>低音進場時留下的空間</td></tr><tr><td>回家的路</td><td>02:10–02:48</td><td>弦樂、小鼓</td><td>旋律重複卻不完全相同</td></tr><tr><td>遠方的燈</td><td>03:04–03:30</td><td>木吉他、環境聲</td><td>最後一個和弦沒有立刻落下</td></tr></tbody></table></div><blockquote><strong>筆記的一個小提醒</strong><p>「把注意力放在聲音之間，而不只是聲音本身。」這句話是原型的虛構內容。</p></blockquote><details id="spoiler"><summary>展開：第三個片段的劇情聯想（含示例劇透）</summary><p>最後那盞燈不一定代表有人回來，也可能只是故事還留著一個位置。完整內容展開後仍在同一篇文章裡。</p></details><p>如果你也習慣做筆記，可以分享格式。我的簡單清單如下，長行會留在程式碼區域內捲動：</p><pre tabindex="0" aria-label="程式碼示例"><code>listen --track "A quiet afternoon" --from 00:42 --to 01:18 --note "leave enough room for the bass to arrive"</code></pre><div class="attachment"><span aria-hidden="true">↧</span><div class="grow"><strong>listening-notes.txt</strong><div class="meta">合成附件 · 2.4 KB · 文字檔</div></div><button class="outline small" data-action="download" data-i="download"></button></div><p>你最近反覆聽的，是哪一個片段？</p>`;
const mainPosts=[{n:1,author:'澄月',time:'09:00',body:firstBody},{n:2,author:'紙飛機',time:'09:18',body:'<blockquote><a href="#post-1" data-post="1">引用 澄月 · #1</a><p>是低音進場的時機、呼吸一樣的停頓，還是某個不急著解決的和弦？</p></blockquote><p>對我來說是停頓。以前總把音量開得很大，最近才開始注意旋律收尾後，背景裡還留著什麼。</p><p>你們習慣用耳機還是喇叭整理筆記？也許值得另開一個主題。</p>'},{n:3,author:'示範使用者',time:'09:42',own:true,body:'<p>我會先完整聽一遍，再回到想記下的時間點。這樣比較不會把音樂切成一張待辦清單。</p><p>等週末有空，想補上一份自己的筆記。</p>'},{n:4,author:'山雀',time:'10:01',body:'<p>很喜歡「留一個位置」的說法。這樣的討論可以慢慢累積，不需要每一句都立刻接下去。</p><div class="post-notice"><strong>附件存取提示（合成）</strong><p>此附件需要額外閱讀權限。文章的其他內容仍然可以閱讀。</p></div>'},{n:5,author:'橘燈',time:'10:12',body:'<blockquote><a href="#post-3" data-post="3">引用 示範使用者 · #3</a><p>比較不會把音樂切成一張待辦清單。</p></blockquote><p>同意。我也想試試先聽完整，再回頭做筆記。@示範使用者 等你的週末版本！</p>'},{n:6,author:'澄月',time:'10:24',body:'<p>謝謝大家的回覆。我把幾個共通的想法記下來了：先完整聽、保留停頓，也容許自己暫時說不出原因。</p><p>下次再來更新，讓這個主題慢慢長大。</p>'}];
const query=new URLSearchParams(location.search);
const state={variant:['A','B','C'].includes(query.get('variant'))?query.get('variant'):'A',theme:'Light',density:'Default',lang:'zh-TW',thread:threads.some(x=>x.id===query.get('thread'))?query.get('thread'):'autumn',board:'music',page:query.get('page')==='2'?2:1,post:Number(query.get('post')||0),screen:['boards','list','reader'].includes(query.get('screen'))?query.get('screen'):'reader',destination:'boards',readerView:'thread',search:'',searchScope:'all',favoriteView:'threads',tabs:['autumn','piano'],scenario:'normal',outcome:'success',favorites:['autumn'],positions:{},compose:{open:false,mode:'reply',thread:'autumn',board:'music',post:0,quote:'',uncertain:false},draft:{title:'週末的聆聽筆記（合成草稿）',body:'先把想寫的三段旋律記在這裡。'}};
const t=k=>labels[k]?.[['zh-TW','zh-CN','en'].indexOf(state.lang)]||k;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const thread=()=>threads.find(x=>x.id===state.thread),board=()=>boards.find(x=>x.id===state.board);
state.board=thread().board;if(state.thread!=='autumn')state.page=1;if(!state.tabs.includes(state.thread))state.tabs.push(state.thread);
let pending=null,toastTimer;const dialogFocus=new Map();
function posts(){return state.thread==='autumn'?mainPosts:[{n:1,author:thread().author,time:'08:30',body:`<p>${esc(thread().title)}</p><p>另一個合成主題，用來觀察切換討論、保留閱讀位置，以及撰寫目標是否清楚。</p><p>每篇回覆都有自己的樓層與作者；切換介面風格不會把它變成私人聊天。</p>${picture}`},{n:2,author:'示範使用者',time:'09:10',own:true,body:'<p>留下一個想法，下次再來繼續。</p>'},{n:3,author:'山雀',time:'09:20',body:'<p>這個例子讓我想到另一段經驗。保留完整上下文，讀起來更容易理解。</p>'}]}
const plain=html=>new DOMParser().parseFromString(html,'text/html').body.textContent.trim();
function notify(key){$('#toast').textContent=t(key);$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500)}
function url(next={}){const u=new URL(location.href),s={...state,...next};u.search='';['variant','thread','page','screen'].forEach(k=>u.searchParams.set(k,s[k]));if(s.post)u.searchParams.set('post',s.post);u.hash=s.post?`post-${s.post}`:'';return u}
function historyState(replace=false){history[replace?'replaceState':'pushState']({thread:state.thread,board:state.board,page:state.page,post:state.post,screen:state.screen,destination:state.destination,readerView:state.readerView,search:state.search,searchScope:state.searchScope,favoriteView:state.favoriteView,variant:state.variant},'',url())}
function scroller(){return state.variant==='B'&&innerWidth>=960?$('#reader'):$('#reader-scroll')}
function remember(){if(state.readerView!=='thread')return;state.positions[`${state.thread}:${state.page}`]=scroller().scrollTop}
function restore(){requestAnimationFrame(()=>{if(state.readerView!=='thread'){scroller().scrollTop=0;return}if(state.post){const el=$(`#post-${state.post}`);el?.scrollIntoView({block:'start'});el?.focus({preventScroll:true})}else scroller().scrollTop=state.positions[`${state.thread}:${state.page}`]||0})}
function openDialog(id){dialogFocus.set(id,document.activeElement);$('#'+id).showModal()}
function closeDialog(id){$('#'+id).close();const el=dialogFocus.get(id);if(el?.isConnected)el.focus({preventScroll:true})}
function geometry(){document.documentElement.dataset.variant=state.variant;document.documentElement.dataset.screen=state.screen;$('#variant-name').textContent=t('layout'+state.variant);$('#variant-description').textContent=t('description'+state.variant);renderSurface()}
function boardButtons(){return boards.map(b=>`<button class="board-option" data-board="${b.id}" aria-current="${b.id===state.board?'page':'false'}"><span class="board-symbol" style="background:var(--${b.color})">${b.symbol}</span><span>${b.name}</span></button>`).join('')}
function contextChoices(){
  if(state.destination==='boards')return boardButtons();
  let options,selected;
  if(state.destination==='search'){
    options=[{id:'all',label:t('allBoards'),symbol:'⌕',color:'base'},...boards.map(b=>({id:b.id,label:b.name,symbol:b.symbol,color:b.color}))];selected=state.searchScope;
  }else if(state.destination==='favorites'){
    options=[{id:'threads',label:t('savedThreads'),symbol:'▤',color:'base'},{id:'boards',label:t('savedBoards'),symbol:'▦',color:'cool'}];selected=state.favoriteView;
  }else{
    const notices=state.destination==='notifications';
    options=[{id:notices?'inbox':'unpublished',label:t(notices?'inbox':'unpublished'),symbol:notices?'♧':'✎',color:'base'}];selected=options[0].id;
  }
  return options.map(x=>`<button class="board-option" data-context="${x.id}" aria-current="${x.id===selected?'page':'false'}"><span class="board-symbol" style="background:var(--${x.color})">${x.symbol}</span><span>${esc(x.label)}</span></button>`).join('');
}
function contextLabel(){return state.destination==='boards'?board().name:state.destination==='search'?(state.searchScope==='all'?t('allBoards'):boards.find(x=>x.id===state.searchScope).name):t(state.destination==='favorites'?(state.favoriteView==='threads'?'savedThreads':'savedBoards'):state.destination==='notifications'?'inbox':'unpublished')}
function renderContext(){
  $('#context-title').textContent=t(state.destination==='boards'?'explore':state.destination);
  $('#board-options').innerHTML=contextChoices();
  $('#context-note').textContent=t({boards:'boardNote',search:'searchContext',favorites:'favoritesContext',notifications:'noticesContext',drafts:'draftsContext'}[state.destination]);
  $('#context-picker-label').textContent=t(state.destination==='boards'?'allBoards':state.destination==='search'?'searchScope':'contextNav');
}
function renderSurface(){
  const reading=state.readerView==='thread',writing=state.readerView==='writing';
  $('#section-overview').hidden=reading;
  $('#thread-view').hidden=!reading||state.scenario!=='normal';
  $('#recovery').hidden=!reading||state.scenario==='normal';
  $('#composer').hidden=!reading&&!writing;
  $('#tabs').hidden=!reading;
  $('#reader').classList.toggle('composing',state.compose.open&&(reading||writing));
}
function renderOverview(){
  const writing=state.readerView==='writing';
  $('#overview-title').textContent=writing?t('newThread'):t(state.destination);
  $('#overview-description').textContent=writing?$('#compose-target').textContent:t({boards:'overviewBoards',search:'overviewSearch',favorites:'overviewFavorites',notifications:'overviewNotifications',drafts:'overviewDrafts'}[state.destination]);
  $('#overview-scope').textContent=contextLabel();
  $('#overview-count').textContent=$$('#thread-list .thread-row').length;
  $('#overview-browsing').hidden=writing;
  const unfinished=state.compose.open||$('#compose-body').value.trim()||$('#compose-title').value.trim();
  $('#return-writing').hidden=writing||!unfinished;
  $('#return-writing-shortcut').hidden=!unfinished||(state.readerView!=='overview'&&state.screen==='reader');
  $('#overview-writing-target').textContent=$('#compose-target').textContent;
  renderSurface();
}
function returnToWriting(){
  state.compose.open=true;
  if(state.compose.mode==='new'){
    state.readerView='writing';state.screen='reader';geometry();renderList();historyState();
  }else navigate(state.compose.thread,{page:Math.max(1,Math.ceil(state.compose.post/3)),post:state.compose.post});
  composeContext();$('#compose-body').focus();inspect();
}
function rows(){let xs=state.destination==='favorites'?threads.filter(x=>state.favorites.includes(x.id)):state.destination==='notifications'?[threads[0]]:state.destination==='search'?threads.filter(x=>state.searchScope==='all'||x.board===state.searchScope):threads.filter(x=>x.board===state.board);return xs.filter(x=>(x.title+x.author).toLowerCase().includes(state.search.toLowerCase()))}
function threadRow(x){return `<a class="thread-row ${state.readerView==='thread'&&x.id===state.thread?'selected':''}" data-thread="${x.id}" href="${esc(url({thread:x.id,page:1,post:0,screen:'reader'}).href)}">${x.pinned?`<span class="chip">${t('pinned')}</span>`:''}<div class="thread-title">${esc(x.title)}</div><div class="meta"><span>${x.author}</span><span>· ${x.count} ${t('replies')}</span><span>${x.time}</span></div>${state.destination==='notifications'?`<p style="margin:12px 0 0;font-size:14px">${t('notice')}</p>`:''}</a>`}
function listContents(){
  if(state.destination==='drafts')return `<div class="thread-row"><span class="chip">${t('synthetic')}</span><h3>${esc(state.draft.title)}</h3><p class="meta">音樂交流</p><button class="secondary" data-action="resume">${t('resume')}</button></div>`;
  if(state.destination==='favorites'&&state.favoriteView==='boards')return boards.filter(b=>b.id==='music'&&(b.name+b.desc).includes(state.search)).map(b=>`<button class="thread-row saved-board" data-open-board="${b.id}"><span class="chip">${t('synthetic')}</span><div class="thread-title">${b.name}</div><div class="meta">${b.desc}</div></button>`).join('')||`<p class="list-note">${t('empty')}</p>`;
  return rows().length?rows().map(threadRow).join(''):`<p class="list-note">${t('empty')}</p>`;
}
function renderList(){
  renderContext();
  $('#list-title').textContent=state.destination==='boards'?board().name:t(state.destination);
  $('#list-description').textContent=state.destination==='boards'?board().desc:contextLabel();
  $('#list-filter').textContent=state.destination==='boards'?t('boards'):contextLabel();
  $('#refresh').hidden=state.destination!=='notifications';
  $('#thread-list').innerHTML=listContents();
  $('#breadcrumb').textContent=`TSDM / ${t(state.destination)} / ${contextLabel()}`;
  $$('[data-dest]').forEach(el=>el.setAttribute('aria-current',el.dataset.dest===state.destination?'page':'false'));
  renderOverview();
}
function renderTabs(){$('#tabs').innerHTML=state.tabs.map(id=>`<div class="open-tab ${state.thread===id?'current':''}"><button data-thread="${id}" ${id===state.thread?'aria-current="page"':''}>${esc(threads.find(x=>x.id===id).title)}</button><button class="icon" data-close-tab="${id}" aria-label="${t('close')}">×</button></div>`).join('')}
function renderPages(){const total=state.thread==='autumn'?2:1,html=`<span>${t('page')} ${state.page} / ${total}</span><div class="row">${Array.from({length:total},(_,i)=>`<button class="small" data-page="${i+1}" aria-current="${state.page===i+1?'page':'false'}">${i+1}</button>`).join('')}<button class="small" data-action="last">${t('last')} ↗</button></div>`;$('#pages-top').innerHTML=html;$('#pages-bottom').innerHTML=html}
function renderRecovery(){const active=state.scenario!=='normal';renderSurface();if(active)$('#recovery').innerHTML=`<span class="chip">${t('synthetic')}</span><h2>${t(state.scenario)}</h2><p>${t('recoveryHelp')}</p><strong>${esc(thread().title)}</strong><code>forum.php?mod=viewthread&amp;tid=DEMO-${state.thread}&amp;page=${state.page}${state.post?'#post-DEMO-'+state.post:''}</code><div class="row"><button class="primary" data-action="recover">${t('recover')}</button><button class="outline" data-action="native">${t('native')}</button><button data-action="show-list">${t('backList')}</button></div>`}
function renderReader(){$('#category').textContent=boards.find(x=>x.id===thread().board).name;$('#category').style.background=`var(--${boards.find(x=>x.id===thread().board).color})`;$('#thread-title').textContent=thread().title;renderMetadata();renderPages();$('#posts').innerHTML=posts().slice((state.page-1)*3,state.page*3).map(p=>`<article class="post ${p.n===state.post?'targeted':''}" id="post-${p.n}" tabindex="-1"><header class="post-head"><span class="avatar" aria-hidden="true">${p.author[0]}</span><div class="grow"><strong>${p.author}</strong> ${p.own?`<span class="chip" data-i="own">${t('own')}</span>`:''}<div class="meta">2026-10-16 ${p.time}</div></div><a class="post-anchor" data-post="${p.n}" href="${esc(url({post:p.n}).href)}">#${p.n}</a></header><div class="post-content" lang="zh-TW">${p.body}</div><footer class="post-actions"><button class="secondary" data-quote="${p.n}" data-i="quote">${t('quote')}</button>${p.own?`<button data-edit="${p.n}" data-i="edit">${t('edit')}</button>`:''}</footer></article>`).join('');$('#posts [data-i="download"]')?.replaceChildren(document.createTextNode(t('download')));renderRecovery();renderTabs();composeContext()}
function renderMetadata(){$('#thread-meta').innerHTML=`<span>${t('author')} ${thread().author}</span><span>2026-10-16</span><span>${thread().count} ${t('replies')}</span><span class="chip">${t('synthetic')}</span>`}
function navigate(id,{page=1,post=0,push=true}={}){remember();state.thread=id;state.board=thread().board;state.page=id==='autumn'?page:1;state.post=post;state.screen='reader';state.readerView='thread';state.scenario='normal';$('#scenario').value='normal';if(!state.tabs.includes(id))state.tabs.push(id);geometry();renderList();renderReader();if(push)historyState();restore();inspect()}
function pageTo(page,post=0){remember();state.page=page;state.post=post;renderReader();historyState();restore();inspect()}
function goBoard(id){remember();state.readerView='overview';state.board=id;state.destination='boards';state.search='';$('#search').value='';state.screen='list';renderList();geometry();historyState();inspect()}
function pickerContents(){$('#picker-content').innerHTML=`<div class="row"><button class="primary small" data-action="new">${t('newThread')}</button></div><h3 class="picker-section-title">${t(state.destination==='boards'?'explore':state.destination)}</h3><div class="picker-context">${contextChoices()}</div>${state.destination==='search'?`<label class="picker-search-label" for="picker-search">${t('searchHint')}</label><input id="picker-search" value="${esc(state.search)}" type="search">`:''}${state.destination==='notifications'?`<button class="small" data-action="refresh">${t('refresh')}</button>`:''}<div id="picker-rows">${listContents()}</div>`}
function openPicker(){pickerContents();openDialog('picker');if(state.destination==='search')$('#picker-search').focus()}
function showList(){state.screen='list';geometry();renderList();historyState();if(state.variant==='B'&&innerWidth>=960)openPicker();inspect()}
function composeContext(){const c=state.compose,th=threads.find(x=>x.id===c.thread),b=boards.find(x=>x.id===c.board);$('#compose-heading').textContent=c.open?t(c.mode==='new'?'newThread':c.mode==='edit'?'editing':'reply'):t('join');$('#toggle-compose').textContent=t(c.open?'fold':'write');$('#compose-target').textContent=`${t('member')} · ${t('target')}: ${c.mode==='new'?b.name:th.title}${c.post?' · #'+c.post:''}`;$('#new-fields').hidden=c.mode!=='new';$('#save-draft').hidden=c.mode!=='new';$('#quote-preview').hidden=!c.quote;$('#quote-preview').textContent=c.quote;$('#composer').classList.toggle('collapsed',!c.open);$('#send').disabled=c.uncertain;renderOverview()}
function startCompose(mode='reply',n=0,resume=false){const p=posts().find(x=>x.n===n);const next={open:true,mode,thread:state.thread,board:resume?'music':state.board,post:n,quote:mode==='quote'?`${p.author} · #${n} — ${plain(p.body).slice(0,180)}`:'',uncertain:false};const run=()=>{state.compose=next;state.readerView=mode==='new'?'writing':'thread';state.screen='reader';geometry();$('#compose-body').value=mode==='edit'?plain(p.body):resume?state.draft.body:'';$('#compose-title').value=resume?state.draft.title:'';$('#compose-status').textContent='';composeContext();if(mode==='new')historyState();if(state.variant==='B'&&innerWidth>=960)$('#composer').scrollIntoView({block:'start'});$('#compose-body').focus({preventScroll:true});inspect()};if($('#compose-body').value.trim()||$('#compose-title').value.trim()){if(state.compose.mode===mode&&state.compose.thread===state.thread&&state.compose.post===n&&!resume){returnToWriting();return}pending=run;openDialog('guard')}else run()}
function translate(){$$('[data-i]').forEach(el=>el.textContent=t(el.dataset.i));$$('[data-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.label)));$$('[data-close]').forEach(el=>el.setAttribute('aria-label',t('close')));$('#search').placeholder=t('searchHint');$('#compose-body').placeholder=t('placeholder');document.documentElement.lang=state.lang;geometry();renderList();renderPages();renderTabs();renderMetadata();composeContext();renderRecovery();inspect()}
function preferences(){const el=scroller(),position=el.scrollTop,top=el.getBoundingClientRect().top;const anchor=$$('.post-head,.post-content>p,.post-content>figure,.post-content>h2,.post-content>.table-wrap,.post-content>details').find(node=>node.getBoundingClientRect().bottom>top+8);const offset=anchor?.getBoundingClientRect().top;document.documentElement.dataset.theme=state.theme;document.documentElement.dataset.density=state.density;$$('[data-theme]').filter(el=>el.tagName==='BUTTON').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.theme===state.theme)));translate();el.scrollTop=position;if(anchor)el.scrollTop+=anchor.getBoundingClientRect().top-offset}
function variant(delta){remember();state.variant=['A','B','C'][(['A','B','C'].indexOf(state.variant)+delta+3)%3];geometry();historyState(true);composeContext();restore();inspect()}
function inspect(){$('#state').textContent=JSON.stringify({variant:state.variant,theme:state.theme,density:state.density,language:state.lang,board:state.board,thread:state.thread,page:state.page,post:state.post,screen:state.screen,destination:state.destination,readerView:state.readerView,searchScope:state.searchScope,favoriteView:state.favoriteView,openThreads:state.tabs,scenario:state.scenario,outcome:state.outcome,composer:{...state.compose,title:$('#compose-title').value,text:$('#compose-body').value},favorites:state.favorites,storage:'memory only',network:'none'},null,2)}
document.addEventListener('click',e=>{const el=e.target.closest('button,a');if(!el)return;
 if(el.dataset.close){closeDialog(el.dataset.close);return}
 if(el.dataset.theme){state.theme=el.dataset.theme;preferences();return}
 if(el.dataset.board){goBoard(el.dataset.board);if($('#picker').open)pickerContents();return}
 if(el.dataset.openBoard){if($('#picker').open)closeDialog('picker');goBoard(el.dataset.openBoard);if(state.variant==='B'&&innerWidth>=960)openPicker();return}
 if(el.dataset.context){
   remember();state.readerView='overview';
   if(state.destination==='search')state.searchScope=el.dataset.context;
   if(state.destination==='favorites')state.favoriteView=el.dataset.context;
   state.screen='list';renderList();geometry();historyState();
   if($('#picker').open)pickerContents();inspect();return;
 }
 if(el.dataset.dest){remember();state.readerView='overview';state.destination=el.dataset.dest;state.search='';$('#search').value='';state.screen=state.destination==='boards'?'boards':'list';geometry();renderList();historyState();if(state.variant==='B'&&innerWidth>=960)openPicker();else if(state.destination==='search')$('#search').focus();inspect();return}
 if(el.dataset.closeTab){if(state.tabs.length===1){notify('lastTab');return}const id=el.dataset.closeTab;state.tabs=state.tabs.filter(x=>x!==id);if(state.thread===id)navigate(state.tabs.at(-1));else renderTabs();inspect();return}
 if(el.dataset.thread){e.preventDefault();const notice=state.destination==='notifications';if($('#picker').open)closeDialog('picker');navigate(el.dataset.thread,{page:notice?2:1,post:notice?5:0});return}
 if(el.dataset.page){pageTo(Number(el.dataset.page));return}
 if(el.dataset.post){e.preventDefault();const n=Number(el.dataset.post);pageTo(Math.ceil(n/3),n);return}
 if(el.dataset.quote){startCompose('quote',Number(el.dataset.quote));return}
 if(el.dataset.edit){startCompose('edit',Number(el.dataset.edit));return}
 const a=el.dataset.action;
 if(a==='return-writing')returnToWriting();
 if(['settings','account'].includes(a))openDialog(a);
 if(a==='lab'){inspect();openDialog('notes')}
 if(a==='prev'||a==='next')variant(a==='next'?1:-1);
 if(a==='browse'||a==='choose-board'){if(innerWidth<960&&a==='choose-board'){state.screen='boards';geometry();historyState()}else openPicker()}
 if(a==='show-list')showList();
 if(a==='back'){if(state.screen==='reader')showList();else{state.screen='boards';geometry();historyState()}}
 if(a==='reply')startCompose();if(a==='new'){if($('#picker').open)closeDialog('picker');startCompose('new')}if(a==='resume'){if($('#picker').open)closeDialog('picker');startCompose('new',0,true)}
 if(a==='toggle-compose'){if(!state.compose.open&&!$('#compose-body').value)startCompose();else{state.compose.open=!state.compose.open;composeContext();if(state.compose.open)$('#compose-body').focus();inspect()}}
 if(a==='last'){const n=posts().at(-1).n;pageTo(Math.ceil(n/3),n)}
 if(a==='favorite'){state.favorites=state.favorites.includes(state.thread)?state.favorites.filter(x=>x!==state.thread):[...state.favorites,state.thread];notify('saved');renderList();inspect()}
 if(a==='refresh')notify('refreshed');if(a==='download')notify('downloadHelp');if(a==='native')notify('nativeHelp');
 if(a==='recover'){state.scenario='normal';$('#scenario').value='normal';renderRecovery();inspect()}
 if(a==='keep'){closeDialog('guard');pending=null;returnToWriting()}
 if(a==='replace'){closeDialog('guard');pending?.();pending=null}
 if(a==='discard'){const run=()=>{$('#compose-body').value='';$('#compose-title').value='';$('#compose-status').textContent='';state.compose.open=false;state.compose.uncertain=false;composeContext();inspect()};if($('#compose-body').value.trim()||$('#compose-title').value.trim()){pending=run;openDialog('guard')}else run()}
 if(a==='save'){state.draft={title:$('#compose-title').value||t('newThread'),body:$('#compose-body').value};$('#compose-status').textContent=t('draftSaved');inspect()}
 if(a==='send'){if(!$('#compose-body').value.trim()){notify('noText');return}if(state.outcome==='unknown'){state.compose.uncertain=true;$('#compose-status').innerHTML=`<p>${t('uncertain')}</p><button class="outline small" data-action="check">${t('check')}</button>`;composeContext()}else $('#compose-status').innerHTML=`<p>${t('sent')}</p><blockquote>${esc($('#compose-body').value)}</blockquote>`;inspect()}
 if(a==='check'){state.compose.uncertain=false;$('#compose-status').textContent=t('checked');composeContext();inspect()}
});
document.addEventListener('input',e=>{if(['search','picker-search'].includes(e.target.id)){state.search=e.target.value;$('#search').value=state.search;renderList();if(e.target.id==='picker-search')$('#picker-rows').innerHTML=listContents();historyState(true)}inspect()});
$('#density').addEventListener('change',e=>{state.density=e.target.value;preferences()});$('#language').addEventListener('change',e=>{state.lang=e.target.value;preferences()});
$('#scenario').addEventListener('change',e=>{state.scenario=e.target.value;renderRecovery();inspect()});$('#outcome').addEventListener('change',e=>{state.outcome=e.target.value;inspect()});
document.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||e.altKey||e.metaKey||e.ctrlKey||e.shiftKey||e.target.closest('input,textarea,select,[contenteditable],dialog'))return;e.preventDefault();variant(e.key==='ArrowRight'?1:-1)});
addEventListener('popstate',e=>{if(!e.state)return;remember();Object.assign(state,e.state);$('#search').value=state.search;geometry();renderList();if($('#picker').open)pickerContents();renderReader();restore();inspect()});
// Only the local disposable route exposes the comparison toolbar; no production build exists.
if(!['localhost','127.0.0.1',''].includes(location.hostname))$('#lab').hidden=true;
renderList();renderReader();preferences();historyState(true);if(state.post)restore();
