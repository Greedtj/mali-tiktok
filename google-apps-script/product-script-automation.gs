const CONFIG = {
  spreadsheetId: 'yu5EvxDlFBNMV6jHRA7Wm_5oEBywDzWnSo6E3Y0',
  sheetName: '',
  productColumnName: 'product_name',
  maxRowsPerRun: 10,
  model: 'gpt-4.1-mini',
  statusDone: 'DONE',
  statusError: 'ERROR',
  outputColumns: [
    'Environment',
    'Keyword',
    'Product_Detail',
    'script',
    'title',
    'raw_json',
    'automation_status',
    'automation_updated_at'
  ]
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Product Script')
    .addItem('Run now', 'runProductScriptAutomation')
    .addItem('Install hourly trigger', 'installHourlyTrigger')
    .addToUi();
}

function runProductScriptAutomation() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in Script Properties.');
  }

  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = CONFIG.sheetName
    ? spreadsheet.getSheetByName(CONFIG.sheetName)
    : spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error('Sheet not found.');
  }

  const headerMap = ensureHeaders_(sheet);
  const productCol = headerMap[CONFIG.productColumnName];
  if (!productCol) {
    throw new Error('Missing required column: ' + CONFIG.productColumnName);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const statusCol = headerMap.automation_status;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let processed = 0;

  for (let index = 0; index < rows.length; index++) {
    if (processed >= CONFIG.maxRowsPerRun) break;

    const rowNumber = index + 2;
    const row = rows[index];
    const productName = String(row[productCol - 1] || '').trim();
    const status = String(row[statusCol - 1] || '').trim();

    if (!productName || status === CONFIG.statusDone) continue;

    try {
      const generated = generateProductJson_(apiKey, productName);
      writeGeneratedResult_(sheet, headerMap, rowNumber, generated);
      processed++;
    } catch (error) {
      sheet.getRange(rowNumber, headerMap.automation_status).setValue(CONFIG.statusError + ': ' + error.message);
      sheet.getRange(rowNumber, headerMap.automation_updated_at).setValue(new Date());
      processed++;
    }
  }
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'runProductScriptAutomation')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('runProductScriptAutomation')
    .timeBased()
    .everyHours(1)
    .create();
}

function ensureHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(value => String(value).trim());

  CONFIG.outputColumns.forEach(columnName => {
    if (!headers.includes(columnName)) {
      headers.push(columnName);
      sheet.getRange(1, headers.length).setValue(columnName);
    }
  });

  return headers.reduce((map, header, index) => {
    if (header) map[header] = index + 1;
    return map;
  }, {});
}

function generateProductJson_(apiKey, productName) {
  const prompt = [
    'วิเคราะห์ข้อมูลสินค้าต่อไปนี้: ' + productName,
    'สร้าง Output เป็น Raw JSON เท่านั้น ตามโครงสร้างนี้:',
    '{',
    '  "Environment": "",',
    '  "Keyword": "",',
    '  "Product_Detail": "",',
    '  "script": "",',
    '  "title": ""',
    '}',
    'ข้อกำหนด:',
    'title: เขียนภาษาไทยเกี่ยวกับ product just 10 word with 1 hashtag viral',
    'Environment: เขียนภาษาอังกฤษสั้นๆ สำหรับฉากวิดีโอ TikTok',
    'Keyword: ใส่ keyword ภาษาไทยแบบง่าย อ่านง่าย ไม่ใช้คำยาก เช่น สบาย ผิวใส หอม นุ่ม สดชื่น ดูดี ใช้ง่าย',
    'Product_Detail: อธิบายสินค้าเป็นภาษาไทยแบบสั้น เข้าใจง่าย ไม่เกิน 1 ประโยค',
    'script: เขียนสคริปต์ภาษาไทยสั้นๆ สำหรับวิดีโอสินค้า โทนธรรมชาติ เข้าใจง่าย',
    'ห้ามใส่ Emoji สัญลักษณ์พิเศษ เครื่องหมายตกใจเยอะๆ หรือ Hashtag ยกเว้น title มีได้ 1 hashtag',
    'ห้ามพูดเกินจริง ห้ามเคลมรักษาโรค ห้ามใช้คำโฆษณาแรงเกินไป',
    'output ต้องเป็น JSON เท่านั้น ห้ามมี Markdown หรือคำอธิบายเพิ่ม'
  ].join('\n');

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    payload: JSON.stringify({
      model: CONFIG.model,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. Do not include markdown, comments, or extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_object'
      }
    }),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('OpenAI API error ' + statusCode + ': ' + body);
  }

  const data = JSON.parse(body);
  const content = data.choices[0].message.content;
  const generated = JSON.parse(content);

  return {
    Environment: String(generated.Environment || '').trim(),
    Keyword: String(generated.Keyword || '').trim(),
    Product_Detail: String(generated.Product_Detail || '').trim(),
    script: String(generated.script || '').trim(),
    title: String(generated.title || '').trim()
  };
}

function writeGeneratedResult_(sheet, headerMap, rowNumber, generated) {
  sheet.getRange(rowNumber, headerMap.Environment).setValue(generated.Environment);
  sheet.getRange(rowNumber, headerMap.Keyword).setValue(generated.Keyword);
  sheet.getRange(rowNumber, headerMap.Product_Detail).setValue(generated.Product_Detail);
  sheet.getRange(rowNumber, headerMap.script).setValue(generated.script);
  sheet.getRange(rowNumber, headerMap.title).setValue(generated.title);
  sheet.getRange(rowNumber, headerMap.raw_json).setValue(JSON.stringify(generated));
  sheet.getRange(rowNumber, headerMap.automation_status).setValue(CONFIG.statusDone);
  sheet.getRange(rowNumber, headerMap.automation_updated_at).setValue(new Date());
}
