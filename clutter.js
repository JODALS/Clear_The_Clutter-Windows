import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'

function pickFolder() {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select the folder you want to organize"
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
if ($dialog.ShowDialog($form) -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}
`
    const tempScriptPath = path.join(os.tmpdir(), 'pickFolder.ps1')
    fs.writeFileSync(tempScriptPath, psScript)

    try {
        const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}"`, { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim()
        return result
    } catch (error) {
        console.error('PowerShell error:', error.message)
        return ''
    } finally {
        fs.unlinkSync(tempScriptPath)
    }
}

const dir = pickFolder()

if (!dir) {
    console.error('No folder selected. Exiting.')
    process.exit(1)
}

console.log('Organizing:', dir)

fs.readdirSync(dir).forEach(file => {
    const ext = path.extname(file)
    if (ext === '') return

    const folderName = ext.slice(1).toUpperCase()

    try {
        fs.mkdirSync(path.join(dir, folderName), { recursive: true })
    } catch (error) {
        console.error('Error occurred while creating directory:', error)
    }

    try {
        fs.renameSync(path.join(dir, file), path.join(dir, folderName, file))
    } catch (error) {
        console.error('Error occurred while renaming file:', error)
    }
})

console.log('Done sorting:', dir)