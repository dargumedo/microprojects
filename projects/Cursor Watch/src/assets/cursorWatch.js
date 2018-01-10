class CursorWatch {
   constructor(input, callback) {
      this.input = input
      this.callback = callback || function(){}
      this.fake = undefined
      this.data = { position: 0, lastPosition: -1, x: 0, y: 0 }
      this.listeners = []
      this.listen()
   }

   listen() {
      this.interval = setInterval(() => this.updateCursorPosition(), 1000/15)
      this.input.addEventListener('scroll', () => this.change())
   }

   updateCursorPosition() {
      this.data.position = this.input.selectionStart
      if(this.data.lastPosition != this.data.position) this.change()
      this.data.lastPosition = this.data.position
   }

   change() {
      this.updateFake()
      this.updateCursorXYPosition()
      this.callback()
   }

   updateCursorXYPosition() {
      var cursor = this.fake.querySelector('cursor')
      this.data.x = cursor.offsetLeft + this.input.offsetLeft - this.input.scrollLeft
      this.data.y = cursor.offsetTop + this.input.offsetTop - this.input.scrollTop
   }

   updateFake() {
      console.log('wtf')
      if(!this.fake) this.fake = document.createElement('div')
      this.fake.style.cssText = document.defaultView.getComputedStyle(this.input, "").cssText;
      this.fake.style.left = this.input.offsetLeft + 'px'
      this.fake.style.top = this.input.offsetTop + 'px'
      this.fake.style.pointerEvents = "none"
      this.fake.style.visibility = "hidden"
      this.fake.style.position = "fixed"

      var text = this.input.value.split('')
      text.splice(this.data.position, 0, '<cursor style="display:inline-block">|</cursor>')
      this.fake.innerHTML = text.join('')
      document.body.appendChild(this.fake)
   }
}

module.exports = CursorWatch;
