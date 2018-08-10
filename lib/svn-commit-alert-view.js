'use babel';

export default class SvnCommitAlertView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div')
    this.element.classList.add('svn-commit')

    // Create message element
    this.message = document.createElement('h1')
    this.message.textContent = 'Alert'
    this.message.classList.add('message')
    this.element.appendChild(this.message)

    // Create message element
    this.closeMessage = document.createElement('p')
    this.closeMessage.textContent = '(Press ESC to close)'
    this.closeMessage.classList.add('close-message')
    this.element.appendChild(this.closeMessage)
  }

  clearAlert() {
    this.message.textContent = ""
  }

  setAlert(text) {
    this.message.textContent = text
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove()
  }

  getElement() {
    return this.element
  }

}
