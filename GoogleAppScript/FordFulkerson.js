function Node (data) {
	this.data = data;
}

function Edge (src, dst, capacity, flow) {
	this.src = src;
	this.dst = dst;
	this.capacity = capacity;
	this.flow = flow;
}

function edgePair (src, dst, capacity, flow) {
	var a = new Edge(src, dst, capacity, flow);
	var b = new Edge(dst, src, capacity, capacity-flow);
	a.reciprocal = b;
	b.reciprocal = a;
	return [a,b];
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
	'initUserEdges': {
		value: function () {
			for (var i in this.users) {
				var user = this.users[i];
				var edgeToSink = this.addEdgePair(user, this.sink, user.data.maxRegistrations, 0);
				for (var h in lists) {
					var flow = 1 - h; // registrations have flow; waitlists need to wait on pathfinding
					var list = lists[h];
					for (var j in list) {
						var sess = list[j];
						if (user.data.needsBow) {
							if (user.data.needsBow == RIGHT) {
								this.addEdgePair(this.R[sess], user, 1, flow);
								this.addEdgePair(this.X[sess], this.R[sess], 1, flow)
							} else if (user.data.needsBow == LEFT) {
								this.addEdgePair(this.L[sess], user, 1, flow);
								this.addEdgePair(this.X[sess], this.L[sess], 1, flow)
							} else {
								throw new Exception('badddd');
							}
						} else {
							this.addEdgePair(this.X[sess], user, 1, flow);
						}
						this.getEdge(this.source, this.X[sess]).flow += flow;
						this.getEdge(user, this.sink).flow += flow;
					}
				}
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
			value: function () {
				var queue = [this.source];
				var hist  = {this.source:true}; // node => inbound edge
				while (queue.length()) {
					var node = queue.shift();
					if (hist[node]) continue;
					for (e in node.edges) {
						var edge = node.edges[e];
						if (hist[edge.dst]) continue;
						hist[edge.dst] = edge;
						if (edge.capacity == edge.flow) continue;
						queue.push(edge.dst);
						if (edge.dst == this.sink) {
							this.path = [];
							for (var u = edge.dst; u != this.source; u = hist[u].src)
								this.path.push(hist[u]);
							return true;
						}
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
