'use babel';

export default class SvnCommitOutputLogView {

  constructor(serializedState) {
    // Create root logOutputContainer
    this.logOutputContainer = document.createElement('div');
    this.logOutputContainer.classList.add('svn-commit-log');

    // Create logOutput element
    this.logOutput = document.createElement('pre');
    this.logOutput.textContent = 'Bleh';
    this.logOutput.classList.add('commit-log-output');
    this.logOutputContainer.appendChild(this.logOutput);
  }

  clearLog() {
    this.logOutput.textContent = ""
  }

  appendLog(text) {
    this.logOutput.textContent = `${this.logOutput.textContent}${text}\n`
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.logOutputContainer.remove();
  }

  getElement() {
    return this.logOutputContainer;
  }

}
