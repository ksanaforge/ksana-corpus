const bsearch=require("./bsearch");
const groupNames=function(){
	return this.get(["gfields","group","value"])
	||this.get(["gfields","article","value"]);
}
const groupKPoss=function(){
	return this.get(["gfields","group","pos"])||
	this.get(["gfields","article","pos"]);
}
const groupTPoss=function(){
	return this.get(["inverted","group2tpos"])||
	this.get(["inverted","article2tpos"]);
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
//return group of articles containing address
const groupArticles=function(address){
	var kpos;
	if (typeof address=="number") kpos=address;
	else {
		const r=this.parseRange(address);
		kpos=r.start;		
	}
	const kposs=this.groupKPoss.call(this);
	const at=bsearch(kposs,kpos+10,true)-1;

	const range=this.groupKRange.call(this,at);

	const articlepos=this.get(["gfields","article","pos"]);
	const articlename=this.get(["gfields","article","value"]);

	var out=[];
	for (var i=0;i<articlepos.length;i++) {
		const vpos=articlepos[i];
		if (vpos>=range[0] && vpos<range[1]) {
			out.push(this.getArticle(i));
		}
	}
	return out;
}
const getTitle=function(address,sep){
	const groupname=getGroupName.call(this,address);
	const article=this.articleOf(address);

	return groupname+(sep||"-")+article.articlename;
}
const getGroupName=function(address,shortname){
	const groupNames=this.groupNames();
	if (!groupNames) return "";
	const at=groupOf.call(this,address);
	var groupname=groupNames[at]||"";
	groupname=shortname?groupname.substr(0,groupname.indexOf(";")):groupname.substr(groupname.indexOf(";")+1)	
	return groupname;
}
const groupOf=function(address){
	const r=this.parseRange(address);
	const kpos=r.start;
	const kposs=this.groupKPoss.call(this);

	var groupname="";
	const at=kposs?bsearch(kposs,kpos+10,true)-1:0;
	return at;
}
module.exports={groupNames:groupNames,groupKPoss:groupKPoss,
groupTPoss:groupTPoss,groupKRange:groupKRange,groupTRange:groupTRange,
groupArticles:groupArticles,getTitle:getTitle,getGroupName:getGroupName,
groupOf:groupOf};