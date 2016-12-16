const openCorpus=require("./engine").open;
const parseLink=function(fulladdress,cb){
	const r=fulladdress.split("@");
	if (r.length!==2) {
		cb&&cb(null);
		return null;
	}

	if (r[0]=="Taisho") {
		openCorpus(r[0].toLowerCase(),function(err,cor){
			if (err) {
				cb&&cb(null);
				return null;
			}
			const n=r[1].split("p");
			console.log("taisho number",n[0],"number",n[1]);
		});
	} else {
		const out={corpus:r[0],address:r[1]};
		cb&&cb(out);
		return out;
	}
	return null;
}
module.exports=parseLink;