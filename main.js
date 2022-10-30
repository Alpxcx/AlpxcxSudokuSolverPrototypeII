"use strict"

/*
  How to write codes correctly:
1.Do not create a new global when you can avoid it
2.Delete a global when no longer needed
3.Functions must always return results of the same type
4.Always make codes easier to read on the same performance level
5.Try to optimise codes for better performance
6.Make nore notes
7.Do not define a function directly inside a function
8.Use ui.js if you need to make any changes to html contents
9.Try not to call a function within a function, because js engines do not tend to compile the code when you do that
10.TypedArray will not enhance performance, writing arrays like traditional arrays is enough. If you want even more performance, use web assembley
*/


const sdmain = {};
sdmain.tools = {};
sdmain.tools.onlyOneDouble = true;
sdmain.buffer = {};
sdmain.buffer.delist = new Array(28).fill(0);
sdmain.io = {};
sdmain.io.log = false;
sdmain.io.logsBuffer = [];

class sd9{
	constructor(){
		//array, what's on the puzzle board, using 0-8 instead of 1-9
		this.arr=new Array(144).fill(16);
		/*
		//cell candidates
		//what position a number is at each row
		//what position a number is at each column
		//what position a number is at each box/block
		a special structure is used here
		cllcan uses 9x9 to describe each cell, but 16x9 of space is occupied
		the second last column is used to describe unfilled cells on each row
		and the last column is used to describe unfilled cells on each column
		*/
		this.cllcan=new Array(144).fill(511);
		this.rowcan=new Array(144).fill(511);
		this.colcan=new Array(144).fill(511);
		this.boxcan=new Array(144).fill(511);
		//unpaired position count at each row
		//unpaired position count at each column
		//unpaired position count at each box/block
		//this.bupcnt=new Array(9).fill(9);
		//filled cell count
		//paired cell count
		this.fcnt=0;
		this.pcnt=0;
		//DFS depth
		this.dcnt=0;
		//difficulty
		this.modd=0;
		//solver steps taken
		this.step=0;
		//isvalid
  	this.isvlid=true;
  	//issolved
  	this.issved=false;
	}
	init(arr_in){
		//Preparing for solving
		//Change "," to 0 outside this function
		var aa=sdmain.prjtions.atoarr;
		for(let i=0;i < 81;i++){
			if(arr_in[i]==0) continue;
			if(!this.isvlid) break;
  		this.placeWInit(arr_in[i]-1,aa[i]);
  	}
  	this.pcnt=this.fcnt;
	}
	placeWInit(n,p){
		//To place when init-ing. Placing a number(n) on a position(p)
		//if(this.arr[p]) return false;
		var bit = 1 << n;
		var bit_o = ~bit;
		var ll=this.cllcan;
		var rc=this.rowcan;
		var cc=this.colcan;
		var bxc=this.boxcan;
		//if(ll[p]==511) console.log("!");
		if(ll[p]&bit==0){
			this.isvlid=false;
			return false;
		}
		this.arr[p]=n;
		var r = p&0xf0;
		var c = p&0x0f;
		var c_rr=c;
		var br=r%0x30;
		var bc=c%3;
		var bx_p=3*(br >> 4)+bc;
		//below are variables used by rc - except bx
		var br_rr=r-br;
		var bc_rr=c-bc;
		var b = br_rr+bc_rr;
		var bx_wc=(bc_rr/3) << 4;
		var bx_w=br_rr+bx_wc;
		br_rr+=n;
		var rcbit_o = ~(1 << c);
		var bcbit_o = ~(7 << bc_rr);
		//below are variables used by cc
		bc_rr=(bc_rr << 4)+n;
		var r_cc=r >> 4;
		var c_cc=c << 4;
		var ccbit_o =  ~(1 << r_cc);
		var br_cc=br >> 4;
		var bc_cc=bc << 4;
		var brbit_o = ~(7 << (r_cc-br_cc));
		var bxbit_o = ~(1 << bx_p);
		//below are variables used by bc
		var bcbit_b=~(73 << bc);
		var brbit_b=~(7 << (br_cc*3));
		bx_wc+=n;
		//Loop unrolling
		ll[p]=512;
		rc[r+n]=512;
		cc[c_cc+n]=512;
		bxc[bx_w+n]=512;
		for(;c_rr < 144;){
			ll[r]&=bit_o;ll[c_rr]&=bit_o;rc[r]&=rcbit_o;rc[n]&=rcbit_o;cc[n]&=ccbit_o;bxc[bx_w]&=bxbit_o;bx_w++;n+=0x10;r++;c_rr+=0x10;
			ll[r]&=bit_o;ll[c_rr]&=bit_o;rc[r]&=rcbit_o;rc[n]&=rcbit_o;cc[n]&=ccbit_o;bxc[bx_w]&=bxbit_o;bx_w++;n+=0x10;r++;c_rr+=0x10;
			ll[r]&=bit_o;ll[c_rr]&=bit_o;rc[r]&=rcbit_o;rc[n]&=rcbit_o;cc[n]&=ccbit_o;bxc[bx_w]&=bxbit_o;bx_w++;n+=0x10;r++;c_rr+=0x10;
			cc[c_cc]&=ccbit_o;c_cc++;cc[c_cc]&=ccbit_o;c_cc++;cc[c_cc]&=ccbit_o;cc[bc_rr]&=brbit_o;bxc[bx_wc]&=bcbit_b;bxc[br_rr]&=brbit_b;rc[br_rr]&=bcbit_o;
			br_rr+=0x10;bc_rr+=0x10;bx_wc+=0x30;c_cc++;
			if((b-c)&0x0f){
				ll[b]&=bit_o;b+=0x10;
  			ll[b]&=bit_o;b+=0x10;
  			ll[b]&=bit_o;b-=0x1f;
			}else{b++;}
		}
		ll[r|0x0f]&=rcbit_o;  //^=(1 << c);
		ll[c_cc|0x0e]&=ccbit_o;  //^=(1 << (r >> 4));
		ll[bx_w|0x0d]&=bxbit_o;
		this.fcnt++;
		return true;
	}

