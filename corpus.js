const bsearch=require("./bsearch");
const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;
const textutil=require("./textutil");
const coordinate=require("./coordinate");
const TOC=require("./toc");
const getField=function(name,cb){
	if (typeof name=="object") {
		return getFields.call(this,name,cb);
	}
	return this.get(["fields",name],{recursive:true},cb);
}
const getFields=function(names,cb){
	const keys=names.map(function(name){return ["fields",name]});
	return this.get(keys,{recursive:true},cb);	
}
const getBookField=function(name,book,cb){
	if (typeof name=="object") {
		return getBookFields.call(this,name,book,cb);
	}
	return this.get(["fields",name,book],{recursive:true},cb);	
}
const getBookFields=function(names,book,cb){
	const keys=names.map(function(name){return ["fields",name,book]});
	return this.get(keys,{recursive:true},cb);		
}
const trimByArticle=function(article,pos_value){
	if (!pos_value) return null;
	var value=[];
	const hasvalue=typeof pos_value.value!=="undefined";
	var out={pos:[]};
	if (hasvalue) out.value=[];
	for (var i=0;i<pos_value.pos.length;i++) {
		const p=pos_value.pos[i];
		if (p>=article.start && p<article.end) {
			out.pos.push(p);
			hasvalue&&out.value.push(pos_value.value[i]);
		}
	}
	return out;
}
const getArticleField=function(name,narticle,cb){
	var article=narticle;
	if (typeof narticle=="number") {
		article=getArticle(narticle);
	}
//TODO , deal with cross book article (should not be)
	const book=this.bookOf(article.start);
	this.getBookField(name,book,function(datum){
		if (typeof name=="string") {
			datum=[datum];
		}
		if (!datum || !datum.length) cb(null);
		else cb(datum.map(function(data){return trimByArticle(article,data)}));
	});
}
const getFieldNames=function(cb){
	const r=this.get(["fields"],function(data){return cb(Object.keys(data))});
	return r?Object.keys(r):[];
}

const makeBookKey=function(s,e,hascol){
	return ["texts",s[0]-1];	
}

const makePageKeys=function(s,e,column,maxpage){//without col
	var keys=[],pg,col;
	const bk=s[0]-1; //only bk start from 1, pg,line,ch starts from 0
	var endpage=e[1];
	if (e[0]>s[0]) {//crossing book
		endpage=maxpage;
	}
	for (pg=s[1];pg<=endpage;pg++) {
		if (pg>=maxpage) break;
		keys.push(["texts",bk,pg]);	
	}
	return keys;
}

const getPages=function(kRange,cb) {
	const r=textutil.parseRange.call(this,kRange,this.addressPattern,true);
	const column=this.addressPattern.column;
	const bookkey=makeBookKey(r.startarr,r.endarr,column);

	const fetchpages=function(data){
		if (!data) {
			cb([]);
			return;
		}
		const maxpage=data.length;
		var keys=makePageKeys(r.startarr,r.endarr,column,maxpage);
		//not calling cb if already in cache
		var singlekey=false;
		if (keys.length==1) {
			singlekey=true;
			keys=keys[0];
		}
		const res=this.get(keys,{recursive:true,syncable:true},function(d2){
			if (singlekey) cb([d2]);
			else cb(d2);
		});
		return singlekey?[res]:res;
	}

	const pages=this.get(bookkey,{syncable:true},function(data){
		fetchpages.call(this,data);
	}.bind(this));

	if (pages) {
		return fetchpages.call(this,pages);
	}
	return pages;
}
const parseRange=function(krange){
	return textutil.parseRange.call(this,krange,this.addressPattern,true);
}
const trimpages=function(kRange,pages,cb){
	var out=[],i;
	const r=textutil.parseRange.call(this,kRange,this.addressPattern,true);
	const pat=this.addressPattern;
	const startpage=r.startarr[1];
	var endpage=r.endarr[1];
	if (r.endarr[0]>r.startarr[0]) {
		endpage=startpage+pages.length;
	}
	for (i=startpage;i<=endpage;i++){
		if (typeof pages[i-startpage]=="undefined")continue;
		var pg=JSON.parse(JSON.stringify(pages[i-startpage]));
		if (i!=endpage){ //fill up array to max page line
			while (pg.length<pat.maxline) pg.push("");
		}

		if (i==endpage) {//trim following
			pg.length=r.endarr[2]+1;
			pg[pg.length-1]=textutil.trimRight.call(this,pg[pg.length-1],r.endarr[3]);
		}
		if (i==startpage) {
			pg=pg.slice(r.startarr[2]);
			pg[0]=textutil.trimLeft.call(this,pg[0],r.startarr[3]);
		}
		out=out.concat(pg);
	}
	cb&&cb(out);
	return out;
}

