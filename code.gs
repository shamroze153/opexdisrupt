
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tabName = (e && e.parameter && e.parameter.tab) || "data";
    const sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Tab '" + tabName + "' not found." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const values = sheet.getDataRange().getValues();
    if (values.length < 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const headers = values[0].map(h => String(h).trim());
    const rows = values.slice(1);

    const jsonData = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        let val = row[i];
        if (typeof val === 'string') val = val.trim();
        
        let key = header;
        // Mapping for Energy Tab
        if (tabName === "data") {
          if (header.toLowerCase().includes("meter no")) key = "meterNumber";
          else if (header.includes("7–8 PM")) key = "units_7_8";
          else if (header.includes("8–9 PM")) key = "units_8_9";
          else if (header.includes("9 PM–Next 10 AM")) key = "units_9_10am_next";
          else key = header.toLowerCase().replace(/ /g, "_");
        } 
        // Mapping for SFM Tab
        else if (tabName === "sfm") {
          key = header.toLowerCase().replace(/ /g, "_");
        }
        else {
          key = header.toLowerCase().replace(/ /g, "_");
        }
        
        obj[key] = val;
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
