//function executed by the trigger
function getECDCHealthData() {
  var aUrl = "https://opendata.ecdc.europa.eu/covid19/hospitalicuadmissionrates/json/";
  var data = getJSON(aUrl);
  if (data.length > 0) {
    writeLatestData(data);
    writeWeeklyData(data);
  }
}

//fetch the data
function getJSON(aUrl) {
  var aUrl_encoded = encodeURI(aUrl);
  var response = UrlFetchApp.fetch(aUrl_encoded); // get feed
  try {
    var data = JSON.parse(response.getContentText());
    return data;
  }
  catch (err) {
    return [];
  }
}

function writeLatestData(data) {
  var sheet, last_row;
  var country_name, next_country_name, indicator_name, next_indicator_name;
  var row, latest_info;
  var columns = ["country", "indicator", "date", "year_week", "value", "source", "url"];
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var write_header = true, sheet_name = "Latest ECDC Health Data", data_grid = [];
  for (var d=0; d < data.length; d++) {
    if (d+1 == data.length) latest_info = true;
    else {
      country_name = data[d].hasOwnProperty("country") ? data[d].country : "Other";
      next_country_name = data[d+1].hasOwnProperty("country") ? data[d+1].country : "Other";
      indicator_name = data[d].hasOwnProperty("indicator") ? data[d].indicator : "Other";
      next_indicator_name = data[d+1].hasOwnProperty("indicator") ? data[d+1].indicator : "Other";
      if (country_name == next_country_name && indicator_name == next_indicator_name) latest_info = false;
      else latest_info = true;      
    }
    if (!latest_info) continue;
    var dt = data[d].hasOwnProperty("date") ? data[d].date : "";
    if (dt && dt < "2020-12-01") continue; //some countries have no recent data
    
    var values = [];
    for (var c in columns) {
      var value = data[d].hasOwnProperty(columns[c]) ? data[d][columns[c]] : "";
      values.push(value);
    }
    data_grid.push(values);
  }
  //write the data to the sheet
  Logger.log("writing " + data_grid.length + " rows"); 
  sheet = doc.getSheetByName(sheet_name) ? doc.getSheetByName(sheet_name) : doc.insertSheet(sheet_name);
  sheet.clear();
  writeHeader(sheet, columns); 
  var row_num = 2, range;
  range = sheet.getRange(row_num, 1, data_grid.length, columns.length);
  range.setValues(data_grid);
}

function writeWeeklyData(data) {
  var d, sheet, last_row, data_grid = [];
  var country_name, next_country_name, indicator_name, next_indicator_name, week_name, next_week_name;
  var row, required_info;
  var columns = ["country", "indicator", "date", "year_week", "value", "source", "url"];
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var write_header = true, sheet_name = "Weekly ECDC Health Data";
  main: for (d=0; d < data.length; d++) {
    if (d+1 == data.length) required_info = true;
    else {
      country_name = data[d].hasOwnProperty("country") ? data[d].country : "Other";
      next_country_name = data[d+1].hasOwnProperty("country") ? data[d+1].country : "Other";
      indicator_name = data[d].hasOwnProperty("indicator") ? data[d].indicator : "Other";
      next_indicator_name = data[d+1].hasOwnProperty("indicator") ? data[d+1].indicator : "Other";

      week_name = data[d].hasOwnProperty("year_week") ? data[d].year_week : "Other";
      next_week_name = data[d+1].hasOwnProperty("year_week") ? data[d+1].year_week : "Other";
      
      if (country_name == next_country_name 
          && indicator_name == next_indicator_name 
          && week_name == next_week_name) 
        required_info = false;
      else required_info = true;      
    }
    if (!required_info) continue;
    var values = [];
    for (var c in columns) {
      var value = data[d].hasOwnProperty(columns[c]) ? data[d][columns[c]] : "";
      if (value && columns[c] == "year_week") {
        var transformed_value = yearweekToDate(value);
        values.push(transformed_value);
      }
      else values.push(value);
    }
    data_grid.push(values);
  }
  //write the data to the sheet
  Logger.log("writing " + data_grid.length + " rows"); 
  sheet = doc.getSheetByName(sheet_name) ? doc.getSheetByName(sheet_name) : doc.insertSheet(sheet_name);
  sheet.clear();
  writeHeader(sheet, columns); 
  var row_num = 2, range;
  range = sheet.getRange(row_num, 1, data_grid.length, columns.length);
  range.setValues(data_grid);
}

function writeHeader(sheet, columns) {
  var cell, col_num=1;
  for (var c in columns) {    
    cell = sheet.getRange(1,col_num++);
    cell.setValue(columns[c]);
  }
}

function yearweekToDate(txt) {
  var w_txt = txt.substr(6,2);
  var y_txt = txt.substr(0,4);
  var d = (1 + (Number(w_txt) - 1) * 7);
  var dt = new Date(Number(y_txt), 0, d);
  var yy_txt = dt.getFullYear().toString();
  var mm = dt.getMonth() + 1;
  var mm_txt = mm < 10 ? "0" + mm.toString() : mm.toString();
  var dd = dt.getDate();
  var dd_txt = dd < 10 ? "0" + dd.toString() : dd.toString();
  return yy_txt + "-" + mm_txt + "-" + dd_txt;
}
