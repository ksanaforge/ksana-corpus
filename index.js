const Engine=require("./engine");
const bsearch=require("./bsearch");
const trimArticleField=require("./article").trimArticleField;
const closeCorpus=function(id){
	Engine.close(id);
}
const openCorpus=function(id,opts,readycb){
	if (typeof opts=="function") {
		readycb=opts;
		opts={};
	}

	if (id instanceof Array) {
		for (var i=0;i<id.length;i++) {
			Engine.open(id[i],opts);
		}
		const opentimer=setInterval(function(){
			if (!Engine.isBusy()){
				clearInterval(opentimer);
				readycb&&readycb();
			}
		},100);
	} else {
		return Engine.open(id,opts,readycb);
	}
}

const parseLink=require("./parselink");
const textutil=require("./textutil");
const Ksanapos=require("./ksanapos");
const regcor=require("./regcor");
const parseRange=function(str,pat){
	if (typeof pat=="string") {
		pat=regcor[pat];
	}
	if (!pat)return null;
	return textutil.parseRange(str,pat);
}
const stringifyRange=function(r,pat){
	if (typeof pat=="string") {
		pat=regcor[pat];
	}
	if (!pat)return "";
	return Ksanapos.stringify(r,pat);
}
//https://github.com/motss/normalize-diacritics/
const diacritics=require("./diacritics");
module.exports={openCorpus:openCorpus,closeCorpus:closeCorpus,
	bsearch:bsearch,parseLink:parseLink,diacritics
,trimArticleField:trimArticleField,parseRange:parseRange,stringifyRange:stringifyRange,
regcor:regcor};