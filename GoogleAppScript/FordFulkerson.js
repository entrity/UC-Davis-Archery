function Node (data) {
	this.data = data;
}

function Edge (src, dst, capacity, flow) {
	this.src = src;
	this.dst = dst;
	this.capacity = capacity;
	this.flow = flow;
}

function ResidualNetwork (sessions, users) {
	this.users    = users.map(function (u) { return new Node(u) });
	this.sessions = sessions.map(function (u) { return new Node(u) });
	this.source   = new Node();
	this.sink     = new Node();
	this.edges    = {}; // [src,dst] => {cap, flow, reciprocal, src, dst}
	this.X = {}; this.R = {}; this.L = {}; // sess => Node
}
Object.defineProperties(ResidualNetwork.prototype, {
	'initSessEdges': {
		value: function () {
			for (var i in this.sessions) {
				var sess = this.sessions[i];
				this.addEdgePair(this.source, this.X[sess], N_TARGETS, 0);
				this.addEdgePair(this.X[sess], this.R[sess], N_RBOWS, 0)
				this.addEdgePair(this.X[sess], this.L[sess], N_LBOWS, 0)
			}
		},

	},
	// todo : define node.edges as a priority queue
	// todo define waitlist on user
	// todo don't assign to most preferred yet
	'initUserEdges': {
		value: function () {
			// Initialize priority queue for users (entering sink)
			this.sink.inboundEdges = PriorityQueue(function (edgeA, edgeB) {
				var a = edgeA.src; // user A
				var b = edgeB.src; // user B
				var d =
					(a.registrations.length - b.registrations.length) // favour low ct
					|| (a.timestamp - b.timestamp) // favour low timestamp
					|| -(a.isMember - b.isMember); // favour members
				return d <= 0;
			});
			// Create edges
			for (var i in this.users) {
				var user = this.users[i];
				var edgeToSink = this.addEdgePair(user, this.sink, user.data.maxRegistrations, 0);
				for (var j in user.waitlist) {
					var sess = user.waitlist[j];

					// Set inbound edges based on resources X, R, L
					if (user.data.needsBow) {
						if (user.data.needsBow == RIGHT) {
							this.addEdgePair(this.R[sess], user, 1, 0);
							this.addEdgePair(this.X[sess], this.R[sess], 1, 0)
						} else if (user.data.needsBow == LEFT) {
							this.addEdgePair(this.L[sess], user, 1, 0);
							this.addEdgePair(this.X[sess], this.L[sess], 1, 0)
						} else {
							throw new Exception('badddd');
						}
					} else {
						this.addEdgePair(this.X[sess], user, 1, 0);
					}

				}

				// Set outbound edges (to sink) based on maxRegistrations
				var user2Sink = this.addEdgePair(user, this.sink, user.maxRegistrations, 0);
				this.sink.inboundEdges.push(user2Sink);
			}
		},
		'getEdge': {
			value: function (src, dst) {
				return this.edges[[src, dst]];
			},
		},
		'addEdgePair': {
			value: function (a, b, capacity, abFlow) {
				var a = new Edge(a, b, capacity, abFlow);
				var b = new Edge(b, a, capacity, capacity - abFlow);
				a.reciprocal = b;
				b.reciprocal = a;
				return a;
			},
		},
		'pathfind': {
			// Do search from sink to source so that priority queue has users all at the same level
			value: function () {
				var queue = [this.sink]; // search frontier
				var hist  = {this.sink:true}; // node => outbound edge
				while (queue.length()) {
					var node = queue.shift();
					if (hist[node]) continue;
					var inQueue = node.inboundEdges;
					var outQueue = 
					while ( ! pQueue.isEmpty() ) {
						var edge = pQueue.pop();
						if (hist[edge.src]) continue;
						hist[edge.src] = edge;
						if (edge.capacity == edge.flow) continue;
						queue.push(edge.src);
						if (edge.src == this.source) {
							this.path = [];
							for (var u = edge.src; u != this.sink; u = hist[u].dst)
								this.path.push(hist[u]);
							return true;
						}
						if (edge.isEligible()) pQueue.push(edge);
					}
				}
				return false;
			},
		},
		'fordFulkerson': {
			value: function () {
				// find max flow
				while (true) {
					if (!this.pathfind()) break;
					for (var i in this.path) {
						var edge = this.path[i];
						edge.flow ++;
						edge.reciprocal.flow --;
					}
				}
				// return paths (todo)
			},
		},
	},
});
