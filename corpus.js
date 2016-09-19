const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const {createTokenizer}=require("./tokenizer");

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

const getPages=function(kRange,cb) {
	const pat=this.addressPattern;
	if (typeof kRange=="string") {
		kRange=Ksanapos.parse(kRange,pat);
	}

	const {start,end}=Ksanapos.breakKRange(kRange,pat);
	
	const startarr=Ksanapos.unpack(start,pat);
	var endarr=Ksanapos.unpack(end,pat);
	
	const keys=makeTextKeys(startarr,endarr,pat.columnbits)
	
	this.get(keys,{recursive:true},cb);
}
const getLines=function(){ //good for excerpt listing
	//call getPages
	//remove extra leading and tailing line	
}
const getTexts=function(){ //for small piece of text
	//call getLines
	//remove leading and tailing char and join the lines
}
//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getField=getField;
	engine.getFieldNames=getFieldNames;
	engine.getPages=getPages;
}

module.exports={init};