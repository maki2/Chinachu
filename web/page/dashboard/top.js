P = Class.create(P, {
	
	init: function _initPage() {
		this.view.content.className = 'loading';
		
		this.draw();
		
		return this;
	},
	
	deinit: function _deinit() {
		this.view.reservesTl.remove();
		this.view.recordingTl.remove();
		this.view.recordedTl.remove();
		
		return this;
	},
	
	draw: function _draw() {
		this.view.content.className = 'bg-chinachu';
		this.view.content.update();
		
		var Timelist = Class.create(sakura.ui.Container, {
			
			init: function(opt) {
				
				this.name     = opt.name;
				this.list     = opt.initialList;
				this.notify   = opt.notify;
				this.interval = 0;
				
				this.onNotify = this.refresh.bindAsEventListener(this);
				
				document.observe(this.notify, this.onNotify);
				
				return this;
			},
			
			refresh: function(e) {
				this.list.each(function(program) {
					if (program._dt) program._dt.remove() && delete program._dt;
					if (program._it) program._it.remove() && delete program._it;
					if (program._pt) clearTimeout(program._pt);
				});
				
				this.list = e.memo;
				
				this.create();
				
				return this;
			},
			
			create: function() {
				
				this.entity = this.entity || new Element('div', this.attr);
				
				this.entity.show().update();
				
				this.entity.className = '';
				
				if (this.id !== null) this.entity.id = this.id;
				
				if (this.style !== null) this.entity.setStyle(this.style);
				
				if (this.list.length === 0) {
					this.entity.hide();
					
					return this;
				}
				
				this.entity.addClassName('dashboard-timelist');
				
				new sakura.ui.Container({className: 'head'}).insert(
					'OF{0} {1}'.__([this.list.length.toString(10), this.name])
				).render(this.entity);
				
				var container = new sakura.ui.Container({className: 'main'}).render(this.entity);
				
				var currentTime = new Date().getTime();
				
				this.list.each(function(program) {
					
					program._data = chinachu.util.getProgramById(program.id);
					
					program._dt = new chinachu.ui.DynamicTime({
						tagName: 'div',
						type   : 'full',
						time   : (currentTime > program.end) ? program.end : program.start
					});
					
					program._it = new sakura.ui.Element({
						tagName  : 'a',
						className: 'color-cat-' + program.category,
						attr     : { href: '#!/program/view/id=' + program.id + '/' }
					}).insert('<div class="title">' + program.flags.invoke('sub', /.+/, '<span rel="#{0}">#{0}</span>').join('') + program.title + '</div>').insert(
						new sakura.ui.Element({
							tagName  : 'div',
							className: 'channel'
						}).insert(program.channel.type + ': ' + program.channel.name)
					).insert(program._dt).render(container);
					
					if (typeof program.episode !== 'undefined' && program.episode !== null) {
						program._it.insert('<div class="episode">#' + program.episode + '</div>');
					}
					
					var html = new Element('div').insert(program.detail || '(説明なし)');
					
					var contextMenuItems = [
						{
							label   : 'ルール作成...',
							icon    : './icons/regular-expression.png',
							onSelect: function() {
								new chinachu.ui.CreateRuleByProgram(program.id);
							}
						},
						'------------------------------------------',
						{
							label   : 'ツイート...',
							icon    : 'https://abs.twimg.com/favicons/favicon.ico',
							onSelect: function() {
								var left = (screen.width - 640) / 2;
								var top  = (screen.height - 265) / 2;
								
								var tweetWindow = window.open(
									'https://twitter.com/share?url=&text=' + encodeURIComponent(chinachu.util.scotify(program)),
									'chinachu-tweet-' + program.id,
									'width=640,height=265,left=' + left + ',top=' + top + ',menubar=no'
								);
							}
						},
						'------------------------------------------',
						{
							label   : 'SCOT形式でコピー...',
							onSelect: function(e) {
								window.prompt('コピーしてください:', chinachu.util.scotify(program));
							}
						},
						{
							label   : 'IDをコピー...',
							onSelect: function() {
								window.prompt('コピーしてください:', program.id);
							}
						},
						{
							label   : 'タイトルをコピー...',
							onSelect: function() {
								window.prompt('コピーしてください:', program.title);
							}
						},
						{
							label   : '説明をコピー...',
							onSelect: function() {
								window.prompt('コピーしてください:', program.detail);
							}
						},
						'------------------------------------------',
						{
							label   : '関連サイト',
							icon    : './icons/document-page-next.png',
							onSelect: function() {
								window.open("https://www.google.com/search?btnI=I'm+Feeling+Lucky&q=" + program.title);
							}
						},
						{
							label   : 'Google検索',
							icon    : './icons/ui-search-field.png',
							onSelect: function() {
								window.open("https://www.google.com/search?q=" + program.title);
							}
						},
						{
							label   : 'Wikipedia',
							icon    : './icons/book-open-text-image.png',
							onSelect: function() {
								window.open("https://ja.wikipedia.org/wiki/" + program.title);
							}
						}
					];
					
					if (program._data._isRecorded) {
						//
					} else if (program._data._isRecording) {
						contextMenuItems.unshift({
							label   : '録画中止...',
							icon    : './icons/cross.png',
							onSelect: function() {
								new chinachu.ui.StopRecord(program.id);
							}
						});
					} else if (program._data._isReserves) {
						if (program.isManualReserved) {
							contextMenuItems.unshift({
								label   : '予約取消...',
								icon    : './icons/cross-script.png',
								onSelect: function() {
									new chinachu.ui.Unreserve(program.id);
								}
							});
						}
					} else {
						contextMenuItems.unshift({
							label   : '予約...',
							icon    : './icons/plus-circle.png',
							onSelect: function() {
								new chinachu.ui.Reserve(program.id);
							}
						});
					}
					
					new flagrate.ContextMenu({
						target: program._it.entity,
						items : contextMenuItems
					});
					
					var po = new sakura.ui.Popover({
						target: program._it,
						html  : html
					});
					
					if (program.pid && !program.tuner.isScrambling && global.chinachu.status.feature.streamer) {
						var preview = function() {
							if (po.isShowing === false) {
								program._pt = setTimeout(preview, 500);
								return;
							}
							
							new Ajax.Request('./api/recording/' + program.id + '/preview.txt', {
								method    : 'get',
								parameters: {width: 320, height: 180, nonce: new Date().getTime()},
								onSuccess : function(t) {
									html.update('<img src="' + t.responseText + '"><br>' + (program.detail || ''));
									
									delete t.responseText;
									t = null;
									
									if (!this.isRemoved) {
										program._pt = setTimeout(preview, 3000);
									}
								}.bind(this)
							});
						}.bind(this);
						
						program._pt = setTimeout(preview, 1000);
					}
				}.bind(this));
				
				clearInterval(this.interval);
				this.interval = setInterval(function() {
					this.entity.setAttribute('rel', $$('.dashboard-timelist').length);
				}.bind(this), 500);
				
				return this;
			},
			
			remove: function() {
				
				clearInterval(this.interval);
				document.stopObserving(this.notify, this.onNotify);
				
				this.list.each(function(program) {
					if (program._dt) program._dt.remove() && delete program._dt;
					if (program._it) program._it.remove() && delete program._it;
					if (program._pt) clearTimeout(program._pt);
				});
				
				this.entity.remove();
				this.isRemoved = true;
				
				return this;
			}
		});
		
		setTimeout(function() {
			this.view.reservesTl = new Timelist({
				name       : 'RESERVES'.__(),
				initialList: global.chinachu.reserves,
				notify     : 'chinachu:reserves'
			}).render(this.view.content);
		}.bind(this), 30);
		
		setTimeout(function() {
			this.view.recordingTl = new Timelist({
				name       : 'RECORDING'.__(),
				initialList: global.chinachu.recording,
				notify     : 'chinachu:recording'
			}).render(this.view.content);
		}.bind(this), 40);
		
		setTimeout(function() {
			this.view.recordedTl = new Timelist({
				name       : 'RECORDED'.__(),
				initialList: global.chinachu.recorded,
				notify     : 'chinachu:recorded'
			}).render(this.view.content);
		}.bind(this), 50);
		
		return this;
	}
});