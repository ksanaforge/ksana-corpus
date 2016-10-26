/*
	Coordinate transformation between kpos and codemirror line ch
*/
const bsearch=require("./bsearch");
const textutil=require("./textutil");
//get the byte distance from kpos to begining of logical line
//a logical line might span across multiple raw line
const getUnicodeCharDis=function(kpos,loglineKpos,getRawLine){
	var linedis=this.bookLineOf(kpos)-this.bookLineOf(loglineKpos);
	var chardis=0;

	var ln1=this.bookLineOf(loglineKpos);
	while (linedis) {
		chardis+=getRawLine(ln1++).length;
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
	const eoff  =this.charOf(linebreaks[line]);
	const linedis=this.bookLineOf(kpos)-this.bookLineOf(linebreaks[line]);
	const chardis=getUnicodeCharDis.call(this,kpos,linebreaks[line],getRawLine);
	const l1=getRawLine(this.bookLineOf(kpos));
	const ch=textutil.trimRight.call(this,l1,this.charOf(kpos),omitpunc).length;

	const paragraphfirstline=getRawLine(this.bookLineOf(linebreaks[line]));
	const prevcount=textutil.trimRight.call(this,paragraphfirstline,eoff,!omitpunc).length;
	return {line,ch:ch+chardis-prevcount};
}
const toLogicalRange=function(linebreaks,address,getRawLine){ //find logical line
	var krange=textutil.parseRange.call(this,address);
	const start=toLogicalPos.call(this,linebreaks,krange.start,getRawLine,true);
	const end=toLogicalPos.call(this,linebreaks,krange.end,getRawLine);	
	return {start,end};
}
const fromLogicalPos=function(textline,ch,startkpos,getRawLine){
	var start=this.bookLineOf(startkpos);
	var line=getRawLine(start);
	var offset=textutil.trimRight.call(this,line,this.charOf(startkpos),true).length;
	if ((line.length-offset)>=ch) { //ch is in this line
		return startkpos+this.kcount(textline.substr(0,ch));
	}
	line=line.substr(offset);
	var now=start;
	while (ch>line.length) { //decrease ch with length of raw line
		ch-=line.length;
		line=getRawLine(++now);
	}
	t=line.substr(0,ch); //remain text from closest raw line till pos::ch
	return textutil.advanceLineChar.call(this,startkpos,now-start,t);
}

module.exports={toLogicalPos,toLogicalRange,fromLogicalPos};