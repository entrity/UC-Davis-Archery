MEMBERSHIP_FIELDS = ['firstName','lastName','isB2HDone','isPaid','attendanceCt','signupCt','paymentType','signupTimestamp','class','phone','studentId','memberType','email',]
MEMBERSHIP_STUDENT_ID_COL = 1 + MEMBERSHIP_FIELDS.indexOf('studentId');
N_BALES             = 15;
N_BALE_OPENINGS     = 4 * N_BALES;
N_BOWS_LEFT_HANDED  = 4;
N_BOWS_RIGHT_HANDED = 30;

function Node (data, name) {
	this.data = data;
	this.name = name;
	this.inboundEdges = [];
	this.outboundEdges = [];
}

function Edge (src, dst, capacity, flow) {
	this.src = src;
	this.dst = dst;
	this.capacity = capacity;
	this.flow = flow;
}
Object.defineProperties(Edge.prototype, {
	'str': {
		value: function () {
			return '( '+this.src.name+' :: '+this.dst.name+' :: <'+this.capacity+','+this.flow+'> )';
		},
	},
});

function ResidualNetwork (sessions, users) {
	this.users    = users.map(function (u) { return new Node(u, u.name) });
	this.sessions = sessions;
    Logger.log('START BUILDING NET...');
	this.source   = new Node(null, 'source');
	this.sink     = new Node(null, 'sink');
	this.edges    = []; // [src,dst] => {cap, flow, reciprocal, src, dst}
	this.S = {}; this.X = {}; this.R = {}; this.L = {}; // sess.name => Node
	this.initSessEdges();
	this.initUserEdges();
	Logger.log('NET BUILT');
}
Object.defineProperties(ResidualNetwork.prototype, {
	'initSessEdges': {
		value: function () {
			for (var i in this.sessions) {
				var sess = this.sessions[i];
				this.S[sess.name] = new Node(sess, sess.name);
				this.X[sess.name] = new Node(sess, 'X_'+sess.name);
				this.R[sess.name] = new Node(sess, 'R_'+sess.name);
				this.L[sess.name] = new Node(sess, 'L_'+sess.name);
				this.addEdgePair(this.source, this.S[sess.name], N_BALE_OPENINGS, 0);
				this.addEdgePair(this.S[sess.name], this.X[sess.name], N_BALE_OPENINGS, 0)
				this.addEdgePair(this.S[sess.name], this.R[sess.name], N_BOWS_RIGHT_HANDED, 0)
				this.addEdgePair(this.S[sess.name], this.L[sess.name], N_BOWS_LEFT_HANDED, 0)
			}
		},
	},
	'initUserEdges': {
		value: function () {
			// Create edges
			Logger.log('initUserEdges');
			for (var i in this.users) {
				var user = this.users[i];
				// Get Resource node dict for this user's needs
				var upstreamDict;
				if (user.data.borrowBow) {
					if (user.data.borrowRightBow) {
						upstreamDict = this.R;
					} else if (user.data.borrowLeftBow) {
						upstreamDict = this.L;
					} else {
						throw new Exception('badddd');
					}
				} else {
					upstreamDict = this.X;
				}
				// Create outbound edges (to sink) based on maxRegistrations
				var edgeToSink = this.addEdgePair(user, this.sink, user.data.maxRegistrations, 0);
				// Ensure values in waitlist are valid
				for (var j in user.data.waitlist) {
					var sess = user.data.waitlist[j];
					// Ensure sess is a valid key in this.X
					if (! this.X.hasOwnProperty(sess) ) {
						Logger.log('ERROR.');
						Logger.log(sess);
						Logger.log(j);
						Logger.log(user.data.waitlist);
						Logger.log(this.X);
						return
					}
				}
				/* Create inbound edges, dividing between forward and backward
					so that they will be in an order conducive to pathfinding:
					Edges requiring no trades (forward) will be preferred, and 
					they will be searched in forward order. If they are exhausted
					and a trade is needed, backward edges will be searched in
					backward order so as to postpone trading the user's most
					preferred session. */
				// Create inbound forward edges based on resources X, R, L
				for (var j in user.data.waitlist) {
					var sess = user.data.waitlist[j];
					var ab = this.addSingleEdge(upstreamDict[sess], user, 1, 0, true);
				}
				// Create inbound backward edges based on resources X, R, L
				var n1 = user.data.waitlist.length - 1;
				for (var j = n1; j >= 0; j--) {
					var sess = user.data.waitlist[j];
					var ba = this.addSingleEdge(upstreamDict[sess], user, 1, 0, false);
					var ab = user.inboundEdges[n1 - j];
					ba.reciprocal = ab;
					ab.reciprocal = ba;
				}
			}
		},
	},
	'addEdgePair': {
		value: function (a, b, capacity, abFlow) {
			var ab = this.addSingleEdge(a, b, capacity, abFlow, true);
			var ba = this.addSingleEdge(a, b, capacity, capacity - abFlow, false);
			ab.reciprocal = ba;
			ba.reciprocal = ab;
			// Logger.log('--'+ab.str());
			return a;
		},
	},
	'addSingleEdge': {
		value: function (a, b, capacity, abFlow, isForward) {
			var ab = new Edge(a, b, capacity, abFlow);
			b.inboundEdges.push(ab);
			a.outboundEdges.push(ab);
			this.edges.push(ab);
			return ab;
		}
	},
	'pathfind': {
		// Do search from sink to source so that all are at the same level
		value: function () {
			var queue = [this.sink]; // search frontier
			var hist  = {}; // node => 1
			var path  = {}; // node => outbound edge
			// Logger.log('...pf')
			while (queue.length) {
				var node = queue.shift();
				if (hist[node.name]) continue;
				hist[node.name] = 1;
				for (var ei in node.inboundEdges) {
					var edge = node.inboundEdges[ei];
					var iCare = /Christopher/.test(edge.src.name);
					if (path[edge.src.name]) continue;
					if (edge.capacity == edge.flow) continue;
					queue.push(edge.src);
					path[edge.src.name] = edge;
					if (edge.src == this.source) {
						this.path = [];
						for (var u = this.source; u != this.sink; u = path[u.name].dst) {
							this.path.push(path[u.name]);
						}
						return true;
					}
				}
			}
			return false;
		},
	},
	'fordFulkerson': {
		value: function () {
			this.sink.inboundEdges.sort(cmpEdgesFromUserToSink);
			// find max flow
			while (true) {
				// Sort edges between users and sink
				this.sink.inboundEdges.sort(cmpEdgesFromUserToSink);
				// Find path from sink to source
				if (!this.pathfind()) break;
				// Update flows
				for (var i in this.path) {
					var edge = this.path[i];
					edge.flow ++;
					edge.reciprocal.flow --;
				}
			}
		},
	},
});
function cmpEdgesFromUserToSink (edgeA, edgeB) {
	var a = edgeA.src; // user A
	var b = edgeB.src; // user B
	var d =
		(edgeA.flow - edgeB.flow) // favour low ct
		|| (a.data.timestamp.valueOf() - b.data.timestamp.valueOf()) // favour low timestamp
		|| -(a.data.isMember - b.data.isMember); // favour members
	return d;
}


