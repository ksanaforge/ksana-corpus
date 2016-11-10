const Engine=require("./engine");
const bsearch=require("./bsearch");
const openCorpus=function(id,opts,readycb){
	Engine.open(id,opts,readycb);
}
module.exports={openCorpus:openCorpus,bsearch:bsearch};