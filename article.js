const Ksanapos=require("./ksanapos");
const bsearch=require("./bsearch");

const getArticleTPos=function(at){
	const article2tpos=this.get(["inverted","article2tpos"]);
	var start=0,end=0;
	if (article2tpos && at>=0 && at<=article2tpos.length) {
		start=article2tpos[at];
		end=article2tpos[at+1];
		if (start && !end) end=this.meta.endtpos;
	}
	return {start:start,end:end};
}
const articleOf=function(kRange_address){
	var kRange=kRange_address;
	const pat=this.addressPattern;
	if (typeof kRange_address=="string") {
		kRange=Ksanapos.parse(kRange_address,pat);
	}
	const range=Ksanapos.breakRange(kRange,pat);

	const articlepos=this.get(["gfields","article","pos"]);
	const articlename=this.get(["gfields","article","value"]);
	if (!articlepos) return null;

	var at=bsearch(articlepos,range.start+1,true);
	var start=articlepos[at-1];
	if (!start) {
		at=1;
		start=articlepos[0];
	}
	var end=articlepos[at];

	const r=adjustArticleRange.call(this,start,end);
	const tpos=getArticleTPos.call(this,at-1);

	return {at:at-1, articlename:articlename[at-1],
		tstart:tpos.start,tend:tpos.end, 
	 start:r.start,startH:this.stringify(r.start),end:r.end,endH:this.stringify(r.end)};
}

const getArticleName=function(id){
	const articlenames=this.get(["gfields","article","value"]);
	return articlenames[id];
}

//warning , if no article tag at begining of file.
//fetching last article of previous file will truncate the upper part
const adjustArticleRange=function(start,end){
	const pat=this.addressPattern;
	if (typeof end=="undefined") end=this.meta.endpos;

	//cross book article, adjust start to begining of end book
	if (this.bookOf(end)>this.bookOf(start)) {
		const endbookbegin=Ksanapos.makeKPos([this.bookOf(end),0,0,0],pat);
		if (endbookbegin==end) { // end at start book
			end=Ksanapos.makeKPos([this.bookOf(start),pat.maxpage-1,pat.maxline-1,0],pat);
 		} else {  //starts from begining of end book
 			start=endbookbegin;	
 		}		
	}
	return {start:start,end:end};
}

const getArticle=function(at,nav) {
	const articlepos=this.get(["gfields","article","pos"]);
	const articlename=this.get(["gfields","article","value"]);
	if (!articlepos) return null;

	if (typeof id_name==="string") {
		at=articlename.indexOf(id_name);
	}
	if (at<0) return null;

	at+=(nav||0);
	var start=articlepos[at];
	var end=articlepos[at+1];
	if (!start)return null;
	if (typeof end=="undefined") end=this.meta.endpos;

	const r=adjustArticleRange.call(this,start,end);
	const tpos=getArticleTPos.call(this,at);

	return {at:at, articlename:articlename[at], end:r.end, start:r.start,
		tstart:tpos.start,tend:tpos.end
		,startH:this.stringify(r.start),end:r.end,endH:this.stringify(r.end) };
}
const articleCount=function(){
	const articlename=this.get(["gfields","article","value"]);
	return articlename.length;
}

const trimArticleField=function(allfields,article){
	const s=bsearch(allfields.pos,article.start,true);
	const e=bsearch(allfields.pos,article.end,true);
	return {pos:allfields.pos.slice(s,e+1),value:allfields.value.slice(s,e+1)};
}
module.exports={getArticle:getArticle,articleOf:articleOf,articleCount:articleCount,
getArticleName:getArticleName,adjustArticleRange:adjustArticleRange,trimArticleField:trimArticleField}