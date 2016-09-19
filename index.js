const Engine=require("./engine");

const openCorpus=function(id,opts,readycb){
	Engine.open(id,opts,readycb);
}
module.exports={openCorpus}