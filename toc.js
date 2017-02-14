const getTOC=function(){
	return this.getField("toc");
}

const getGroupTOC=function(group,cb){
	group=parseInt(group)||0;
	if (group<0){
		cb&&cb([]);
		return;
	}
	const r=this.groupKRange(group);
	const articles=this.getField("article").value;

	const subtoc_range=this.getField("subtoc_range");
	if (!subtoc_range) {
		cb&&cb([]);
		return;
	}
	var keys=[] ,subtoc_title=[];
	for (var i=0;i<subtoc_range.value.length;i++) {
		if (subtoc_range.pos[i]>=r[0] && r[1]>subtoc_range.pos[i]) {
			subtoc_title.push("0\t"+articles[i]+"\t"+subtoc_range.pos[i].toString(36)); //see ksana-corpus-builder/subtree
			keys.push(["fields","subtoc","value",i]);
		}
	}
	
	this.get(keys,function(res){
		var out=[];
		var groupname=this.groupNames()[group];
		if (!groupname) {
			debugger;
			groupname="";
		}

		groupname=groupname.substr(groupname.indexOf(";")+1);
		out.push("0\t"+groupname+"\t"+r[0].toString(36));
		for (var j=0;j<res.length;j++) {
			out=out.concat(res[j]);
		}
		cb(out);
	}.bind(this))
}
const getSubTOC=function(kpos,cb){ //get toc containing kpos
	const subtoc_range=this.getField("subtoc_range");
	if (!subtoc_range) return [];
	var keys=[],out=[],needfetch=false;
	for (var i=0;i<subtoc_range.pos.length;i++) {
		const start=subtoc_range.pos[i];
		const end=subtoc_range.value[i];
		if (kpos>=start && kpos<end) {
			if (this.cachedSubTOC[i]) {
				out.push(this.cachedSubTOC[i]);
			} else {
				needfetch=true;
				keys.push( ["fields","subtoc","value",i] );				
			}
		}
	}

	if (!needfetch) {
		cb&&cb(out);
		return out;
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
module.exports={getTOC:getTOC,getSubTOC:getSubTOC,getGroupTOC:getGroupTOC};