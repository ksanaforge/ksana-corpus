const Ksanapos=require("./ksanapos");
const P=Ksanapos.buildAddressPattern;
const defaultPat=P([7,10,5,8]);
var registered_corpus={
	"default":defaultPat,
	"manual":defaultPat,
	"demo":defaultPat,
	"pts":P([7,10,6,6]),
	"yinshun":P([7,11,5,6]),
	"taisho":P([6,13,5,5],3),
	"nanchuan":P([7,10,5,6]),
	"taixu":P([5,12,6,6]),
	"j13zs":P([4,13,5,6],4), //4 column per page, 
	                         //line should change to 4 after layout
	"j13":P([4,9,5,6]), //開明書局版
	"mpps":P([2,12,6,6]),
	"swjzz":P([4,9,4,6]),
	"test":defaultPat,
	"fgdict":P([3,12,5,6],3),
	"bhscjeq":defaultPat,
	"yogacara":defaultPat
}
module.exports=registered_corpus;