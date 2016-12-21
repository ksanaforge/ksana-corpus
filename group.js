const bsearch=require("./bsearch");
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

	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);

	var out=[];
	for (var i=0;i<articlepos.length;i++) {
		const vpos=articlepos[i];
		if (vpos>=range[0] && vpos<range[1]) {
			out.push(this.getArticle(i));
		}
	}
	return out;
}
const getTitle=function(address,sep,shortname){
	const r=this.parseRange(address);
	const kpos=r.start;
	const kposs=this.groupKPoss.call(this);
	const at=bsearch(kposs,kpos+10,true)-1;
	if (at<0) return "";
	const groupname=this.groupNames()[at].replace(shortname?/;.*/:/.*?;/,"");
	const article=this.articleOf(address);

	return groupname+(sep||"-")+article.articlename;
}
module.exports={groupNames:groupNames,groupKPoss:groupKPoss,
groupTPoss:groupTPoss,groupKRange:groupKRange,groupTRange:groupTRange,
groupArticles:groupArticles,getTitle:getTitle};