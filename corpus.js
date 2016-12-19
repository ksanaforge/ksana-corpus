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
	return textutil.parseRange.call(this,krange,this.addressPattern,true);
}

const stringify=function(krange_kpos,kend){
	const pat=this.addressPattern;
	if (kend) return Ksanapos.stringify(Ksanapos.makeKRange(krange_kpos,kend,pat),pat,true);
	return Ksanapos.stringify(krange_kpos,pat);
}

const makeKRange=function(kstart,kend){
	return Ksanapos.makeKRange(kstart,kend,this.addressPattern);
}

//get a juan and break by p
const init=function(engine){
	engine.addressPattern=Ksanapos.buildAddressPattern(engine.meta.bits,engine.meta.column);
	engine.tokenizer=createTokenizer(engine.meta.versions.tokenizer);
	engine.getArticle=article.getArticle;
	engine.getField=getfield.getField;
	engine.getBookField=getfield.getBookField;
	engine.getArticleField=getfield.getArticleField;
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
	engine.makeKRange=makeKRange;
	engine.parseRange=parseRange;
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
	engine.getSubTOC=TOC.getSubTOC;
	engine.addressRegex=/@([\dpabcd]+-[\dabcd]+);?/g;
	engine.kcount=Ksanacount.getCounter(engine.meta.language);
	engine.knext=Ksanacount.getNext(engine.meta.language);
	engine.tPosToKRange=tpos.tPosToKRange;
	engine.groupNames=group.groupNames;
	engine.groupKPoss=group.groupKPoss;
	engine.groupTPoss=group.groupTPoss;
	engine.groupKRange=group.groupKRange;
	engine.groupTRange=group.groupTRange;
	engine.groupArticles=group.groupArticles;
	engine.getTitle=group.getTitle;
	engine.cachedSubTOC={};
	engine.cachedTOC=[];
	engine.fromTPos=tpos.fromTPos;
	engine.cachedPostings={};
}

module.exports={init:init};