	findSingleModeA(){
		//To get a naked single when this.mode=0
		var ll=this.cllcan;
		var a =sdmain.a;
		var bool=false;
		for(let i=0,j=0,n=0,
		rpbit=0,canbit=0,cancnt=0;i < 144;){
			if(!this.isvlid) break;
			rpbit=ll[i|0x0f];
			//Loop unrolling increased the speed by 12%
			for(j=7;j&511;j = j << 3){
				if(!(rpbit&j)){i+=3;continue;}
				{
					canbit=ll[i];cancnt=a[canbit];
  				if(cancnt==1){
    				//this code gets the only candidate in the single-candidate cell
  					if(canbit&0x03f){
  						if(canbit&0x007) n=canbit >> 1; //faster!
  						else n=3+(canbit >> 4);
  					}else n=6+(canbit >> 7);
  					if(sdmain.io.log){
  						sdmain.io.logsBuffer.push([this.step,"N Single",n,i]);
  					}
  					bool=this.placeWInit(n,i);
    			}else if(!cancnt){
    				this.isvlid=false;
    				return false;
    			}
				}i++;
				{
					canbit=ll[i];cancnt=a[canbit];
  				if(cancnt==1){
    				//this code gets the only candidate in the single-candidate cell
  					if(canbit&0x03f){
  						if(canbit&0x007) n=canbit >> 1; //faster!
  						else n=3+(canbit >> 4);
  					}else n=6+(canbit >> 7);
  					if(sdmain.io.log){
  						sdmain.io.logsBuffer.push(["N Single",n,i]);
  					}
  					bool=this.placeWInit(n,i);
    			}else if(!cancnt){
    				this.isvlid=false;
    				return false;
    			}
				}i++;
				{
					canbit=ll[i];cancnt=a[canbit];
  				if(cancnt==1){
    				//this code gets the only candidate in the single-candidate cell
  					if(canbit&0x03f){
  						if(canbit&0x007) n=canbit >> 1; //faster!
  						else n=3+(canbit >> 4);
  					}else n=6+(canbit >> 7);
  					if(sdmain.io.log){
  						sdmain.io.logsBuffer.push(["N Single",n,i]);
  					}
  					bool=this.placeWInit(n,i);
    			}else if(!cancnt){
    				this.isvlid=false;
    				return false;
    			}
				}i++;
			}i+=7;
  	}
  	return bool&&this.isvlid;
	}
	
