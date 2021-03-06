const TokenTypes={//cannot use number, for RLE encoding
	SPACE:' ',
	LINEBREAK:'B',
	SURROGATE:'S',
	CJK:'C',
	NUMBER:'N',
	TIBETAN:'T',
	LATIN:'A',
	IDC:'I',
	PUNC:'P'
}
var map=[];
const unpackRLE=function(str){
	var i=0,o="";
	str.replace(/(\d+)(.)/g,function(m,m1,m2){
		for (i=0;i<parseInt(m1,10);i++) {
			o+=m2;
		}
	})
	return o;
}
const buildMap=function(){
	const tokentypemap=unpackRLE(require("./tokentypemap"));
	if (tokentypemap.length!==65536) {
		throw "token map unpack error";
	}
	map=tokentypemap.split("");
	Object.freeze(map);
}
const getCode2TokenTypeMap=function(ver){//now only have one version
	if (!map.length) buildMap();
	return map;
}

module.exports={TokenTypes:TokenTypes,getCode2TokenTypeMap:getCode2TokenTypeMap};