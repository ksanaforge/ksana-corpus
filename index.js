const Engine=require("./engine");
const bsearch=require("./bsearch");
const trimArticleField=require("./article").trimArticleField;
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


const parseRange=function(str,pat){
	if (typeof pat=="string") {
		pat=knownPatterns[pat];
	}
	if (!pat)return null;
	return textutil.parseRange(krange,pat);
}
module.exports={openCorpus:openCorpus,bsearch:bsearch,parseLink:parseLink
,trimArticleField:trimArticleField,parseRange:parseRange,knownPatterns:knownPatterns};