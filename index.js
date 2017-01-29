const Engine=require("./engine");
const bsearch=require("./bsearch");
const subtree=require("./subtree");
const trimArticleField=require("./article").trimArticleField;
const openCorpus=function(id,opts,readycb){
	return Engine.open(id,opts,readycb);
}
const parseLink=require("./parselink");
module.exports={openCorpus:openCorpus,bsearch:bsearch,parseLink:parseLink
,trimArticleField:trimArticleField,subtree:subtree};