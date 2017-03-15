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
const toLogicalPos=function(linebreaks,kpos,getRawLine,omitpunc,omitendingpunc) {
	//if (kpos==25166339) debugger
	if (typeof kpos=="string") {
		const k=textutil.parseRange.call(this,kpos);
		kpos=k.start;
	}

	const line=bsearch(linebreaks,kpos+1,true)-1;
	const loglineKPos=linebreaks[line];//kPos of logical line
	const eoff  =this.charOf(loglineKPos);
	const firstline=this.bookLineOf(linebreaks[0]);
	const chardis=getUnicodeCharDis.call(this,firstline,kpos,loglineKPos,getRawLine);
	var nrawline=this.bookLineOf(kpos)-firstline;
	const l1=getRawLine(nrawline);
	var extraspace=0;
	//calculate extra spacing added by layoutText when joining latin line
	if (chardis) { 
		var dis=chardis,n=nrawline,l=l1;
		while (dis>0) {
			extraspace+=this.tokenizer.isConcatable(l)?0:1;
			n--;
			l=getRawLine(n);
			dis-=l.length;
		}
	}
	var ch=textutil.trimRight.call(this,l1,this.charOf(kpos),omitpunc).length;
	const paragraphfirstline=getRawLine(this.bookLineOf(loglineKPos)-firstline);
	 
	if (omitendingpunc) {
		while (ch&&textutil.isPunc.call(this,l1.charCodeAt(ch-1))) ch--;
	}
	const prevcount=textutil.trimRight.call(this,paragraphfirstline,eoff,omitpunc).length;

	return {line:line,ch:ch+chardis-prevcount+extraspace};
}
const toLogicalRange=function(linebreaks,address,getRawLine){ //find logical line
	var krange=textutil.parseRange.call(this,address);
	var start=toLogicalPos.call(this,linebreaks,krange.start,getRawLine,this.meta.removePunc,false);
	var end=toLogicalPos.call(this,linebreaks,krange.end,getRawLine,this.meta.removePunc,true);
	if (krange.start==krange.end) {
		start=end;
	}

	return {start:start,end:end};
}
const fromLogicalPos=function(textline,ch,startkpos,firstline,getRawLine,oneline){
	const start=this.bookLineOf(startkpos)||0;
	var line=getRawLine(start-firstline);
	if (!line) return 1;
	
	var offset=textutil.trimRight.call(this,line,this.charOf(startkpos),true).length;
	if ((line.length-offset)>=ch || oneline) { //ch is in this line
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

module.exports={toLogicalPos:toLogicalPos,toLogicalRange:toLogicalRange,fromLogicalPos:fromLogicalPos};