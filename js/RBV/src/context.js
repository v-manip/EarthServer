var RBV = RBV || {};

/**
 * @class Context: Defines data and state for a model. Changes to the visualization
 * of a model are done solely via the context object.
 */
RBV.Context = function(opts) {
	this.toi = opts.toi || null;
	if (typeof opts.aoi !== 'undefined') {
		this.aoi = opts.aoi[0];
		this.aoi.push(opts.aoi[1]);
		this.aoi.push(opts.aoi[2]);
	} else {
		this.aoi = null;
	}

	this.providers = {};
};

RBV.Context.prototype.setToI = function(timespan) {
	this.toi = timespan;
};

RBV.Context.prototype.setAoI = function(bbox, min_height, max_height) {
	this.aoi = bbox;
	this.aoi.push(min_height, max_height);
};

RBV.Context.prototype.addProvider = function(type, id, provider) {
	var provider_desc = {
		id: id,
		provider: provider
	};

	if (!this.providers[type]) {
		this.providers[type] = [];
	}
	this.providers[type].push(provider_desc);
};

RBV.Context.prototype.getProvider = function(type, id) {
	if (!this.providers[type]) {
		return null;
	}

	for (var idx = 0; idx < this.providers[type].length; idx++) {
		if (this.providers[type][idx].id === id) {
			return this.providers[type][idx].provider;
		}
	};

	return null;
};