	findHSingleRB(){
		//To get a hidden single on row/in box when this.mode=0
		var ll = this.cllcan;
		var rc = this.rowcan;
		var bxc= this.boxcan;
		var a  = sdmain.a;
		var b  = sdmain.b;
		var c  = sdmain.c;
		var bool=false;
		for(let i=0,n=0,p=0,canbit=0;i < 144;i+=0x10){
			if(ll[i|0x0f]){
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n++;
				canbit=rc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Row",n,i+p]);
					bool=this.placeWInit(n,i+p);
				}n-=8;
			}
			if(ll[i|0x0d]){
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n++;
				canbit=bxc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single in Box",n,b[i >> 4]+c[p]]);
					bool=this.placeWInit(n,b[i >> 4]+c[p]);
				}n-=8;
			}
		}
  	return bool&&this.isvlid;
	}

	findHSingleC(){
		//To get a hidden single on column when this.mode=0
		var ll = this.cllcan;
		var cc = this.colcan;
		var bxc= this.boxcan;
		var a  = sdmain.a;
		var bool=false;
		for(let i=0,n=0,p=0,canbit=0;i < 144;i+=0x10){
			if(ll[i|0x0e]){
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n++;
				canbit=cc[i+n];
				if(a[canbit]==1){
					if(canbit&0x03f){
						if(canbit&0x007) p=canbit >> 1;
						else p=3+(canbit >> 4);
					}else p=6+(canbit >> 7);
					if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"H Single on Col",n,(i >> 4)+(p << 4)]);
					bool=this.placeWInit(n,(i >> 4)+(p << 4));
				}n-=8;
			}
		}
  	return bool&&this.isvlid;
	}
	
	canSync(){
		arr=this.arr;
		ll=this.cllcan;
		for(let r=0,i1=r|0x0d,i2=r|0x0e,i3=r|0x0f;r < 144;){
			arr[i1]=ll[i1];
			arr[i2]=ll[i2];
			arr[i3]=ll[i3];
			r+=0x10;i1=r|0x0d;i2=r|0x0e;i3=r|0x0f;
		}
	}
	
	findDoubleModeA(){
		//To get a naked double when this.mode=0
		arr=this.arr;
		ll=this.cllcan;
		rc=this.rowcan;
		cc=this.colcan;
		bxc=this.boxcan;
		a =sdmain.a;
		ab=sdmain.ab;
		b =sdmain.b;
		c =sdmain.c;
		//This solver program is incomplete. Only finding doubles on rows has been implemented.
		for(let r=0,p1=0,p2=0,l=9,canbit=0,delbit=0,n1=0,n2=0,c1=0,c2=0,b1=0,b2=0,br=0,bc=0;r < 144;r+=0x10,l+=0x10){
			if(arr[r|0x0f] > 3){
				for(p1=r;p1 < l;p1++){
					canbit=ll[p1];
					if(a[canbit]!==2) continue;
					for(p2=p1;p2 < l;p2++){
						if(a[canbit&ll[p2]]!==2) continue;
						if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"Double on row",p1,p2,canbit]);
						n1=ab[canbit];
						n2=n1 >> 4;
						n1&=0x0f;
						canbit=~canbit;
						for(;r < l;r+=3){
							ll[r]&=canbit;
							ll[r+1]&=canbit;
							ll[r+2]&=canbit;
						}
						c1=p1-r;
						c2=p2-r;
						delbit=(1 << c1)|(1 << c2);
						rc[r+n1]=delbit;
						rc[r+n2]=delbit;
						arr[r|0x0f]&=(~delbit);
						if(c2-c1 < 3){
							bc=0x40;
							if((delbit|7)==7){bc=0;}
							else if((delbit|56)==56){bc=0x10;delbit=delbit >> 3;}
							else if((delbit|448)==448){bc=0x20;delbit=delbit >> 6;}
							if(bc < 0x30){
								br=r%0x30;
								bc+=(r-br);
								br=(br >> 4)*3;
								delbit=delbit << br;
								//here n means positions in the box
								n1=ab[canbit];
								n2=n1 >> 4;
								n1&=0x0f;
								if(sdmain.io.log) sdmain.io.logsBuffer.push([this.step,"Locked Double"],b1);
								b1=b[bc >> 4];
								for(b2=b1+9;b1 < b2;b1+=0x10){
									ll[b1]&=canbit;
									ll[b1+1]&=canbit;
									ll[b1+2]&=canbit;
								}
								n1=ab[canbit];
    						n2=n1 >> 4;
    						n1&=0x0f;
								bxc[bc+n1]=delbit;
								bxc[bc+n2]=delbit;
								arr[bc|0x0d]&=(~delbit);
							}
						}
						delbit=~(1 << (r >> 4));
						for(let c=0;c < 144;c+=0x10){
							cc[c+n1]&=delbit;
							cc[c+n2]&=delbit;
						}
						delbit=~delbit;
						cc[(c1 << 4)+n1]|=delbit;
						cc[(c2 << 4)+n1]|=delbit;
						canbit=~canbit;
						ll[p1]=canbit;
						ll[p2]=canbit;
						if(sdmain.tools.onlyOneDouble) return this.isvlid;
					}
				}
			}
		}
		
	}
}

