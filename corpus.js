const bsearch=require("./bsearch");
const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;
const textutil=require("./textutil");
const coordinate=require("./coordinate");
const getField=function(name,cb){
	return this.get(["fields",name],{recursive:true},function(data){return cb&&cb(data)});
}

const getBookField=function(name,book,cb){
	return this.get(["fields",name,book],{recursive:true},function(data){return cb&&cb(data)});	
}

const getFieldNames=function(cb){
	const r=this.get(["fields"],function(data){return cb(Object.keys(data))});
	return r?Object.keys(r):[];
}

const makeTextKeys=function(s,e,hascol){//without col
	var keys=[],pg,co;
	const bk=s[0];
	for (pg=s[1];pg<=e[1];pg++) {
		if (hascol){
			for (col=s[2];col<e[2];col++){
				keys.push(["texts",s[0],pg,col]);	
			}
		} else {
			keys.push(["texts",bk,pg]);	
		}
	}
	return keys;
}

const getPages=function(kRange,cb) {
	const r=textutil.parseRange.call(this,kRange,this.addressPattern,true);

	const keys=makeTextKeys(r.startarr,r.endarr,this.addressPattern.columnbits)
	
	return this.get(keys,{recursive:true},cb);
}

const getText=function(kRange,cb){ //good for excerpt listing
	//call getPages
	if (typeof kRange==="object") {
		return getTexts.call(this,kRange,cb);
	}
	const trimpages=function(pages){
		var out=[],i,pat=this.addressPattern;
		const r=textutil.parseRange.call(this,kRange,this.addressPattern,true);
		const startpage=r.startarr[1],endpage=r.endarr[1];
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

	var stockpages=getPages.call(this,kRange,function(pages){
		setTimeout(
			function(){trimpages.call(this,pages)}.bind(this),0
		);
	}.bind(this));
	if (typeof stockpages!=="undefined"&&
		typeof stockpages!=="string") return trimpages(stockpages);
	//remove extra leading and tailing line	
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
		start=0;
	}
	return {at:at-1, articlename:articlename[at-1], end:articlepos[at], start};
}

const getArticleName=function(id){
	const articlenames=this.get(["fields","article","value"]);
	return articlenames[id];
}
const getArticle=function(id_name,cb){
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
	if (kend) return Ksanapos.stringify(Ksanapos.makeKRange(krange_kpos,kend,pat),pat);
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
	engine.parseRange=textutil.parseRange;
	engine.getArticleName=getArticleName;
	engine.extractKPos=textutil.extractKPos;
	engine.toLogicalRange=coordinate.toLogicalRange;
	engine.toLogicalPos=coordinate.toLogicalPos;
	engine.fromLogicalPos=coordinate.fromLogicalPos;
	engine.layoutText=textutil.layoutText;
	engine.bookLineOf=textutil.bookLineOf;
	engine.addressRegex=/@([\dpabcd]+-[\dabcd]+);?/g;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
}

module.exports={init};