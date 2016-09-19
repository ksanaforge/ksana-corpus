/* engine api */

const setup=function(engine){
	engine.get=require("./api-get");

}
module.exports={setup};