const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;
const bsearch=require("./bsearch");

const getField=function(name,cb){
	return this.get(["fields",name],{recursive:true},function(data){return cb&&cb(data)});
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

const parseRange=function(kRange,pat){
	if (typeof pat=="undefined") pat=this.addressPattern;
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}
	const r=Ksanapos.breakKRange(kRange,pat);
	
	const startarr=Ksanapos.unpack(r.start,pat);
	var endarr=Ksanapos.unpack(r.end,pat);
	return {startarr,endarr,start:r.start,end:r.end,kRange};
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
	if (!str) return "";
	var c=chcount,dis=0,t,s=str;

	t=this.knext(s,c);
	dis+=t;
	/*
	s=s.substr(t);
	while (s.charCodeAt(0)<0x3400||s.charCodeAt(0)>0xdfff){
		s=s.substr(1);
		dis++;
	}	
	*/
	return str.substr(0,dis);
}
const trimLeft=function(str,chcount) {
	if (!str) return "";
	var c=chcount,dis=0,t,s=str;
	t=this.knext(s,c);
	dis+=t;
	s=s.substr(t);
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

	var stockpages=getPages.call(this,kRange,function(pages){
		trimpages.call(this,pages);
	}.bind(this));
	if (typeof stockpages!=="undefined"&&
		typeof stockpages!=="string") return trimpages(stockpages);
	//remove extra leading and tailing line	
}

const fileOf=function(kRange_address){
	var kRange=kRange_address;
	const pat=this.addressPattern;
	if (typeof kRange_address=="string") {
		kRange=Ksanapos.parse(kRange_address,pat);
	}
	const range=Ksanapos.breakKRange(kRange,pat);

	const filepos=this.get(["fields","file","pos"]);
	const filename=this.get(["fields","file","value"]);
	if (!filepos) return -1;

	const at=bsearch(filepos,range.start+1,true);
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
const lineCharOffset=function(beginkpos,kpos_address,getLine){
	const pat=this.addressPattern;
	const begin=Ksanapos.unpack(beginkpos,pat);
	var start,end,r;
	if (typeof kpos_address=="string") {
		const range=Ksanapos.parse(kpos_address,pat);
		r=Ksanapos.breakKRange(range,pat);
	} else {
		r=Ksanapos.breakKRange(kpos_address,pat);
	}

	start=r.start
	end=r.end;

	const sarr=Ksanapos.unpack(start,pat);
	const earr=Ksanapos.unpack(end,pat);

	const firstline=(begin[1]*pat.maxline+begin[2]);
	const line=(sarr[1]*pat.maxline+sarr[2])-firstline;
	const line2=(earr[1]*pat.maxline+earr[2])-firstline;
	const l1=getLine(line),l2=getLine(line2);
	
	var ch=this.knext(l1,sarr[3]);
	var ch2=this.knext(l2,earr[3]);

	//skip puncuation, hacky
	var code=l1.charCodeAt(ch);
	while (ch<l1.length && (code<0x3400 || code>=0xdfff)) {
		ch++;
		code=l1.charCodeAt(ch);
	}
	
	start={line,ch};
	end={line:line2,ch:ch2};
	return {start,end}
}
const stringify=function(krange_kpos,kend){
	const pat=this.addressPattern;
	if (kend) return Ksanapos.stringify(Ksanapos.makeKRange(krange_kpos,kend,pat),pat);
	return Ksanapos.stringify(krange_kpos,pat);
}
const extractKPos=function(text){
	var out={},pat=this.addressPattern,fileOf=this.fileOf.bind(this);
	text.replace(this.addressRegex,function(m,m1){
		const kRange=Ksanapos.parse(m1,pat);
		if (typeof kRange!=="undefined") {
			var f=fileOf(kRange);
			if (!f.filename) return;
			if (!out[f.filename]) out[f.filename]=[];
			out[f.filename].push(kRange);
		}
	});
	return out;
}
const makeKRange=function(kstart,kend){
	return Ksanapos.makeKRange(kstart,kend,this.addressPattern);
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
	engine.makeKRange=makeKRange;
	//engine.kPosUnpack=kPosUnpack;
	engine.advanceLineChar=advanceLineChar;
	engine.lineCharOffset=lineCharOffset;
	engine.parseRange=parseRange;
	engine.getFileName=getFileName;
	engine.extractKPos=extractKPos;
	engine.addressRegex=/@([\dpabcd]+-[\dabcd]+);?/g;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
}

module.exports={init};