const getText=function(kRange,cb){ //good for excerpt listing
	//call getPages
	if (typeof kRange==="object") {
		return getTexts.call(this,kRange,cb);
	}
	var cbtimer=null;
	var stockpages=getPages.call(this,kRange,function(pages){
		cbtimer=setTimeout(function(){
			trimpages.call(this,kRange,pages,cb);
		}.bind(this),1);
	}.bind(this));

	if (typeof stockpages!=="undefined"&&
		typeof stockpages!=="string") {
		clearTimeout(cbtimer);
		return trimpages.call(this,kRange,stockpages,cb);
	}
}
const getArticle=function(at,nav) {
	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
	if (!articlepos) return null;
	at+=(nav||0);
	const start=articlepos[at];
	var end=articlepos[at+1];
	if (!start)return null;
	if (typeof end=="undefined") end=this.meta.endpos;
	return {at, articlename:articlename[at], end, start};
}
const articleOf=function(kRange_address){
	var kRange=kRange_address;
	const pat=this.addressPattern;
	if (typeof kRange_address=="string") {
		kRange=Ksanapos.parse(kRange_address,pat);
	}
	const range=Ksanapos.breakKRange(kRange,pat);

	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
	if (!articlepos) return -1;

	var at=bsearch(articlepos,range.start+1,true);
	var start=articlepos[at-1];
	if (!start) {
		at=1;
		start=articlepos[0];
	}
	var end=articlepos[at];
	if (typeof end=="undefined") end=this.meta.endpos;
	return {at:at-1, articlename:articlename[at-1], end, start};
}

const getArticleName=function(id){
	const articlenames=this.get(["fields","article","value"]);
	return articlenames[id];
}
const getArticleText=function(id_name,cb){
	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
	var start,end;
	if (typeof id_name==="string") {
		const at=articlename.indexOf(id_name);
		start=articlepos[at];
		end=articlepos[at+1];
	} else if (typeof id_name==="number"){
		start=articlepos[id_name];
		end=articlepos[id_name+1];
	}

	if (typeof start==="undefined") {
		cb(null)
		return null;
	}

	if (typeof end==="undefined"){
		end=this.meta.endpos;
	}

	const krange=Ksanapos.makeKRange(start,end,this.addressPattern);

	getText.call(this,krange,cb);
}
const getTexts=function(kRanges,cb){
	if (!kRanges || !kRanges.length) {
		cb([]);
		return;
	}
	var output=[];
	var jobs=JSON.parse(JSON.stringify(kRanges));
	const fire=function(kRange){
		getText.call(this,kRange,function(data){
			output.push(data);
			if (jobs.length) {
				fire.call(this,jobs.shift());			
			} else {
				cb(output);
			}
		}.bind(this));
	}	
	fire.call(this,jobs.shift());
}


const stringify=function(krange_kpos,kend){
	const pat=this.addressPattern;
	if (kend) return Ksanapos.stringify(Ksanapos.makeKRange(krange_kpos,kend,pat),pat,true);
	return Ksanapos.stringify(krange_kpos,pat);
}


const makeKRange=function(kstart,kend){
	return Ksanapos.makeKRange(kstart,kend,this.addressPattern);
}
const trimField=function(field,start,end){
	var out={};

	const s=bsearch(field.pos,start+1,true);
	const e=bsearch(field.pos,end,true);

	for (var key in field){
		out[key]=field[key].slice(s,e);
	}
	return out;
}

//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits,engine.meta.column);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getField=getField;
	engine.getBookField=getBookField;
	engine.getArticleField=getArticleField;
	engine.trimField=trimField;
	engine.getFieldNames=getFieldNames;
	engine.getPages=getPages;
	engine.getText=getText;
	engine.articleOf=articleOf;
	engine.bookOf=textutil.bookOf;
	engine.pageOf=textutil.pageOf;
	engine.lineOf=textutil.lineOf;
	engine.charOf=textutil.charOf;
	engine.getArticle=getArticle;
	engine.stringify=stringify;
	engine.makeKRange=makeKRange;
	engine.parseRange=parseRange;
	engine.getArticleText=getArticleText;
	engine.getArticleName=getArticleName;
	engine.extractKPos=textutil.extractKPos;
	engine.toLogicalRange=coordinate.toLogicalRange;
	engine.toLogicalPos=coordinate.toLogicalPos;
	engine.fromLogicalPos=coordinate.fromLogicalPos;
	engine.layoutText=textutil.layoutText;
	engine.bookLineOf=textutil.bookLineOf;
	engine.getTOC=TOC.getTOC;
	engine.getSubTOC=TOC.getSubTOC;
	engine.addressRegex=/@([\dpabcd]+-[\dabcd]+);?/g;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
	engine.cachedSubTOC={};
	engine.cachedTOC=[];
}

module.exports={init};