function tdt() {
	var net = new ResidualNetwork([
		{registrations:[], nRightBows:30, name:'2018-10-14 9:15am (36 openings)', nLeftBows:4, nTargets:60},
		{registrations:[], nRightBows:30, name:'2018-10-14 11:15am (36 openings)', nLeftBows:4, nTargets:60},
	],[
		{borrowBow:false, registrations:[], preferredSession:'2018-10-14 9:15am (36 openings)', isMember:true, weekSessCt:0, studentId:914973045, borrowRightBow:false, tshirt:'(not this week)', borrowLeftBow:false, name:'Christopher Nguyen', waitlist:['2018-10-14 9:15am (36 openings)', '2018-10-14 11:15am (36 openings)'], maxRegistrations:1, email:'aamcqueary@ucdavis.edu', timestamp:new Date('Wed Oct 10 06:01:20 GMT-07:00 2018')},
		{borrowBow:false, registrations:[], preferredSession:'2018-10-14 9:15am (36 openings)', isMember:true, weekSessCt:0, studentId:914973045, borrowRightBow:false, tshirt:'(not this week)', borrowLeftBow:false, name:'Alexis McQueary', waitlist:['2018-10-14 9:15am (36 openings)', '2018-10-14 11:15am (36 openings)'], maxRegistrations:2, email:'aamcqueary@ucdavis.edu', timestamp:new Date('Wed Oct 10 05:01:20 GMT-07:00 2018')},
		{borrowBow:true, registrations:[], preferredSession:'2018-10-14 9:15am (36 openings)', isMember:true, weekSessCt:0, studentId:915355248, borrowRightBow:true, tshirt:'Medium', borrowLeftBow:false, name:'Kylie Sherman', waitlist:['2018-10-14 9:15am (36 openings)'], maxRegistrations:1, email:'krsherman@ucdavis.edu', timestamp:new Date('Wed Oct 10 06:32:19 GMT-07:00 2018')},
	]);
	net.fordFulkerson();
	for (var i in net.users) {
		for (var j in net.users[i].outboundEdges) {
			var edge = net.users[i].outboundEdges[j];
			if (edge.isForward)
				Logger.log(edge.src.name +' '+ edge.flow +' '+ edge.dst.name)
		}

		for (var j in net.users[i].inboundEdges) {
			var edge = net.users[i].inboundEdges[j];
			if (edge.isForward)
				Logger.log(edge.src.name +' '+ edge.flow +' '+ edge.dst.name)
		}
	}
}

tdt()