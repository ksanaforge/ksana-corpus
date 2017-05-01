const Ksanapos=require("./ksanapos");
const textutil=require("./textutil");
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
		const removePunc=!!this.get("meta").removePunc;

		if (i==endpage) {//trim following
			if (r.endarr[2]+1<pg.length) {//pg has more lines
				pg.length=r.endarr[2]+1;
				pg[pg.length-1]=textutil.trimRight.call(this,pg[pg.length-1],r.endarr[3],removePunc);
			} else if (pg.length){
				pg[pg.length-1]=textutil.trimRight.call(this,pg[pg.length-1],r.endarr[3],removePunc);
			}
		}
		if (i==startpage) {
			pg=pg.slice(startline);
			if (r.startarr[3]) { // to prevent trimming leading punc
				pg[0]=textutil.trimLeft.call(this,pg[0],r.startarr[3],false);
			}
		}
		out=out.concat(pg);
	}
	//remove extra lines
	while (out.length && !out[out.length-1]) out.pop();
	cb&&cb(out);
	return out;
}

const getPages=function(kRange,cb) {
	const r=textutil.parseRange.call(this,kRange,this.addressPattern,true);
	const column=this.addressPattern.column;
	const bookkey=makeBookKey(r.startarr,r.endarr,column);

	const fetchpages=function(data){
		if (!data) {
			cb&&cb([]);
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
		var cb2=function(d2){
			if (singlekey) cb([d2]);
			else cb(d2);
		};
		if (!cb) cb2=null;
		const res=this.get(keys,{recursive:true,syncable:true},cb2);
		
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

const getText=function(kRange,cb){ //good for excerpt listing
	//call getPages
	if (typeof kRange==="object") {
		return getTexts.call(this,kRange,cb);
	}
	var cbtimer=null;
	var cb2=function(pages){
		cbtimer=setTimeout(function(){
			trimpages.call(this,kRange,pages,cb);
		}.bind(this),1);
	}.bind(this);
	if (!cb) cb2=null;
	var stockpages=getPages.call(this,kRange,cb2);

	if (typeof stockpages!=="undefined"&&
		typeof stockpages!=="string"&&
		typeof stockpages[0]!=="undefined") {
		clearTimeout(cbtimer);
		return trimpages.call(this,kRange,stockpages,cb);
	}
}

const getArticleText=function(id_name,cb){
	const article=this.getArticle(id_name);
	if (!article) {
		cb(null)
		return null;		
	}

	var krange=Ksanapos.makeRange(article.start,article.end,this.addressPattern);

	return getText.call(this,krange,cb);
}

const getArticleTextTag=function(id_name,cb){
	const article=this.getArticle(id_name);
	if (!article) {
		cb(null)
		return null;		
	}

	var krange=Ksanapos.makeRange(article.start,article.end,this.addressPattern);
	getText.call(this,krange,function(text){
		if (!text) {
			cb(null);
			return null;
		}
		this.getArticleFields(article.at,function(fields){
			cb({text:text,fields:fields});
		});
	}.bind(this));
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
module.exports={getText:getText,getArticleText:getArticleText,
	getArticleTextTag:getArticleTextTag,getPages:getPages}