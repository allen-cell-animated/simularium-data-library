jQuery(function($) {
  if (typeof BUCKET_URL != 'undefined') {
    var url = BUCKET_URL;
  } else {
    var url = location.protocol + '//' + location.hostname;
  }
  if (typeof EXCLUDE_DIRS != 'undefined') {
    var exclude_dirs = EXCLUDE_DIRS;
  } else {
    var exclude_dirs = [];
  }
  $.get(url)
    .done(function(data) {
      var xml = $(data);
      var files = $.map(xml.find('Contents'), function(item) {
        item = $(item);
        return {
          Key: item.find('Key').text(),
          LastModified: item.find('LastModified').text(),
          Size: item.find('Size').text(),
        }
      });
      renderTable(files, url, exclude_dirs);
    })
    .fail(function(error) {
      alert(url + ' is not accessible, check that everyone has permission to list files and that the CORS policy allows GET from all origins');
      console.log(error);
    });
});

var getExtension = function (filepath) {
  return filepath.split('.').pop();
}

var getFilename = function (filepath) {
  return filepath.split('\\').pop().split('/').pop().split(".").slice(0, -1).join(".").replace(/_/g, " ");
}

var camalize = function camalize(str) {
  return (' ' + str.replace('.h5', '')).toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => " " + chr.toUpperCase()).substring(1);
}

var formatDate = function (str) {
  return new Date(str).toDateString();
}

var formatSize = function (str) {
  var size = Number(str);
  var i = Math.floor( Math.log(size) / Math.log(1024) );
  return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

function renderTable(files, bucket_url, exclude_dirs) {
  var n_files = files.length;
  var n_files_listed = 0;
  var content = '<h3>' + bucket_url + '</h3>';
  content += '<div class="instructions">Found ' + n_files + ' file(s) ';
  if (n_files === 1000)
  {
    content += '<span style="color: red;">(This is the maximum listable)</span>';
  }
  content += '<br/><br/>Choose a file to load in the Simularium Viewer.</div>';
  $.each(files, function(idx, item) {
    var key = item.Key;
    var ext = getExtension(key);
    if (ext === "simularium")
    {
      var exclude = false;
      $.each(exclude_dirs, function(dir) {
        if (key.includes(exclude_dirs[dir]))
        {
          exclude = true;
        }
      });
      if (!exclude)
      {
        var filename = camalize(getFilename(key));
        var link = "https://simularium.allencell.org/viewer?trajUrl=" + bucket_url + "/" + key;
        content += '<a target="_blank" href="' + link + '"><div class="trajectory"><h2>' + filename + '</h2>';
        content += key + '<br/>';
        content += '<span class="label">Modified:</span> ' + formatDate(item.LastModified) + '    ',
        content += '<span class="label">Size:</span> ' + formatSize(item.Size) + '</div></a>';
        n_files_listed++;
      }
    }
  });
  if (n_files > 0 && n_files_listed === 0)
  {
    content += '<div class="error">No .simularium files found in the first 1000 files (alphabetically) that were not in excluded directories.</div>';
  }
  document.getElementById('listing').innerHTML = '<pre>' + content + '</pre>';
}

