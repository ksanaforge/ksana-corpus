const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;

const getField=function(name,cb){
	return this.get(["fields",name],{recursive:true},(data)=>cb&&cb(data));
}

const getFieldNames=function(cb){
	const r=this.get(["fields"],(data)=>cb(Object.keys(data)));
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

const parseRange=function(kRange,pat){
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}
	const r=Ksanapos.breakKRange(kRange,pat);
	
	const startarr=Ksanapos.unpack(r.start,pat);
	var endarr=Ksanapos.unpack(r.end,pat);
	return {startarr,endarr,start:r.start,end:r.end};
}
const getPages=function(kRange,cb) {
	const r=parseRange.call(this,kRange,this.addressPattern);

	const keys=makeTextKeys(r.startarr,r.endarr,this.addressPattern.columnbits)
	
	this.get(keys,{recursive:true},cb);
}
const trimRight=function(str,chcount) {
	if (!str)return;
	var c=chcount,dis=0,t,s=str;

	while (c) {
		t=this.knext(s);
		s=s.substr(t);
		dis+=t;
		c--;
	}
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}	
	return str.substr(0,dis);
}
const trimLeft=function(str,chcount) {
	var c=chcount,dis=0,t,s=str;
	while (c) {
		t=this.knext(s);
		s=s.substr(t);
		dis+=t;
		c--;
	}
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}
	return str.substr(dis);
}
const getText=function(kRange,cb){ //good for excerpt listing
	//call getPages
	if (typeof kRange==="object") {
		return getTexts.call(this,kRange,cb);
	}

	getPages.call(this,kRange,(pages)=>{
		var out=[],i,pat=this.addressPattern;
		const r=parseRange.call(this,kRange,this.addressPattern);
		const startpage=r.startarr[1],endpage=r.endarr[1];
		for (i=startpage;i<=endpage;i++){
			var pg=JSON.parse(JSON.stringify(pages[i-startpage]));
			if (i==endpage) {//trim following
				pg.length=r.endarr[2]+1;
				pg[pg.length-1]=trimRight.call(this,pg[pg.length-1],r.endarr[3]);
			}
			if (i==startpage) {
				pg=pg.slice(r.startarr[2]);
				pg[0]=trimLeft.call(this,pg[0],r.startarr[3]);
			} else if (i!=endpage){ //fill up array to max page
				while (pg.length<pat.maxline) pg.push("");
			}
			out=out.concat(pg);
		}
		cb(out);
	});
	//remove extra leading and tailing line	
}


const getTexts=function(kRanges,cb){
	if (!kRanges || !kRanges.length) {
		cb([]);
		return;
	}
	var output=[];
	var jobs=JSON.parse(JSON.stringify(kRanges));
	const fire=function(kRange){
		getText.call(this,kRange,(data)=>{
			output.push(data);
			if (jobs.length) {
				fire.call(this,jobs.shift());			
			} else {
				cb(output);
			}
		});
	}	
	fire.call(this,jobs.shift());
}


//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits,engine.meta.column);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getField=getField;
	engine.getFieldNames=getFieldNames;
	engine.getPages=getPages;
	engine.getText=getText;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
}

module.exports={init};