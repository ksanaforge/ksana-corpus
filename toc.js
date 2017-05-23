const isTocOfGroup=function(tocstart,tocend,groupstart,groupend,isLast){
	/*
	const r=(tocstart>=groupstart && tocend<groupend) //toc enclosed by group
		|| (tocstart<groupstart && tocend>groupend) //toc fully enclose group

	if (!r && isLast) {
		return (tocstart>=groupstart && tocend<=groupend);
	}
	*/
	/*
	if (!r) {
		return ((tocstart>=groupstart && tocstart<groupend) || ((tocend>groupstart && tocend<=groupend)));
	}
	*/
	const r=(tocstart<=groupstart && tocend>=groupend) //toc fully enclose group
		|| (tocstart>=groupstart && tocstart<groupend) 
		|| (tocend>groupstart && tocend<=groupend)

	return r;
}

// 取得某一卷的第二個目錄
// 因為前一卷的 tocrange 尾端可能在本卷第一個 <h0> 的結尾
// 所以前一個 tocrange 會被認為落在本卷內.
// 所以要找第二個標題, 當成本卷的開端, 前一個 tocrange 就不會被認為在本卷內了

/////////////////////////////////////////
// 上面的方法不好, 因為可能沒有第二個標題... :(
// 如果前一卷的 tocrange 尾端可能在本卷第一個 <h0> 的結尾
// 此時前一卷 tocrange 的尾端會大於本卷 tocrange 的開頭
// 則設定前一卷 tocrange 的尾端 = 本卷 tocrange 的開頭
// if (tocrange[i-1].end > tocrange[i].head) tocrange[i-1].end = tocrange[i].head 
// 如此一來, 只要找第一個標題, 當成本卷的開端即可.

const getFirstToc=function(self,groupHead,groupTail,mycb)
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
		var mykeys = [];
		// 此 group 的第一個 head 可能落在 firRange 和下一個 Range 之間

		mykeys.push(["fields","toc","value",firRange]);
		if(firRange < tocrange.value.length - 1)
			mykeys.push(["fields","toc","value",firRange+1]);
		
		self.get(mykeys,function(myres)
		{
			for(i=0;i<myres.length;i++)
			{
				for(j=0;j<myres[i].length;j++)
				{
					var fields = myres[i][j].split("\t");
					var toc_pos = parseInt(fields[2],36);

					if(toc_pos >= groupHead && toc_pos < groupTail)
					{
						// 找到了
						mycb(toc_pos);
						return;
					}
				}
			}
			mycb(groupHead);
			return;
		});
	}
	else
	{
		mycb(groupHead);	// 找不到就傳回原來的位置
		return;
	}
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
	// 底下不得不改成 callback function
	getFirstToc(this,r[0],r[1],function(toc1st){	// 由卷首找出第一個目錄的位置
		var keys=[] ,toc_title=[];
		for (var i=0;i<tocrange.value.length;i++) {
			const isLast=i==tocrange.value.length-1;
			var tocragne_end = tocrange.value[i];
			if(!isLast && tocrange.value[i] > tocrange.pos[i+1]) tocragne_end = tocrange.pos[i+1];
			if (isTocOfGroup(tocrange.pos[i],tocragne_end,toc1st,r[1],isLast)) {
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