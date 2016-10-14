/*
	Coordinate transformation between kpos and codemirror line ch
*/
const bsearch=require("./bsearch");
const textutil=require("./textutil");
//get the byte distance from kpos to begining of logical line
//a logical line might span across multiple raw line
const getUnicodeCharDis=function(kpos,loglineKpos,getLine){
	var linedis=this.bookLineOf(kpos)-this.bookLineOf(loglineKpos);
	var chardis=0;

	var ln1=this.bookLineOf(loglineKpos);
	while (linedis) {
		chardis+=getLine(ln1++).length;
		linedis--;
	}
	return chardis;
}
//convert kpos to codemirror line:ch
const toLogicalPos=function(linebreaks,kpos,getLine,omitpunc) {
	if (typeof kpos=="string") {
		const k=parseRange.call(this,kpos);
		kpos=k.start;
	}
	var line=bsearch(linebreaks,kpos,true)-1;
	var eoff  =this.charOf(linebreaks[line]);
	var linedis=this.bookLineOf(kpos)-this.bookLineOf(linebreaks[line]);
	var chardis=getUnicodeCharDis.call(this,kpos,linebreaks[line],getLine);
	var l1=getLine(this.bookLineOf(kpos));
	var ch=textutil.trimRight.call(this,l1,this.charOf(kpos),omitpunc).length;

	//leftpart of this rawline is in previous paragraph,maxchar less than 100
	var prevcount=textutil.trimRight.call(this,l1,eoff,true).length;
	return {line,ch:ch+chardis-prevcount};
}
const toLogicalRange=function(linebreaks,address,getLine){ //find logical line
	var krange=textutil.parseRange.call(this,address);
	const start=toLogicalPos.call(this,linebreaks,krange.start,getLine,true);
	const end=toLogicalPos.call(this,linebreaks,krange.end,getLine);	
	return {start,end};
}
const fromLogicalPos=function(textline,ch,startkpos,getLine){
	var start=this.bookLineOf(startkpos);
	var line=getLine(start);
	var offset=textutil.trimRight.call(this,line,this.charOf(startkpos),true).length;
	if (line.length>=ch) { //ch is in this line
		return startkpos+this.kcount(textline.substr(0,ch));
	}
	line=line.substr(offset);
	var now=start;
	while (ch>line.length) { //decrease ch with length of raw line
		ch-=line.length;
		line=getLine(++now);
	}
	t=line.substr(0,ch); //remain text from closest raw line till pos::ch
	return textutil.advanceLineChar.call(this,startkpos,now-start,t);
}

module.exports={toLogicalPos,toLogicalRange,fromLogicalPos};