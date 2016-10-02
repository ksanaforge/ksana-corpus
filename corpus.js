const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;
const bsearch=require("./bsearch");

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
	if (typeof pat=="undefined") pat=this.addressPattern;
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}
	const r=Ksanapos.breakKRange(kRange,pat);
	
	const startarr=Ksanapos.unpack(r.start,pat);
	var endarr=Ksanapos.unpack(r.end,pat);
	return {startarr,endarr,start:r.start,end:r.end};
}
const kPosUnpack=function(kpos,pat){
	pat=pat||this.addressPattern;
	const startarr=Ksanapos.unpack(kpos,pat);
	return startarr;
}
const getPages=function(kRange,cb) {
	const r=parseRange.call(this,kRange,this.addressPattern);

	const keys=makeTextKeys(r.startarr,r.endarr,this.addressPattern.columnbits)
	
	return this.get(keys,{recursive:true},cb);
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
	const trimpages=function(pages){
		var out=[],i,pat=this.addressPattern;
		const r=parseRange.call(this,kRange,this.addressPattern);
		const startpage=r.startarr[1],endpage=r.endarr[1];
		for (i=startpage;i<=endpage;i++){
			var pg=JSON.parse(JSON.stringify(pages[i-startpage]));
			if (i!=endpage){ //fill up array to max page line
				while (pg.length<pat.maxline) pg.push("");
			}

			if (i==endpage) {//trim following
				pg.length=r.endarr[2]+1;
				pg[pg.length-1]=trimRight.call(this,pg[pg.length-1],r.endarr[3]);
			}
			if (i==startpage) {
				pg=pg.slice(r.startarr[2]);
				pg[0]=trimLeft.call(this,pg[0],r.startarr[3]);
			}
			out=out.concat(pg);
		}
		cb&&cb(out);
		return out;
	}

	var stockpages=getPages.call(this,kRange,(pages)=>{
		trimpages.call(this,pages);
	});
	if (typeof stockpages!=="undefined"&&
		typeof stockpages!=="string") return trimpages(stockpages);
	//remove extra leading and tailing line	
}

const fileOf=function(kRange_address){
	var kRange=kRange_address;
	if (typeof kRange_address=="string") {
		kRange=Ksanapos.parse(kRange_address,this.addressPattern);
	}
	const filepos=this.get(["fields","file","pos"]);
	const filename=this.get(["fields","file","value"]);
	if (!filepos) return -1;
	const at=bsearch(filepos,kRange+1,true);
	var start=filepos[at-1];
	if (!start)start=0;
	return {at:at-1, filename:filename[at-1], end:filepos[at], start};
}

const getFileName=function(id){
	const filenames=this.get(["fields","file","value"]);
	return filenames[id];
}
const getFile=function(id_name,cb){
	const filepos=this.get(["fields","file","pos"]);
	const filename=this.get(["fields","file","value"]);
	var start,end;
	if (typeof id_name==="string") {
		const at=filename.indexOf(id_name);
		start=filepos[at];
		end=filepos[at+1];
	} else if (typeof id_name==="number"){
		start=filepos[id_name];
		end=filepos[id_name+1];
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
/*
  add advline to kpos and return new kpos 
  advline can be more than maxChar
	crossing vol is not allowed
*/
const advanceLineChar=function(kpos,advline,linetext){
	const pat=this.addressPattern;
	kpos+=advline*pat.maxchar;
	var arr=Ksanapos.unpack(kpos,pat);
	arr[3]=this.kcount(linetext);
	return Ksanapos.makeKPos(arr,pat);
}
const stringify=function(krange_kpos,kend){
	const pat=this.addressPattern;
	if (kend) return Ksanapos.stringify(Ksanapos.makeKRange(krange_kpos,kend,pat),pat);
	return Ksanapos.stringify(krange_kpos,pat);
}
//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits,engine.meta.column);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getField=getField;
	engine.getFieldNames=getFieldNames;
	engine.getPages=getPages;
	engine.getText=getText;
	engine.fileOf=fileOf;
	engine.getFile=getFile;
	engine.stringify=stringify;
	//engine.kPosUnpack=kPosUnpack;
	engine.advanceLineChar=advanceLineChar;
	engine.parseRange=parseRange;
	engine.getFileName=getFileName;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
}

module.exports={init};