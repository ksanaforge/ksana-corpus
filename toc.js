const getTOC=function(){
	return this.getField("toc");
}
const getSubTOC=function(kpos,cb){ //get toc containing kpos
	const subtoc_range=this.getField("subtoc_range");
	if (!subtoc_range) return [];
	var keys=[],out=[];
	for (var i=0;i<subtoc_range.pos.length;i++) {
		const start=subtoc_range.pos[i];
		const end=subtoc_range.value[i];
		if (kpos>=start && kpos<end) {
			if (this.cachedSubTOC[i]) {
				out.push(this.cachedSubTOC[i]);
			} else {
				keys.push( ["fields","subtoc","value",i] );				
			}
		}
	}

	const parseSubTOC=function(rawsubtoc){
		var out=[];
		for (var i=0;i<rawsubtoc.length;i++) {
			const fields=rawsubtoc[i].split("\t");
			out.push({d:parseInt(fields[0],10),
								t:fields[1],
								p:parseInt(fields[2],36)})
		}
		return out;
	}

	this.get(keys,{recursive:true},function(data){
		for (var i=0;i<keys.length;i++){
			const nsubtoc=keys[i][3];
			this.cachedSubTOC[nsubtoc] = parseSubTOC(data[i]);
			out.push(this.cachedSubTOC[nsubtoc]);
		}
		cb(out);
	}.bind(this));
}
module.exports={getTOC:getTOC,getSubTOC:getSubTOC};