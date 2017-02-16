const Ksanapos=require("./ksanapos");

var knownPatterns={
	"pts":Ksanapos.buildAddressPattern([7,10,6,6]),
	"yinshun":Ksanapos.buildAddressPattern([7,11,5,6]),
	"taisho":Ksanapos.buildAddressPattern([6,13,5,5],3),
	"nanchuan":Ksanapos.buildAddressPattern([7,10,4,6]),
	"taixu":Ksanapos.buildAddressPattern([6,12,5,6]),
	"j13zs":Ksanapos.buildAddressPattern([4,13,4,6],4) //4 column per page
}
module.exports=knownPatterns;