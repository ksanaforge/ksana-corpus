const isTocOfGroup=function(tocstart,tocend,groupstart,groupend){
	return (tocstart>=groupstart && tocend<groupend) //toc enclosed by group
		|| (tocstart<groupstart && tocend>groupend) //toc fully enclose group
}

const getGroupTOC=function(group,cb){// cut by group,not guarantee a complete tree
	group=parseInt(group)||0;
	if (group<0){
		cb&&cb([]);
		return;
	}
	const r=this.groupKRange(group);
	const articles=this.getField("article").value;

	const tocrange=this.getField("tocrange");
	if (!tocrange) {
		cb&&cb([]);
		return;
	}
	var keys=[] ,toc_title=[];
	for (var i=0;i<tocrange.value.length;i++) {
		if (isTocOfGroup(tocrange.pos[i],tocrange.value[i],r[0],r[1])) {
			toc_title.push("0\t"+articles[i]+"\t"+tocrange.pos[i].toString(36)); //see ksana-corpus-builder/subtree
			keys.push(["fields","toc","value",i]);
		}
	}
	console.log(keys)
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
		console.log(out.length)
		cb(out);
	}.bind(this))
}
const getArticleTOC=function(article){

}

const getTOC=function(kpos,cb){ //get toc containing kpos,
	const tocrange=this.getField("tocrange");
	if (!tocrange) return [];

	var keys=[],out=[],needfetch=false;
	for (var i=0;i<tocrange.pos.length;i++) {
		const start=tocrange.pos[i];
		const end=tocrange.value[i];
		if (kpos>=start && kpos<end) {
			if (this.cachedTOC[i]) {
				out.push(this.cachedTOC[i]);
			} else {
				needfetch=true;
				keys.push( ["fields","toc","value",i] );				
			}
		}
	}

	if (!needfetch) {
		cb&&cb(out);
		return out;
	} 
	
	const parseTOC=function(rawtoc){
		var out=[];
		for (var i=0;i<rawtoc.length;i++) {
			const fields=rawtoc[i].split("\t");
			out.push({d:parseInt(fields[0],10),
								t:fields[1],
								p:parseInt(fields[2],36)})
		}
		return out;
	}

	this.get(keys,{recursive:true},function(data){
		for (var i=0;i<keys.length;i++){
			const ntoc=keys[i][3];

			this.cachedTOC[ntoc] = parseTOC(data[i]);
			out.push(this.cachedTOC[ntoc]);
		}
		cb(out);
	}.bind(this));
}
module.exports={getTOC:getTOC,getGroupTOC:getGroupTOC};