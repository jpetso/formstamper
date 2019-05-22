# formstamper
Formstamper: work-in-progress GUI application (using Electron) for batch filling PDF forms

This README is subject to change since formstamper is still undergoing major development.

Development Roadmap
Formstamper has yet to reach a stage that can be considered minimally viable. The remaining
feature to be coded is a modal that allows users to specify the naming pattern for the
PDFs generated. Other product features undergoing development can be found in the issue
tracker.

A final layout has also not been established.

Testing has not been implemented yet.

Intended Use
The repo has been built using Electron Forge, which can generate .exe files. If you
are a developer who is a part of a group that needs to generate batch PDFs,
you can use Electron Forge's API to distribute copies of the batch PDF generating
program to your users.

Instructions For Developers
PDFtk needs to be installed on your local machine. For more information, see
https://www.pdflabs.com/tools/pdftk-server/.

Built with
Electron Forge
React
PDFtk and pdf.js
