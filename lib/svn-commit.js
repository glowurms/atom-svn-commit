'use babel'

const {spawn} = require('child_process')

import SvnCommitAlertView from './svn-commit-alert-view'
import SvnCommitMessageView from './svn-commit-message-view'
import SvnCommitOutputLogView from './svn-commit-output-log-view'
import { CompositeDisposable } from 'atom'

export default {
  svnCommitAlertView: null,
  svnCommitMessageView: null,
  svnCommitOutputLogView: null,

  commitAlertModal: null,
  commitMessageModal: null,
  commitLogPanel: null,

  filePath: null,
  fileSaved: null,
  fileReadyToCommit: null,
  fileIsWorkingCopy: null,

  commitLogMessage: null,

  alertTextSaveFile: 'Please save file before committing.',
  alertTextNoChanges: 'No changes to commit.',
  alertTextNotWorkingCopy: 'File not SVN working copy.',

  subscriptions: null,

  activate(state) {
    console.log('--- Activate svn-commit package ---')
    this.svnCommitAlertView = new SvnCommitAlertView(state.svnCommitMessageViewState)
    this.svnCommitMessageView = new SvnCommitMessageView(state.svnCommitMessageViewState)
    this.svnCommitOutputLogView = new SvnCommitOutputLogView(state.svnCommitOutputLogViewState)

    this.commitAlertModal = atom.workspace.addModalPanel({
      item: this.svnCommitAlertView.getElement(),
      visible: false
    })

    this.commitMessageModal = atom.workspace.addModalPanel({
      item: this.svnCommitMessageView.getElement(),
      visible: false,
      autoFocus: true
    })

    this.commitLogPanel = atom.workspace.addBottomPanel({
      item: this.svnCommitOutputLogView.getElement(),
      visible: false
    })

    // Commit log message modal interaction
    this.commitMessageModal.item.onkeyup = (event) => {
      if(event.code == "Escape"){
        console.log('--- Bailed on commit. ---')
        this.resetEverything();
      }

      if(event.code == "Enter" && !event.shiftKey){
        console.log('--- Proceed to commit. ---')
        this.svnCommitFile()
      }
    }

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'svn-commit:commit': () => this.beginCommit()
    }))

    this.closeMessageAlertModal = this.closeMessageAlertModal.bind(this)
    this.closeOutputLog = this.closeOutputLog.bind(this)

    this.resetEverything()
  },

  resetData(){
    this.fileSaved = false
    this.fileReadyToCommit = false
    this.fileIsWorkingCopy = true
    this.commitLogMessage = ""
  },

  resetListeners(){
    atom.workspace.getElement().removeEventListener('keyup', this.closeMessageAlertModal)
    atom.workspace.getElement().removeEventListener('keyup', this.closeOutputLog)
  },

  resetEverything(){
    this.commitAlertModal.hide()
    this.commitMessageModal.hide()
    this.commitLogPanel.hide()

    this.svnCommitAlertView.clearAlert()
    this.svnCommitMessageView.clearTextArea()
    this.svnCommitOutputLogView.clearLog()

    this.resetListeners()
    this.resetData()
  },

  closeMessageAlertModal(event){
    if(event.code == "Escape"){
      console.log('--- Bailed out of SVN commit. ---')
      atom.workspace.getElement().removeEventListener('keyup', this.closeMessageAlertModal)
      this.commitAlertModal.hide()
      this.commitMessageModal.hide()
      this.resetData()
    }
  },

  closeOutputLog(event){
    if(event.code == "Escape"){
      console.log('--- Close Output Log. ---')
      this.resetEverything()
    }
  },

  beginCommit() {
    console.log('--- Begin SVN commit interaction ---')

    // Bail interactions
    atom.workspace.getElement().addEventListener("keyup", this.closeMessageAlertModal)

    this.filePath = atom.workspace.getActiveTextEditor().getBuffer().getPath()
    this.fileSaved = !atom.workspace.getActiveTextEditor().getBuffer().isModified()

    if(!this.fileSaved){
      this.svnCommitAlertView.setAlert(this.alertTextSaveFile)
      this.commitAlertModal.show()

    }else{
      var svnStatus = spawn('svn',['status',`${this.filePath}`])

      svnStatus.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
        var dataString = data.toString()
        var svnStatusModifiedMatch = new RegExp('^M.*'+this.filePath)
        var svnStatusNotWorkingCopy = new RegExp(this.filePath+".*not a working copy")

        if(svnStatusModifiedMatch.test(dataString)){
          this.fileReadyToCommit = true
        }
      })

      svnStatus.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
        var dataString = data.toString()
        var svnStatusNotWorkingCopy = new RegExp(this.filePath+".*not a working copy")

        if(svnStatusNotWorkingCopy.test(dataString)){
          this.fileIsWorkingCopy = false
        }
      })

      svnStatus.on('close', (code) => {
        if(this.fileReadyToCommit && this.fileIsWorkingCopy){
          console.log(`--- File is working copy, and ready to commit ---`)
          this.commitMessageModal.show()

        } else if (!this.fileReadyToCommit && this.fileIsWorkingCopy){
          console.log(`--- No changes to commit ---`)
          this.svnCommitAlertView.setAlert(this.alertTextNoChanges)
          this.commitAlertModal.show()

        } else if (!this.fileIsWorkingCopy){
          console.log(`--- File is not working copy ---`)
          this.svnCommitAlertView.setAlert(this.alertTextNotWorkingCopy)
          this.commitAlertModal.show()
        }
      })
    }
  },

  svnCommitFile() {
    console.log('--- Begin SVN commit command. ---')

    // Close commit log interaction
    atom.workspace.getElement().addEventListener("keyup", this.closeOutputLog)

    this.commitLogMessage = this.svnCommitMessageView.getTextAreaValue()
    this.svnCommitOutputLogView.clearLog()

    this.commitMessageModal.hide()
    this.commitLogPanel.show()

    console.log(this.commitLogMessage)

    var svnCommit = spawn('svn',['ci','-m', `${this.commitLogMessage}`, `${this.filePath}`])

    svnCommit.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
      this.svnCommitOutputLogView.appendLog(data.toString())
    })

    svnCommit.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`)
      this.svnCommitOutputLogView.appendLog(data.toString())
    })

    svnCommit.on('close', (code) => {
      console.log(`--- SVN commit command finished. ---`)
      this.svnCommitOutputLogView.appendLog('(Press ESC to close output log)')
    })
  }
}
