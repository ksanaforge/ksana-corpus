const isTocOfGroup=function(tocstart,tocend,groupstart,groupend,isLast){
	const r=(tocstart>=groupstart && tocend<groupend) //toc enclosed by group
		|| (tocstart<groupstart && tocend>groupend) //toc fully enclose group

	if (!r && isLast) {
		return (tocstart>=groupstart && tocend<=groupend);
	}
	if (!r) {
		return ((tocstart>=groupstart && tocstart<groupend) || ((tocend>groupstart && tocend<=groupend)));
	}
	return r;
}

// 取得某一卷的第二個目錄
// 因為前一卷的 tocrange 尾端可能在本卷第一個 <h0> 的結尾
// 所以前一個 tocrange 會被認為落在本卷內.
// 所以要找第二個標題, 當成本卷的開端, 前一個 tocrange 就不會被認為在本卷內了
const getSecondToc=function(self,groupHead)
{
	//var toc=self.getField("toc");
	var tocrange=self.getField("tocrange");
	var firRange = -1;

	for(i=0;i<tocrange.value.length;i++)
	{
		if(tocrange.value[i]>groupHead)
		{
			firRange = i;
			break;
		}
	}
	
	if(firRange != -1)	// 找到才處理
	{
		var find_count = 0;	// 找到的 head 數
		var mykeys = [];
		// 此 group 的第二個 head 可能落在 firRange 和下一個 Range 之間

		mykeys.push(["fields","toc","value",firRange]);
		mykeys.push(["fields","toc","value",firRange+1]);
		var myTocPos = -1;
		self.get(mykeys,function(myres)
		{
			for(i=0;i<myres.length;i++)
			{
				for(j=0;j<myres[i].length;j++)
				{
					var fields = myres[i][j].split("\t");
					var toc_pos = parseInt(fields[2],36);

					if(toc_pos >= groupHead) find_count++;
					if(find_count == 2)
					{
						// 找到了
						myTocPos = toc_pos;
						return;
					}
				}
			}
		});
	}
	else
	{
		return groupHead;	// 找不到就傳回原來的位置
	}

	if(myTocPos != -1) 
		return myTocPos;
	else 
		return groupHead;
}

const getGroupTOC=function(group,cb){// cut by group,not guarantee a complete tree
	group=parseInt(group)||0;
	if (group<0){
		cb&&cb([]);
		return;
	}
	const r=this.groupKRange(group);
	const articles=this.getGField("article").value;

	const tocrange=this.getField("tocrange");
	if (!tocrange) {
		cb&&cb([]);
		return;
	}
	var keys=[] ,toc_title=[];
	var toc2th = getSecondToc(this,r[0]);	// 由卷首找出第二個目錄的位置
	for (var i=0;i<tocrange.value.length;i++) {
		const isLast=i==tocrange.value.length-1;
		if (isTocOfGroup(tocrange.pos[i],tocrange.value[i],toc2th,r[1],isLast)) {
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