const Ksanapos=require("./ksanapos");
const bsearch=require("./bsearch");

const articleOf=function(kRange_address){
	var kRange=kRange_address;
	const pat=this.addressPattern;
	if (typeof kRange_address=="string") {
		kRange=Ksanapos.parse(kRange_address,pat);
	}
	const range=Ksanapos.breakKRange(kRange,pat);

	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
	if (!articlepos) return null;

	var at=bsearch(articlepos,range.start+1,true);
	var start=articlepos[at-1];
	if (!start) {
		at=1;
		start=articlepos[0];
	}
	var end=articlepos[at];

	const r=adjustArticleRange.call(this,start,end);

	return {at:at-1, articlename:articlename[at-1],
	 start:r.start, startH:this.stringify(r.start),end:r.end,endH:this.stringify(r.end)};
}

const getArticleName=function(id){
	const articlenames=this.get(["fields","article","value"]);
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
	const articlepos=this.get(["fields","article","pos"]);
	const articlename=this.get(["fields","article","value"]);
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
	
	return {at:at, articlename:articlename[at], end:r.end, start:r.start
		,startH:this.stringify(r.start),end:r.end,endH:this.stringify(r.end) };
}

module.exports={getArticle:getArticle,articleOf:articleOf,
getArticleName:getArticleName,adjustArticleRange:adjustArticleRange}