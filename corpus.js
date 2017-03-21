const bsearch=require("./bsearch");
const Ksanapos=require("./ksanapos");
const Ksanacount=require("./ksanacount");
const createTokenizer=require("./tokenizer").createTokenizer;
const textutil=require("./textutil");
const coordinate=require("./coordinate");
const TOC=require("./toc");
const gettext=require("./gettext");
const getfield=require("./getfield");
const tpos=require("./tpos");
const article=require("./article");
const group=require("./group");
const parseRange=function(krange){
	return textutil.parseRange.call(this,krange,this.addressPattern);
}

const stringify=function(krange_kpos,kend){
	const pat=this.addressPattern;
	if (kend) return Ksanapos.stringify(Ksanapos.makeRange(krange_kpos,kend,pat),pat,true);
	return Ksanapos.stringify(krange_kpos,pat);
}

const makeRange=function(kstart,kend){
	return Ksanapos.makeRange(kstart,kend,this.addressPattern);
}

const makeKPos=function(nums){
	return Ksanapos.makeKPos(nums,this.addressPattern);	
}
const isRange=function(range){
	if (typeof range=="number"){
		return Ksanapos.isRange(range,this.addressPattern);
	} else {
		return Ksanapos.isRange(Ksanapos.parse(range,this.addressPattern),this.addressPattern);
	}
}
const linkingTo=function(fieldname,cor){
	return fieldname.indexOf(getfield.BILINKSEP+cor.id)>0;
}
//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits,engine.meta.column);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getArticle=article.getArticle;
	engine.getField=getfield.getField;
	engine.getGField=getfield.getGField;
	engine.getBookField=getfield.getBookField;
	engine.getArticleField=getfield.getArticleField;
	engine.getArticleFields=getfield.getArticleFields;
	engine.trimField=getfield.trimField;
	engine.getFieldNames=getfield.getFieldNames;
	engine.findAField=getfield.findAField;
	engine.getPages=gettext.getPages;
	engine.getText=gettext.getText;
	engine.articleOf=article.articleOf;
	engine.bookOf=textutil.bookOf;
	engine.pageOf=textutil.pageOf;
	engine.pageStart=textutil.pageStart;
	engine.lineOf=textutil.lineOf;
	engine.charOf=textutil.charOf;
	engine.stringify=stringify;
	engine.makeRange=makeRange;
	engine.makeKPos=makeKPos;
	engine.parseRange=parseRange;
	engine.isRange=isRange;
	engine.getArticleText=gettext.getArticleText;
	engine.getArticleTextTag=gettext.getArticleTextTag;
	engine.getArticleName=article.getArticleName;
	engine.articleCount=article.articleCount
	engine.extractKPos=textutil.extractKPos;
	engine.toLogicalRange=coordinate.toLogicalRange;
	engine.toLogicalPos=coordinate.toLogicalPos;
	engine.fromLogicalPos=coordinate.fromLogicalPos;
	engine.layoutText=textutil.layoutText;
	engine.bookLineOf=textutil.bookLineOf;
	engine.getTOC=TOC.getTOC;
	engine.addressRegex=/@([\dpabcd]+-[\dabcd]+);?/g;
	engine.kcount=Ksanacount.getCount(engine.tokenizer);
	engine.koffset=Ksanacount.getOffset(engine.tokenizer);
	engine.kskiptoken=Ksanacount.getSkipToken(engine.tokenizer,engine.meta.removePunc);
	engine.tPosToKRange=tpos.tPosToKRange;
	engine.groupNames=group.groupNames;
	engine.groupKPoss=group.groupKPoss;
	engine.groupTPoss=group.groupTPoss;
	engine.groupKRange=group.groupKRange;
	engine.groupTRange=group.groupTRange;
	engine.groupArticles=group.groupArticles;
	engine.getTitle=group.getTitle;
	engine.getGroupName=group.getGroupName;
	engine.groupOf=group.groupOf;
	engine.getGroupTOC=TOC.getGroupTOC;
	engine.cachedSubTOC={};
	engine.cachedTOC=[];
	engine.fromTPos=tpos.fromTPos;
	engine.cachedPostings={};
	engine.url=engine.kdb.url;
	engine.linkingTo=linkingTo;
}

module.exports={init:init};