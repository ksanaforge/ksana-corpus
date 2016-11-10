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
/*
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
*/
const getArticleField=function(narticle,name,cb){
	var article=narticle;
	if (typeof narticle=="number") {
		article=getArticle.call(this,narticle);
	}
	return this.get(["afields",article.at,name],{recursive:true},cb);
}

const getFieldNames=function(cb){
	const r=this.get(["fields"],function(data){return cb(Object.keys(data))});
	return r?Object.keys(r):[];
}

const makeBookKey=function(s,e,hascol){
	return ["texts",e[0]-1];	
}

const makePageKeys=function(s,e,column,maxpage){//without col
	var keys=[],pg;
	var bk=s[0]-1; //only bk start from 1, pg,line,ch starts from 0
	var startpage=s[1];
	var endpage=e[1];
	if (e[0]>s[0]) {//crossing book, article start at ends of file
		endpage=maxpage;
	}
	for (pg=startpage;pg<=endpage;pg++) {
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
	var startpage=r.startarr[1];
	var endpage=r.endarr[1];
	const startline=r.startarr[2];
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
			pg=pg.slice(startline);
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

	const r=adjustArticleRange.call(this,start,end);

	return {at:at-1, articlename:articlename[at-1], end:r.end, start:r.start};
}

const getArticleName=function(id){
	const articlenames=this.get(["fields","article","value"]);
	return articlenames[id];
}

//warning , if no article tag at begining of file.
//fetching last article of previous file will truncate the upper part
const adjustArticleRange=function(start,end){
	const pat=this.addressPattern;
	if (typeof end=="undefined") end=this.meta.endpos;

	//cross book article, adjust start to begining of end book
	if (this.bookOf(end)>this.bookOf(start)) {
		const endbookbegin=Ksanapos.makeKPos([this.bookOf(end),0,0,0],pat);
		if (endbookbegin==end) { // end at start book
			end=Ksanapos.makeKPos([this.bookOf(start),pat.maxpage-1,pat.maxline-1,0],pat);
 		} else {  //starts from begining of end book
 			start=endbookbegin;	
 		}		
	}
	return {start:start,end:end};
}

const getArticle=function(at,nav) {
	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
	if (!articlepos) return null;

	if (typeof id_name==="string") {
		at=articlename.indexOf(id_name);
	}
	if (at<0) return null;

	at+=(nav||0);
	var start=articlepos[at];
	var end=articlepos[at+1];
	if (!start)return null;
	if (typeof end=="undefined") end=this.meta.endpos;

	const r=adjustArticleRange.call(this,start,end);
	
	return {at:at, articlename:articlename[at], end:r.end, start:r.start};
}

const getArticleText=function(id_name,cb){
	const article=getArticle.call(this,id_name);
	if (!article) {
		cb(null)
		return null;		
	}

	var krange=Ksanapos.makeKRange(article.start,article.end,this.addressPattern);

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
const findAField=function(afield,address,cb){
	this.getField(afield+"_range",function(data){ 
    if (!data) {
    	cb("not afield range")
    	return;
    }
    const at=bsearch(data.pos,address,true);
    if (at<1) {
    	cb("address "+address+" not found");
    	return;
    }
    //find corpus address by pbaddress
    this.getArticleField(at-1,afield,function(data2){
      const at2=bsearch(data2.value,address);//
      if (at>0) {
      	cb(0,data2.pos[at2])
      } else {
      	cb("address "+address+" not found in article"+(at-1));
      }
    });
  }.bind(this));
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
	engine.findAField=findAField;
	engine.getPages=getPages;
	engine.getText=getText;
	engine.articleOf=articleOf;
	engine.bookOf=textutil.bookOf;
	engine.pageOf=textutil.pageOf;
	engine.pageStart=textutil.pageStart;
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

module.exports={init:init};