sdmain.tools.countBitsLegacy = function(bits,end){
	if(end > 31) end=31;
	var r=0;
	for(let i=0;i < end;i++){
		if(bits&(1 << i)) r++;
	}
	return r;
}

sdmain.tools.genBitsR = function(lev){
	if(lev > 31) lev=31;
	var l=1 << lev;
	var r=new Array(l+1);
	for(let i=0;i < l;i++){
		r[i]=sdmain.tools.countBitsLegacy(i,lev);
	}
	r[l]=lev+1;
	return r;
}

sdmain.tools.get2Bits = function(){
	var l=9;
	var arr=new Array(512).fill(0); //385
	for(let i=0,j=0,a=0,b=0;i < 9;i++){
		a=(1 << i);
		arr[a]=i++;
		for(j=i;j < 9;j++){
			arr[a|(1 << j)]=(j << 4)|i;
		}
	}
	return arr;
}


sdmain.tools.bench = function(){
	var aa;
	console.time("a");
	//sdmain.io.log=true;
  for(let i=0;i < 20000;i++){
  	aa=new sd9();
  	aa.init("000105000140000670080002400063070010900000003010090520007200080026000035000409000");
  	//aa.init("000004028406000005100030600000301000087000140000709000002010003900000507670400000");
		aa.findSingleModeA(); //880ns //1550ns //1800ns
		aa.findSingleModeA();
		aa.findSingleModeA();
		aa.findSingleModeA();
		aa.findSingleModeA();
		aa.findSingleModeA();
		aa.findSingleModeA();
		/*
		aa.findHSingleRB();
		aa.findHSingleC();
		aa.findHSingleC();
		aa.findSingleModeA();
		aa.findHSingleC();
		aa.findSingleModeA();
		console.log(aa.fcnt);
		*/
		//console.log(aa.isvlid);
		//console.log(aa.arr);
		//console.log(aa.colcan[6]);
		//console.log(aa.colcan[128]);
		//console.log(aa.boxcan[7]);
	}
	console.timeEnd("a");
	console.time("b");
	for(let i=0;i < 20000;i++){
		aa=new sd9();
		aa.init("000105000140000670080002400063070010900000003010090520007200080026000035000409000");
	}
	console.timeEnd("b");
}

