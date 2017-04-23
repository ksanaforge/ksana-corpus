const bsearch=require("./bsearch");
const filterkey=function(name,prefix){
	const field=this.getKeyField(name);
	if (!field)return null;
	const out=[];
	const at=bsearch(field.key,prefix,true);
	for (var i=at;i<field.key.length;i++) {
		if (field.key[i].substr(0,prefix.length)==prefix) {
			out.push([field.key[i],field.kpos[i],field.value[i]]);
		}
	}
	return out;
}
module.exports=filterkey;