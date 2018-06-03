function Inventory(options) {

   // Setup Rows and Items
   this.init = function(options) {
      this.items = options.items
      this.size = options.size
		this.slots = options.slots
		this.slotSize = options.size.w / this.slots.w
		// HTML
		this.html = { inventory: options.selector }
		// for mousing around
		this.held = {}

      // Create Ruler
      var ruler = document.createElement('ruler')
      for(var i = 0; i < this.slots.w*this.slots.h; i++) {
			var box = document.createElement('box')
			box.style.width = this.slotSize + 'px'
			box.style.height = this.slotSize + 'px'
         ruler.appendChild(box)
      }

      this.html.inventory.appendChild(ruler)

      for(var itemID in this.items) {
			var item = this.items[itemID]
			item.id = itemID
			item.inventory = this
         item.html = document.createElement('item')
			item.html.style.width = item.w * (this.size.w / this.slots.w) + 'px'
			item.html.style.height = item.h * (this.size.h / this.slots.h) + 'px'
			item.html.style.setProperty('--xpos', item.x * (this.size.w / this.slots.w) + 'px')
			item.html.style.setProperty('--ypos', item.y * (this.size.h / this.slots.h) + 'px')
			item.html.innerHTML = `<icon style="background: ${item.color}"><content>${item.content}</content></icon>`
			// listen
			item.html.addEventListener('mousedown', function(e) {
				if(this.inventory.held.html) {
					this.inventory.drop()
				}
				this.inventory.html.inventory.classList.add('holding')
				e.target.classList.add('held')
				this.inventory.held.item = this
				this.inventory.held.html = e.target
				this.inventory.held.offset = { x: e.offsetX, y: e.offsetY }
				this.inventory.held.x = this.inventory.held.item.x * this.inventory.slotSize
				this.inventory.held.y = this.inventory.held.item.y * this.inventory.slotSize
				this.inventory.held.lastX = this.inventory.held.x
				this.inventory.held.lastY = this.inventory.held.y
			}.bind(item))

         this.html.inventory.appendChild(item.html)
      }

		this.html.inventory.addEventListener('mousemove', function(e) {
			if(this.held.html && !this.held.moving) {
				this.held.x = e.clientX - this.html.inventory.offsetLeft - this.held.offset.x
				this.held.y = e.clientY - this.html.inventory.offsetTop - this.held.offset.y

				// duplicate code again! why not just continue the trend :]
				// cmon I am in the middle of a mission can I please just code?
				// pls proceed <3
				var xover = this.held.x % this.slotSize
				var yover = this.held.y % this.slotSize

				// all over the place but that is a interesting offset nearest slot move
				var x = this.held.x + (xover < this.slotSize/2 ? -xover : this.slotSize - xover)
				var y = this.held.y + (yover < this.slotSize/2 ? -yover : this.slotSize - yover)

				x = x / this.slotSize
				y = y / this.slotSize


				var direction = { x: Math.sign(x - this.held.lastX), y: Math.sign(y - this.held.lastY) }
				if(direction.x || direction.y) {
					// going to use this for if we are inside.
					// the direction is not based off safe pos
					this.held.lastX = x
					this.held.lastY = y

					var oldx = this.held.item.x
					var oldy = this.held.item.y
					this.held.item.x = x
					this.held.item.y = y

					var outOfBounds = this.outOfBounds(this.held.item)
					var collisions = this.collisions(this.held.item)
					var notNudged = collisions.length ? this.nudge(collisions, direction) : []
					var cantTrade = this.trade(this.held.item, notNudged, direction)

					if(outOfBounds || (notNudged.length && cantTrade.length)) {
						this.held.item.x = oldx
						this.held.item.y = oldy
					}
				}



				this.held.moving = false
			}
		}.bind(this))


		document.body.addEventListener('mouseup', function() { this.drop() }.bind(this))
		this.html.inventory.addEventListener('mouseleave', function() { this.drop() }.bind(this))


		this.drop = function() {
			if(!this.held.html) return
			this.html.inventory.classList.remove('holding')
			this.held.html.classList.remove('held')
			this.held.item.x = this.held.item.x
			this.held.item.y = this.held.item.y
			this.held.html.style.setProperty('--xpos', this.held.item.x*this.slotSize+'px')
			this.held.html.style.setProperty('--ypos', this.held.item.y*this.slotSize+'px')
			//this.held.html.style.transform = `translateX(${x + 'px'}) translateY(${y+ 'px'})`;
			this.held.html = undefined
		}

		// going to pump this through an interval/timeout/animationframe
		// this way if the mousemove is called (1000/60)+ times a second it does not overload
		setInterval(function() {
			if(this.held.html) {
				this.held.html.style.setProperty('--xpos', this.held.x+'px')
				this.held.html.style.setProperty('--ypos', this.held.y+'px')
			}
		}.bind(this), 1000/60)
   }

	this.trade = function(item, collisions, direction) {
		cantTrade = []
		for(var collision of collisions) {
			// collect a list of unfair trades
			collision.x -= direction.x * item.w // this is not right
			collision.y -= direction.y * item.h // where are you going scroll back up here
			// console.log('d.x: ' + direction.x + ' d.y: ' + direction.y + ' item.w: ' + item.w + ' item.h: ' + item.h + ' collision.x: ' + collision.x + ' collision.y: ' + collision.y)

			isItSafe = this.collisions(collision)
			tryAndMakeIt = this.nudge(isItSafe, { x: direction.x*-1, y: direction.y*-1 })
			if(tryAndMakeIt.length || this.outOfBounds(collision)) {
				// density
				cantTrade.push(collision)
			}
		}

		makeSureItemNotSad = this.collisions(item).length
		for(var collision of collisions) {
			if(makeSureItemNotSad.length || this.outOfBounds(item) || cantTrade.length) {
				collision.x += direction.x * item.w
				collision.y += direction.y * item.h
			}
			this.move(collision)
		}


		return cantTrade
	}

	this.nudge = function(collisions, direction) {
		var notNudged = []
		for(var collision of collisions) {
			collision.x += direction.x
			collision.y += direction.y

			// aaaaa wat am i even doing
			// this is going to bubble up and snap the fuck in half
			var isItemLegal = this.collisions(this.held.item)
			if(this.outOfBounds(collision) || this.nudge(this.collisions(collision), direction).length || isItemLegal.length) {
				notNudged.push(collision)
			}

		}

		for(var falllllback of collisions) {
			if(notNudged.indexOf(falllllback) >= 0) {
				falllllback.x -= direction.x
				falllllback.y -= direction.y
				continue
			}

			this.move(falllllback)
		}

		return notNudged
	}

	// sure you want to run with this?
	this.collisions = function(otherItem) {
		var collisions = []
		for(var item of this.items) {
			this.collision(item, otherItem) && collisions.push(item)
		}
		return collisions
	}

	this.collision = function(item, otherItem) {
		var collisionParameters = [
			item.id != otherItem.id,
			item.x*this.slotSize + item.w*this.slotSize > otherItem.x*this.slotSize,
			item.y*this.slotSize + item.h*this.slotSize > otherItem.y*this.slotSize,
			item.x*this.slotSize < otherItem.x*this.slotSize + otherItem.w*this.slotSize,
			item.y*this.slotSize < otherItem.y*this.slotSize + otherItem.h*this.slotSize ]

		// for the <3 of console.log
		// console.log(collisionParameters)
		return collisionParameters.every(u=>u)
	}

	this.outOfBounds = function(item) {
		if(item.x*this.slotSize < 0) return true
		if(item.y*this.slotSize < 0) return true
		if(item.x*this.slotSize+item.w*this.slotSize > this.size.w) return true
		if(item.y*this.slotSize+item.h*this.slotSize > this.size.h) return true

		return false
	}

	this.move = function(item) {
		// sort of like render but it's not
		item.html.style.setProperty('--xpos', item.x*this.slotSize+'px')
		item.html.style.setProperty('--ypos', item.y*this.slotSize+'px')
	}

   this.init(options)
}

var inventory = new Inventory({
   selector: document.querySelector('inventory'),
	size: { w: 300, h: 300 },
   slots: { w: 4, h: 4 },
   items: [
      { x:0, y:0, w:2, h:2, content: "2x2", color: '#ffd54f' },
      { x:2, y:0, w:1, h:2, content: "1x2", color: '#66bb6a' },
      { x:3, y:3, w:1, h:1, content: "1x1", color: '#e53935' },
      { x:0, y:3, w:3, h:1, content: "3x1", color: '#9575cd' },
      { x:0, y:2, w:4, h:1, content: "4x1", color: '#29b6f6' },
   ]
})
