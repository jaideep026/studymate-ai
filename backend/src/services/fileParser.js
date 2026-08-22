// Extracts plain text from an uploaded PDF, PPTX, or DOCX buffer so it can
// feed the same chunk/embed pipeline as pasted text.
const officeParser = require('officeparser');

const EXT_TO_TYPE = {
  pdf: 'pdf',
  pptx: 'pptx',
  ppt: 'pptx',
  docx: 'docx',
  doc: 'docx',
};

const MIME_TO_TYPE = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function detectType(file) {
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  return MIME_TO_TYPE[file.mimetype] || EXT_TO_TYPE[ext] || null;
}

async function extractTextFromFile(file) {
  const fileType = detectType(file);
  if (!fileType) {
    const err = new Error('Unsupported file type. Please upload a PDF, PPTX, or DOCX file.');
    err.status = 400;
    throw err;
  }

  const ast = await officeParser.parseOffice(file.buffer, { fileType });
  const { value: text } = await ast.to('text');

  if (!text || !text.trim()) {
    const err = new Error(
      'Could not find any readable text in that file. Scanned/image-only documents are not supported yet — try a text-based PDF, PPTX, or DOCX.'
    );
    err.status = 422;
    throw err;
  }

  return { text: text.trim(), sourceType: fileType };
}

module.exports = { extractTextFromFile };
