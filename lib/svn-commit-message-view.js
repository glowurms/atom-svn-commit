'use babel';

export default class SvnCommitMessageView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div')
    this.element.classList.add('svn-commit')

    // Create message element
    this.message = document.createElement('div')
    this.message.textContent = 'Please enter a commit message (press Enter when done or ESC to cancel):'
    this.message.classList.add('message')
    this.element.appendChild(this.message)

    this.textArea = document.createElement('textarea')
    this.textArea.classList.add('textArea')
    this.textArea.classList.add('native-key-bindings')
    this.element.appendChild(this.textArea)
  }

  clearTextArea() {
    this.textArea.textContent = ""
  }

  getTextAreaValue() {
    return this.textArea.value
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove()
  }

  getElement() {
    return this.element
  }

}
