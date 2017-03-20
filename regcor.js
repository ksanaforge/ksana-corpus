const Ksanapos=require("./ksanapos");
const P=Ksanapos.buildAddressPattern;

var registered_corpus={
	"default":P([7,10,5,8]),
	"pts":P([7,10,6,6]),
	"yinshun":P([7,11,5,6]),
	"taisho":P([6,13,5,5],3),
	"nanchuan":P([7,10,4,6]),
	"taixu":P([6,12,5,6]),
	"j13zs":P([4,13,4,6],4), //4 column per page
	"mpps":P([1,12,6,8])
}
module.exports=registered_corpus;