sdmain.solve = function(arr){
	if(arr.length!=81) return false;
	for(let i=0;i < 81;i++){
		if(isNaN(parseInt(arr[i]))) return false;
	}
	var sd=new sd9();
	sd.init(arr);
	for(;sd.fcnt < 81;){
		if(sd.findSingleModeA()) continue;
		if(sd.findHSingleRB()) continue;
		if(sd.findHSingleC()) continue;
		break;
	}
	if(sd.fcnt==81){
		var aa=sdmain.prjtions.atoarr;
		var narr=new Array(81).fill(0);
		for(let i=0;i < 81;i++){
			narr[i]=sd.arr[aa[i]]+1;
		}
	} return sdui.loadPuzzle(1,narr);
}

sdmain.a = sdmain.tools.genBitsR(9);

sdmain.ab= sdmain.tools.get2Bits();

sdmain.b = [0x00,0x03,0x06,0x30,0x33,0x36,0x60,0x63,0x66];

sdmain.c = [0x00,0x01,0x02,0x10,0x11,0x12,0x20,0x21,0x22];

sdmain.ensd36 = function(input){
	//only processes 0-35
	return "0123456789abcdefghijklmnopqrstuvwxyz"[input];
}

sdmain.desd36 = function(char_in){
	//only processes charCodes
	if(typeof(char_in)!="number"){
		//console.log("desd36 type error");
		return 44;
	}
	char_in=(char_in|32)-48;
	if(char_in > 74 | char_in < 0){
		//console.log("desd36 input error");
		return 44;
	}else{
		if(char_in < 10) return char_in;
		else if(char_in < 49){
			//console.log("desd36 input error");
  		return 44;
		}else return char_in-39;
	}
}

sdmain.prjtions = {
	//performance enhancements
	atoarr:[0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,
	        0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,
	        0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,
	        0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,
	        0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47,0x48,
	        0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57,0x58,
	        0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x68,
	        0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,
	        0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87,0x88],
	arr:[16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,
	     16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0],
	wrcache:[0b111111000,0b111000111,0b000111111],
	wccache:[0b110110110,0b101101101,0b011011011],
	cllcan:[0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,
	        0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff],
	rcbcan:[0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0,
	        0,0,0,0,0,0,0,0,0],
	bitInBox:[1,2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,
	          8,16,32,0,0,0,0,0,0,0,0,0,0,0,0,0,
	          64,128,256],
	whichRow:[0,0,0,0,0,0,0,0,0,
	          1,1,1,1,1,1,1,1,1,
	          2,2,2,2,2,2,2,2,2,
	          3,3,3,3,3,3,3,3,3,
	          4,4,4,4,4,4,4,4,4,
	          5,5,5,5,5,5,5,5,5,
	          6,6,6,6,6,6,6,6,6,
	          7,7,7,7,7,7,7,7,7,
	          8,8,8,8,8,8,8,8,8],
	whichCol:[0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8,
	          0,1,2,3,4,5,6,7,8],
	whichBox:[0,0,0,1,1,1,2,2,2,
            0,0,0,1,1,1,2,2,2,
            0,0,0,1,1,1,2,2,2,
            3,3,3,4,4,4,5,5,5,
            3,3,3,4,4,4,5,5,5,
            3,3,3,4,4,4,5,5,5,
            6,6,6,7,7,7,8,8,8,
            6,6,6,7,7,7,8,8,8,
            6,6,6,7,7,7,8,8,8],
  whichRowiB:[0,1,2,0,1,2,0,1,2,
              3,4,5,3,4,5,3,4,5,
              6,7,8,6,7,8,6,7,8,
              0,1,2,0,1,2,0,1,2,
              3,4,5,3,4,5,3,4,5,
              6,7,8,6,7,8,6,7,8,
              0,1,2,0,1,2,0,1,2,
              3,4,5,3,4,5,3,4,5,
              6,7,8,6,7,8,6,7,8],
  whichCelliB: [[0,1,2,9,10,11,18,19,20],
	              [3,4,5,12,13,14,21,22,23],
	              [6,7,8,15,16,17,24,25,26],
	              [27,28,29,36,37,38,45,46,47],
	              [30,31,32,39,40,41,48,49,50],
	              [33,34,35,42,43,44,51,52,53],
	              [54,55,56,63,64,65,72,73,74],
	              [57,58,59,66,67,68,75,76,77],
	              [60,61,62,69,70,71,78,79,80]]
}

