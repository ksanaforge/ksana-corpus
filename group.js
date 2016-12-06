const groupNames=function(){
	return this.get(["fields","group","value"]);
}
const groupKPoss=function(){
	return this.get(["fields","group","pos"]);
}
const groupTPoss=function(){
	return this.get(["inverted","group2tpos"]);
}

const groupKRange=function(g){
	const kposs=groupKPoss.call(this);
	const last=this.meta.endpos;
	const start=kposs[g],end=kposs[g+1];

	if (!start) return [0,last];
	if (!end) return [start,last];
	return [start,end];
}
const groupTRange=function(g){
	const tposs=groupTPoss.call(this);
	const last=this.meta.endtpos;
	const start=tposs[g],end=tposs[g+1];

	if (!start) return [0,last];
	if (!end) return [start,last];
	return [start,end];
}
module.exports={groupNames,groupKPoss,groupTPoss,groupKRange,groupTRange};