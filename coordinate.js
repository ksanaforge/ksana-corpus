/*
	Coordinate transformation between kpos and codemirror line ch
*/
const bsearch=require("./bsearch");
const textutil=require("./textutil");
//get the byte distance from kpos to begining of logical line
//a logical line might span across multiple raw line
const getUnicodeCharDis=function(firstline,kpos,loglineKPos,getRawLine){	
	var linedis=this.bookLineOf(kpos)-this.bookLineOf(loglineKPos);
	var chardis=0;

	var ln1=this.bookLineOf(loglineKPos)-firstline;
	while (linedis) {
		const rawline=getRawLine(ln1);
		if (!rawline) break;
		ln1++;
		chardis+=rawline.length;
		linedis--;
	}
	return chardis;
}
//convert kpos to codemirror line:ch
const toLogicalPos=function(linebreaks,kpos,getRawLine,omitpunc) {
	if (typeof kpos=="string") {
		const k=parseRange.call(this,kpos);
		kpos=k.start;
	}
	const line=bsearch(linebreaks,kpos+1,true)-1;
	const loglineKPos=linebreaks[line];//kPos of logical line
	const eoff  =this.charOf(loglineKPos);
	const firstline=this.bookLineOf(linebreaks[0]);
	const linedis=this.bookLineOf(kpos)-firstline;
	const chardis=getUnicodeCharDis.call(this,firstline,kpos,loglineKPos,getRawLine);
	const l1=getRawLine(this.bookLineOf(kpos)-firstline);
	const ch=textutil.trimRight.call(this,l1,this.charOf(kpos),omitpunc).length;

	const paragraphfirstline=getRawLine(this.bookLineOf(loglineKPos)-firstline);
	const prevcount=textutil.trimRight.call(this,paragraphfirstline,eoff,!omitpunc).length;
	return {line,ch:ch+chardis-prevcount};
}
const toLogicalRange=function(linebreaks,address,getRawLine){ //find logical line
	var krange=textutil.parseRange.call(this,address);
	const start=toLogicalPos.call(this,linebreaks,krange.start,getRawLine,true);
	const end=toLogicalPos.call(this,linebreaks,krange.end,getRawLine);	
	return {start,end};
}
const fromLogicalPos=function(textline,ch,startkpos,firstline,getRawLine){
	const start=this.bookLineOf(startkpos)||0;
	var line=getRawLine(start-firstline);
	if (!line) return 1;
	
	var offset=textutil.trimRight.call(this,line,this.charOf(startkpos),true).length;
	if ((line.length-offset)>=ch) { //ch is in this line
		return startkpos+this.kcount(textline.substr(0,ch));
	}
	line=line.substr(offset);
	var now=start;
	while (ch>line.length) { //decrease ch with length of raw line
		ch-=line.length;
		++now;
		line=getRawLine(now-firstline);
		if (typeof line=="undefined") {
			console.error("raw line not found",now-firstline);
			return startkpos;
		}
	}
	t=line.substr(0,ch); //remain text from closest raw line till pos::ch
	return textutil.advanceLineChar.call(this,startkpos,now-start,t);
}

module.exports={toLogicalPos,toLogicalRange,fromLogicalPos};